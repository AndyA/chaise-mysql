require("../use");

const config = require("config");
const nano = require("nano");
const path = require("path");
const fg = require("fast-glob");
const Promise = require("bluebird");
const { loadDriver } = require("lib/driver");
const ChaiseSession = require("lib/chaise/session");

async function loadViews(name) {
  const views = await fg(path.join("views", name, "*.js"));
  return views.map(require);
}

const getDriver = ({ name, flavour }) =>
  loadDriver(flavour).connect(config.get(`${flavour}.${name}`));

async function makeSessions(views) {
  const sessions = [];

  for (const view of views) {
    const viewInfo = config.get(`views.${view}`);
    const cdb = nano(config.get(`couch.${viewInfo.couch}.url`));
    const driver = await getDriver(viewInfo.driver);
    const views = await loadViews(view);
    sessions.push(
      new ChaiseSession(view, cdb, driver, views, viewInfo.options)
    );
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
