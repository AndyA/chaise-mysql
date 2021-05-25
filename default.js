"use strict";

const _ = require("lodash");

const canonBase = "https://genome.ch.bbc.co.uk/explorer";

const appPort = 31792;
const currentCouchDB = "pi2";

const certs = {
  key: "/etc/genome/forge/genome.key",
  cert: "/etc/genome/forge/genome.pem"
};

const tryRequire = name => {
  try {
    return require(name);
  } catch (e) {
    if (e.code === "MODULE_NOT_FOUND") return {};
    throw e;
  }
};

module.exports = _.merge(
  {
    debug: true,
    db: {
      url: `http://chaise:sofa@localhost:5984/${currentCouchDB}`,
      proxy: {
        url: `http://localhost:${appPort}/db/${currentCouchDB}`,
        disabled: true
      }
    },
    cachedb: {
      url: `http://chaise:sofa@localhost:5984/${currentCouchDB}-cache`
    },
    admin: {
      enabled: false
    },
    elastic: {
      client: {
        node: "http://localhost:9200",
        proxy: {
          disabled: true,
          node: `http://localhost:${appPort}/elastic`
        }
      },
      index: "pi2", // live index
      newIndex: "pi3" // next index
    },
    appPort,
    webRoot: "www",
    // now repurposed as media mount point to ease transition to PI
    mount: "/explorer/",
    loopback: `http://localhost:${appPort}`,
    userAgent: `BBC Programme Index [${canonBase}]`,
    cache: { local: { ttl: 60 * 1000, stale: 10 } },
    handlebars: { strict: false },
    presentation: {
      pe: {
        base: canonBase,
        ident: {
          short: "Programme Explorer",
          long: "BBC Programme Explorer"
        },
        orbit: {
          analyticsCounterName: "programme-explorer",
          skipLinkTarget: "#pi-main-content",
          user: { country: "GB", ukCombined: "yes", canSeeAdverts: "no" }
        }
      },
      pi: {
        base: "https://genome.ch.bbc.co.uk",
        ident: {
          short: "Programme Index",
          long: "BBC Programme Index"
        },
        orbit: {
          analyticsCounterName: "programme-index",
          skipLinkTarget: "#pi-main-content",
          user: { country: "GB", ukCombined: "yes", canSeeAdverts: "no" }
        }
      }
    },
    services: {
      slash: {
        base: "https://slash.bbcgenome.com/"
      }
    },
    matomo: {
      base: "https://stats.bbcgenome.com/",
      siteID: 4
    },
    certs,
    availability: {
      base: "https://media-availability.api.bbci.co.uk",
      certs
    },
    orbit: {
      disabled: false,
      base: "https://navigation.api.bbci.co.uk/api/",
      certs
    },
    nitro: {
      domain: "programmes.api.bbc.com",
      page_size: 300,
      parallel: 20
    },
    g2: {
      link: "https://labs.bbcgenome.com",
      db: {
        pi: { url: `http://chaise:sofa@localhost:5984/${currentCouchDB}` }
      },
      mysql: {
        genome: {
          host: "localhost",
          user: "root",
          password: "",
          database: "genome3",
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        },
        pe: {
          host: "localhost",
          user: "root",
          password: "",
          database: "pe",
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        },
        piMeta: {
          host: "localhost",
          user: "root",
          password: "",
          database: "pi_meta",
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        }
      }
    }
  },
  tryRequire("./secrets")
);
