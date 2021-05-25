// Smarthub known devices

module.exports = {
  id: "bandwidth",
  table: "bandwidth",

  view: function (doc) {
    if (doc.kind === "stats") {
      for (const stats of Object.values(doc.stats || {})) {
        for (const { time, rate } of stats) {
          for (const r of rate) {
            const { mac, tx_rate, rx_rate } = r;
            if (mac && tx_rate !== undefined && rx_rate !== undefined)
              this.emit({ time, mac, tx_rate, rx_rate });
          }
        }
      }
    }
  }
};
