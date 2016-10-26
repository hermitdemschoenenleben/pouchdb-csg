export function updateAdapter(PouchDB, name, transformer: Function) {
  PouchDB.adapters[name] = transformer(PouchDB.adapters[name])
  PouchDB.adapters[name].valid = () => true;
}
