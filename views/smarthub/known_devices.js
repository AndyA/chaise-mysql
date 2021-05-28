// Smarthub known devices

const _ = require("lodash");

module.exports = {
  id: "known_devices",
  table: "known_devices",

  map(ctx, doc) {
    if (doc.kind === "stats") {
      for (const dev of doc.network?.network?.known_device_list ?? []) {
        if (dev === null) continue;
        const macs = dev.mac.split(/[,;]/);
        const ips = dev.ip.split(/[,;]/);
        for (const [mac, ip] of _.zip(macs, ips)) {
          ctx.emit({ mac, hostname: dev.hostname, ip });
        }
      }
    }
  }
};
