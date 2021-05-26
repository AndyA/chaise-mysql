const moment = require("moment");
const Promise = require("bluebird");

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const ts = () => moment().format("YYYY/MM/DD HH:mm:ss");

const seqNum = seq => {
  if (!seq) return 0;
  const m = seq.match(/^(\d+)-/);
  return m ? Number(m[1]) : 0;
};

const cmpSeq = (a, b) => cmp(seqNum(a), seqNum(b));

class ChaiseSession {
  constructor(name, cdb, driver, views, opt = {}) {
    this.name = name;
    this.driver = driver;
    this.cdb = cdb;
    this.views = views;

    this.opt = Object.assign(
      {
        batchSize: 100,
        timeout: 10000,
        logger: console
      },
      opt
    );

    this.viewState = null;
  }

  log(msg, ...args) {
    this.opt.logger.log(`[${ts()}] ${this.name} ${msg}`, ...args);
  }

  getStartSequence() {
    const seqs = Object.values(this.viewState).sort(cmpSeq);
    return seqs.length ? seqs[0] : "0";
  }

  async handleBatch(batch, seq) {
    const { driver, viewState } = this;
    const hwm = seqNum(seq);

    for (const { id, table, view } of this.views) {
      const st = seqNum(viewState[id]);
      if (st && st > hwm) {
        this.log(`  skipping ${id} (${st} > ${hwm})`);
        continue;
      }

      this.log(`  updating ${id}`);

      // Run the views
      const recs = [];
      for (const { doc } of batch) {
        const ctx = { emit: rec => recs.push({ _id: doc._id, ...rec }) };
        view.call(ctx, doc);
      }

      // Flush results
      await driver.transaction(async () => {
        const ids = batch.map(o => o.doc._id);
        await driver.bulkDelete(table, "_id", ids);
        await driver.bulkInsert(table, recs);
        await driver.saveViewState(id, seq);
      });

      viewState[id] = seq;
    }
  }

  async start() {
    const { cdb, opt } = this;
    const ids = this.views.map(v => v.id);
    this.viewState = await this.driver.loadViewStates(ids);

    const since = this.getStartSequence();
    this.log(`starting at ${seqNum(since)}`);

    await new Promise((resolve, reject) => {
      let nextSeq = null;
      const { batchSize, timeout } = opt;
      cdb.changesReader
        .start({
          includeDocs: true,
          wait: true,
          batchSize,
          timeout,
          since
        })
        .on("batch", batch => {
          this.log(`got batch ${seqNum(nextSeq)} (${batch.length} docs)`);
          this.handleBatch(batch, nextSeq)
            .then(() => cdb.changesReader.resume())
            .catch(reject);
        })
        .on("seq", seq => (nextSeq = seq))
        .on("error", reject)
        .on("end", resolve);
    });
  }

  async run() {
    const { name } = this;
    while (true) {
      await this.start();
      this.log(`change reader terminated, restarting in 10s`);
      await Promise.delay(10000);
    }
  }

  async cleanup() {
    await this.driver.close();
  }
}

module.exports = ChaiseSession;
