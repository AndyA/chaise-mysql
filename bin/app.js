require("../use");

const config = require("config");
const nano = require("nano");
const mysql = require("mysql2/promise");
const path = require("path");
const fg = require("fast-glob");

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

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
  }

  async getStartSequence() {
    const ids = this.views.map(v => v.id);
    const [rows] = await this.mdb.query(
      "SELECT * FROM `_chaise_view_state` WHERE `view_id` IN (?)",
      ids
    );
    if (rows.length === 0) return "0"; // start
    return rows.map(r => r.couch_seq).sort(cmp)[0];
  }

  async handleBatch(batch, seq) {
    const { mdb } = this;
    // console.log(batch);
    for (const { id, table, view } of this.views) {
      const recs = [];
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
        await mdb.query(
          "REPLACE INTO `_chaise_view_state` (`view_id`, `couch_seq`) VALUES (?, ?)",
          [id, seq]
        );
        await mdb.commit();
      } catch (e) {
        await mdb.rollback();
        throw e;
      }
    }
  }

  async start() {
    const { name, mdb, cdb, views } = this;

    const since = await this.getStartSequence();
    console.log(`starting at ${since}`);

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
          console.log(`got batch ${nextSeq}`);
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
