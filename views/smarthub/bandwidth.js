// Smarthub known devices

const isValid = x => x !== null && x !== undefined && x >= 0;

module.exports = {
  id: "bandwidth",
  table: "bandwidth",

  map(ctx, doc) {
    if (doc.kind === "stats") {
      for (const [mac, stats] of Object.entries(doc.stats || {})) {
        for (const { time, rate } of stats) {
          for (const { tx_rate, rx_rate } of rate) {
            if (mac && isValid(tx_rate) && isValid(rx_rate)) {
              ctx.emit({
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
