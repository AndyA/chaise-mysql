// Smarthub known devices

module.exports = {
  id: "known_devices",
  table: "known_devices",

  view: function (doc) {
    if (doc.kind === "stats") {
      for (const dev of doc.network?.network?.known_device_list ?? []) {
        if (dev === null) continue;
        const { mac, hostname, ip } = dev;
        this.emit({ mac, hostname, ip });
      }
    }
  }
};
