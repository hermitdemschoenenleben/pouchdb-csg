var REPLICATOR = 'pouchdb-optimized';
var LOWEST_SEQ = 0;

function getLocalDB(db1, db2) {
  var local = [db1, db2].filter(function(db) {
    return db.type() !== 'http';
  })
  if (local.length != 1) {
    throw 'exactly one remote and one local database is required';
  }
  return local[0];
}

function Checkpointer(src, target, id, returnValue) {
  this.db = getLocalDB(src, target);
  this.id = id;
  this.returnValue = returnValue;
}

function updateCheckpoint(db, id, checkpoint, session, returnValue) {
  return db.get(id).catch(function (err) {
    if (err.status === 404) {
      return {
        session_id: session,
        _id: id,
        replicator: REPLICATOR
      };
    }
    throw err;
  }).then(function (doc) {
    if (returnValue.cancelled) {
      return;
    }

    // if the checkpoint has not changed, do not update
    if (doc.last_seq === checkpoint) {
      return;
    }

    doc.replicator = REPLICATOR;

    doc.session_id = session;
    doc.last_seq = checkpoint;

    return db.put(doc).catch(function (err) {
      if (err.status === 409) {
        // retry; someone is trying to write a checkpoint simultaneously
        return updateCheckpoint(db, id, checkpoint, session, returnValue);
      }
      throw err;
    });
  });
}

Checkpointer.prototype.writeCheckpoint = function (checkpoint, session) {
  return updateCheckpoint(this.db, this.id, checkpoint, session, this.returnValue);
};

Checkpointer.prototype.getCheckpoint = function () {
  var self = this;
  return self.db.get(self.id).then(function (doc) {
    return doc.last_seq;
  }).catch(function(err) {
    if (err.status === 404) {
      return self.db.put({
        _id: self.id,
        last_seq: LOWEST_SEQ
      }).then(function () {
        return LOWEST_SEQ;
      })
    } else {
      throw err;
    }
  }).then(function(result) {
    return result;
  });
};
