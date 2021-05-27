module.exports = {
  couch: {
    smarthub: { url: "http://chaise:sofa@emit:5984/smarthub" }
  },
  mysql: {
    test: {
      host: "localhost",
      user: "root",
      password: "",
      database: "chaise",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    }
  },
  views: {
    smarthub: {
      couch: "smarthub",
      db: { flavour: "mysql", name: "test" },
      options: {
        batchSize: 100,
        timeout: 10000
      }
    }
  }
};
