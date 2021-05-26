const mysql = require("mysql2/promise");

class MySQLDriver {
  constructor(db, opt = {}) {
    this.db = db;
    this.opt = Object.assign({ viewStateTable: "_chaise_view_state" }, opt);
  }

  static async connect(config, opt) {
    const db = await mysql.createConnection(config);
    return new this(db, opt);
  }

  async bulkInsert(table, recs) {
    if (recs.length === 0) return;
    const cols = Object.keys(recs[0]);
    await this.db.query("INSERT INTO ?? (??) VALUES ?", [
      table,
      cols,
      recs.map(rec => cols.map(col => rec[col]))
    ]);
  }

  async bulkDelete(table, key, ids) {
    await this.db.query("DELETE FROM ?? WHERE ?? IN (?)", [table, key, ids]);
  }

  async loadViewStates(ids) {
    const [rows] = await this.db.query(
      "SELECT * FROM ?? WHERE `view_id` IN (?)",
      [this.opt.viewStateTable, ids]
    );

    // We must return "0" for any views whose state is unknown
    return Object.assign(
      Object.fromEntries(ids.map(id => [id, "0"])),
      Object.fromEntries(
        rows.map(({ view_id, couch_seq }) => [view_id, couch_seq])
      )
    );
  }

  async saveViewState(id, seq) {
    await this.db.query(
      "REPLACE INTO ?? (`view_id`, `couch_seq`) VALUES (?, ?)",
      [this.opt.viewStateTable, id, seq]
    );
  }

  async transaction(work) {
    const { db } = this;
    await db.beginTransaction();
    try {
      await work();
      await db.commit();
    } catch (e) {
      await db.rollback();
      throw e;
    }
  }

  async close() {
    this.db.destroy();
    this.db = null;
  }
}

module.exports = MySQLDriver;
