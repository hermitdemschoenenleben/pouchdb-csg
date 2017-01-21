import {enableMultipart} from './enable_multipart';

export default function plugin(options={}) {
  return function(PouchDB) {
    if (options.multipartProvider) {
      enableMultipart(PouchDB, options.multipartProvider);
    }
  }
}

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(plugin);
}
