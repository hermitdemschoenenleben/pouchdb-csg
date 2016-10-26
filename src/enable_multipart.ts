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
    async function sendBulkGet(native, body) {
      this.body = body;
      try {
        let result = await provider(this.method, this.url, this.headers, this.body);
        if (result.data) {
          result.data = docsToBulkGetOutput(result.data);
          this.success(result);
        } else {
          this.error(result);
        }
      } catch(e) {
        console.error('Error at multipart provider', e);
        this.error({
          error: 'error at multipart provider',
          status: 500
        });
      }
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
