var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// TODO: Multiple DBs
var store = {};
var db;
function initStore(PouchDB) {
    return __awaiter(this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    db = new PouchDB('sync_optimization');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, db.get('store')];
                case 2:
                    store = (_a.sent()).data;
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function writeStore() {
    db.upsert('store', function (doc) {
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
    for (var _i = 0, docs_1 = docs; _i < docs_1.length; _i++) {
        var doc = docs_1[_i];
        store[docToKey(doc)] = seq;
    }
    writeStore();
}
function clearStorage(seq) {
    window.setTimeout(function () {
        for (var key in Object.assign({}, store)) {
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
    PouchDB.prototype.sync = function (target, options) {
        if (options === void 0) { options = {}; }
        options.push = options.push || {};
        var oldFilter = options.push.filter || (function () { return true; });
        options.push.filter = function (doc) { return oldFilter(doc) && filterPush(doc); };
        var sync = oldSync.call(this, target, options), last_seq = 0;
        sync.on('change', function (change) {
            if (change.direction == 'pull') {
                addDocsToStore(change.change.docs, last_seq);
            }
            else if (change.direction == 'push') {
                last_seq = change.change.last_seq;
                clearStorage(last_seq);
            }
        });
        return sync;
    };
}
