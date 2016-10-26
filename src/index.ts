import {removeConflicts} from './remove_conflicts';
import {enableMultipart} from './enable_multipart';
import {optimizeSync} from './optimize_sync';

export default function(options={}) {
  return function(PouchDB) {
    (<any>window).pouch = PouchDB;

    removeConflicts(PouchDB);
    optimizeSync(PouchDB);

    if ('multipartProvider' in options) {
      enableMultipart(PouchDB, options['multipartProvider']);
    }
  }
}
