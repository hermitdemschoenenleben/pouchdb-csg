import {enableMultipart} from './enable_multipart';

export default function(options: any={}) {
  return function(PouchDB) {
    if (options.multipartProvider) {
      enableMultipart(PouchDB, options.multipartProvider);
    }
  }
}
