// Smarthub known devices

const isNullish = x => x === undefined || x === null;

module.exports = {
  id: "bandwidth",
  table: "bandwidth",

  view: function (doc) {
    if (doc.kind === "stats") {
      for (const [mac, stats] of Object.entries(doc.stats || {})) {
        for (const { time, rate } of stats) {
          for (const r of rate) {
            const { tx_rate, rx_rate } = r;
            if (mac && !isNullish(tx_rate) && !isNullish(rx_rate)) {
              this.emit({
                time: new Date(time),
                mac,
                tx_rate,
                rx_rate
              });
            }
          }
        }
      }
    }
  }
};
