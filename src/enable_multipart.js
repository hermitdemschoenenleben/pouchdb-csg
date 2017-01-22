import {getXHR, setXHROption} from './utils/xhr';
import {updateAdapter} from './utils/adapters';

function docsToBulkGetOutput(docs) {
  return {
    results:  docs.map(doc => {
      var id, value;
      if (doc.error) {
        id = doc.id;
        value = {
          error: doc
        }
      } else {
        id = doc._id;
        value = {
          ok: doc
        }
      }
      return {
        docs: [value],
        id: id
      }
    })
  }
}

export function enableMultipart(PouchDB, provider) {
  function transform(oldAdapter) {
    function sendBulkGet(native, body) {
      this.body = body;
      provider(this.method, this.url, this.headers, this.body)
        .then(result => {
          // HACK: don't know why this is necessary, probably a ts-js thing that
          // throwing error directly does not work
          if ((typeof result == 'string') && (result.startsWith('ERROR:'))) {
            throw result;
          }

          if (result.data) {
            result.data = docsToBulkGetOutput(result.data);
            this.success(result);
          } else {
            this.error(result);
          }
        })
      .catch(e => {
        this.error({
          error: 'error at multipart provider',
          status: 500
        });
      })
    }

    var newAdapter = function() {
      oldAdapter.apply(this, arguments);
      var oldBulkGet = this.bulkGet;

      this.bulkGet = function(...args) {
        args[0] = setXHROption(args[0], getXHR({send: sendBulkGet}, false));
        return oldBulkGet.apply(this, args);
      };
    }
    return newAdapter;
  }

  for (let adapter of ['http', 'https']) {
    updateAdapter(PouchDB, adapter, transform)
  }
}
