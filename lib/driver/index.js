function loadDriver(flavour) {
  if (!/^\w+$/.test(flavour)) throw new Error(`Bad flavour: ${flavour}`);
  return require(`./${flavour}`);
}

module.exports = { loadDriver };
