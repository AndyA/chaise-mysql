// An example view

module.exports = {
  id: "My view",
  table: "couch_docs",
  view: function (doc) {
    if (doc.kind === "meta") {
      const { name, updated } = doc;
      this.emit({ name, updated }); // call zero or more times
    }
  }
};
