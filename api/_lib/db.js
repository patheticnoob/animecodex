const fs = require('fs');
const path = require('path');

const DB_PATH = '/tmp/animecodex-db.json';

const defaultDb = {
  users: [],
  watchlists: {},
  progress: {},
  history: {},
};

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return structuredClone(defaultDb);
    }
    return { ...defaultDb, ...JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) };
  } catch {
    return structuredClone(defaultDb);
  }
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = { readDb, writeDb };
