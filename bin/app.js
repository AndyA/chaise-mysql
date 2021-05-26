require("../use");

const config = require("config");
const nano = require("nano");
const path = require("path");
const fg = require("fast-glob");
const Promise = require("bluebird");
const MySQLDriver = require("lib/driver/mysql");
const ChaiseSession = require("lib/chaise/session");

const getMyDriver = name => MySQLDriver.connect(config.get(`mysql.${name}`));

const getCouchConnection = name =>
  Promise.resolve(nano(config.get(`couch.${name}.url`)));

async function loadViews(name) {
  const views = await fg(path.join("views", name, "*.js"));
  return views.map(require);
}

async function makeSessions(views) {
  const sessions = [];

  for (const view of views) {
    const viewInfo = config.get(`views.${view}`);
    const cdb = await getCouchConnection(viewInfo.couch);
    const driver = await getMyDriver(viewInfo.mysql);
    const views = await loadViews(view);
    sessions.push(new ChaiseSession(view, cdb, driver, views));
  }

  return sessions;
}

async function main(views) {
  const sessions = await makeSessions(views);
  try {
    await Promise.all(sessions.map(s => s.run()));
  } finally {
    await Promise.all(sessions.map(s => s.cleanup()));
  }
}

main(process.argv.slice(2)).catch(e => {
  console.error(e);
  process.exit(1);
});
