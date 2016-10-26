import {getXHR, setXHROption} from './utils/xhr';
import {updateAdapter} from './utils/adapters';

export function removeConflicts(PouchDB) {
  // dirty hack due to https://github.com/pouchdb/pouchdb/issues/5793

  function transform(oldAdapter) {
    function send(native, ...args) {
      try {
        let data = JSON.parse(args[0]);
        if (data.docs) {
          for (let idx in data.docs) {
            delete data.docs[idx]['_conflicts'];
          }
        }
        args[0] = JSON.stringify(data);
      } catch(e) {}
      return native.send(...args);
    }

    var newAdapter = function() {
      oldAdapter.apply(this, arguments);
      var oldBulkDocs = this.bulkDocs;

      this.bulkDocs = function(...args) {
        args[1] = setXHROption(args[1], getXHR({send: send}, true));
        return oldBulkDocs.apply(this, args);
      };
    }
    return newAdapter;
  }

  for (let adapter of ['http', 'https']) {
    updateAdapter(PouchDB, adapter, transform)
  }
}
