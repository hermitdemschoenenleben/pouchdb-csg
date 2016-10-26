export function updateAdapter(PouchDB, name, transformer) {
    PouchDB.adapters[name] = transformer(PouchDB.adapters[name]);
    PouchDB.adapters[name].valid = function () { return true; };
}
