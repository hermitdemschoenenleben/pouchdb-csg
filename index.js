'use strict';

var plugin = require('./src/index');
module.exports = plugin;

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(exports);
}
