import {getXHR, setXHROption} from './utils/xhr';
import {updateAdapter} from './utils/adapters';

// TODO: Multiple DBs
var store = {};
var db;

async function initStore(PouchDB) {
  db = new PouchDB('sync_optimization');
  try {
    store = (await db.get('store')).data;
  } catch(e) {}
}

function writeStore() {
  db.upsert('store', doc => {
    doc.data = store;
    return doc;
  });
}

function docToKey(doc) {
  return JSON.stringify([doc._id, doc._rev]);
}

function filterPush(doc) {
  if (docToKey(doc) in store) {
    return false;
  }
  return true;
}

function addDocsToStore(docs, seq) {
  for (let doc of docs) {
    store[docToKey(doc)] = seq;
  }
  writeStore();
}

function clearStorage(seq) {
  window.setTimeout(() => {
    for (let key in Object.assign({}, store)) {
      if (store[key] < seq) {
        delete store[key];
      }
    }
    writeStore();
  }, 2000);
}

export function optimizeSync(PouchDB) {
  initStore(PouchDB);

  var oldSync = PouchDB.prototype.sync;

  PouchDB.prototype.sync = function(target, options: any={}) {
    options.push = options.push || {};
    let oldFilter = options.push.filter || (() => true);
    options.push.filter = doc => oldFilter(doc) && filterPush(doc);

    let sync = oldSync.call(this, target, options),
        last_seq = 0;

    sync.on('change', change => {
      if (change.direction == 'pull') {
        addDocsToStore(change.change.docs, last_seq);
      } else if (change.direction == 'push') {
        last_seq = change.change.last_seq;
        clearStorage(last_seq);
      }
    });

    return sync;
  }
}
