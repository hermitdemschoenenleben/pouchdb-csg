import { getXHR, setXHROption } from './utils/xhr';
import { updateAdapter } from './utils/adapters';
export function removeConflicts(PouchDB) {
    // dirty hack due to https://github.com/pouchdb/pouchdb/issues/5793
    function transform(oldAdapter) {
        function send(native) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            try {
                var data = JSON.parse(args[0]);
                if (data.docs) {
                    for (var idx in data.docs) {
                        delete data.docs[idx]['_conflicts'];
                    }
                }
                args[0] = JSON.stringify(data);
            }
            catch (e) { }
            return native.send.apply(native, args);
        }
        var newAdapter = function () {
            oldAdapter.apply(this, arguments);
            var oldBulkDocs = this.bulkDocs;
            this.bulkDocs = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                args[1] = setXHROption(args[1], getXHR({ send: send }, true));
                return oldBulkDocs.apply(this, args);
            };
        };
        return newAdapter;
    }
    for (var _i = 0, _a = ['http', 'https']; _i < _a.length; _i++) {
        var adapter = _a[_i];
        updateAdapter(PouchDB, adapter, transform);
    }
}
