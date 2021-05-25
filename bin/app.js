require("../use");

const config = require("config");
const nano = require("nano");
const mysql = require("mysql2/promise");
const path = require("path");
const fg = require("fast-glob");

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const ps = seq => {
  if (!seq) return 0;
  const m = seq.match(/^(\d+)-/);
  return m ? Number(m[1]) : 0;
};

async function bulkInsert(db, table, recs) {
  if (recs.length === 0) return;
  const cols = Object.keys(recs[0]);
  await db.query("INSERT INTO ?? (??) VALUES ?", [
    table,
    cols,
    recs.map(rec => cols.map(col => rec[col]))
  ]);
}

class Session {
  constructor(name, mdb, cdb, views) {
    this.name = name;
    this.mdb = mdb;
    this.cdb = cdb;
    this.views = views;
    this.viewState = null;
  }

  async loadViewState() {
    const ids = this.views.map(v => v.id);
    const [rows] = await this.mdb.query(
      "SELECT * FROM `_chaise_view_state` WHERE `view_id` IN (?)",
      [ids]
    );
    this.viewState = Object.assign(
      Object.fromEntries(ids.map(id => [id, "0"])),
      Object.fromEntries(
        rows.map(({ view_id, couch_seq }) => [view_id, couch_seq])
      )
    );
  }

  getStartSequence() {
    const seqs = Object.values(this.viewState).sort((a, b) =>
      cmp(ps(a), ps(b))
    );
    return seqs.length ? seqs[0] : "0";
  }

  async setViewState(id, seq) {
    await this.mdb.query(
      "REPLACE INTO `_chaise_view_state` (`view_id`, `couch_seq`) VALUES (?, ?)",
      [id, seq]
    );
    this.viewState[id] = seq;
  }

  async handleBatch(batch, seq) {
    const { name, mdb, viewState } = this;
    const seqNum = ps(seq);

    for (const { id, table, view } of this.views) {
      const st = ps(viewState[id]);
      if (st && st > seqNum) {
        console.log(`${name} - skipping ${id} (${st} > ${seqNum})`);
        continue;
      }

      const recs = [];
      console.log(`${name} - updating ${id}`);
      for (const { doc } of batch) {
        const ctx = { emit: rec => recs.push({ _id: doc._id, ...rec }) };
        view.call(ctx, doc);
      }

      await mdb.beginTransaction();
      try {
        await mdb.query("DELETE FROM ?? WHERE `_id` IN (?)", [
          table,
          batch.map(o => o.doc._id)
        ]);
        await bulkInsert(mdb, table, recs);
        await this.setViewState(id, seq);
        await mdb.commit();
      } catch (e) {
        await mdb.rollback();
        throw e;
      }
    }
  }

  async start() {
    const { name, mdb, cdb, views } = this;

    await this.loadViewState();
    const since = this.getStartSequence();
    console.log(`${name} starting at ${ps(since)}`);

    await new Promise((resolve, reject) => {
      let nextSeq = null;
      cdb.changesReader
        .start({
          wait: true,
          since,
          batchSize: 100,
          includeDocs: true,
          timeout: 10000
        })
        .on("batch", batch => {
          console.log(`${name} got batch ${ps(nextSeq)}`);
          this.handleBatch(batch, nextSeq)
            .then(() => cdb.changesReader.resume())
            // .then(() => process.exit(0))
            .catch(reject);
        })
        .on("seq", seq => (nextSeq = seq))
        .on("error", reject)
        .on("end", resolve);
    });
  }
}

const myConnections = {};
const couchConnections = {};

function getMyConnection(name) {
  return (myConnections[name] =
    myConnections[name] || mysql.createConnection(config.get(`mysql.${name}`)));
}

async function closeMyConnections() {
  for await (const conn of Object.values(myConnections)) conn.destroy();
}

function getCouchConnection(name) {
  return (couchConnections[name] =
    couchConnections[name] ||
    Promise.resolve(nano(config.get(`couch.${name}.url`))));
}

async function loadViews(name) {
  const views = await fg(path.join("views", name, "*.js"));
  return views.map(require);
}

async function main(views) {
  const sessions = [];
  for (const view of views) {
    const viewInfo = config.get(`views.${view}`);
    const mdb = await getMyConnection(viewInfo.mysql);
    const cdb = await getCouchConnection(viewInfo.couch);
    const views = await loadViews(view);
    sessions.push(new Session(view, mdb, cdb, views));
  }

  try {
    await Promise.all(sessions.map(s => s.start()));
  } finally {
    await closeMyConnections();
  }
}

main(process.argv.slice(2));
