import { removeConflicts } from './remove_conflicts';
import { enableMultipart } from './enable_multipart';
import { optimizeSync } from './optimize_sync';
export default function (options) {
    if (options === void 0) { options = {}; }
    return function (PouchDB) {
        window.pouch = PouchDB;
        removeConflicts(PouchDB);
        optimizeSync(PouchDB);
        if ('multipartProvider' in options) {
            enableMultipart(PouchDB, options['multipartProvider']);
        }
    };
}
