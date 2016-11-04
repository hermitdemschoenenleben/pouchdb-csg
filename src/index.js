import { enableMultipart } from './enable_multipart';
export default function (options) {
    if (options === void 0) { options = {}; }
    return function (PouchDB) {
        if (options.multipartProvider) {
            enableMultipart(PouchDB, options.multipartProvider);
        }
    };
}
