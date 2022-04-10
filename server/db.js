const sqlite3 = require('sqlite-async');

// timestamp: 1649609578216,
// macroVersion: '0.9.210705-2',
// macAddress: '20:CF:AE:29:8F:BA',
// model: 'Cisco Webex Desk Mini',
// deviceName: 'Tore Bjolseth',
// sipuri: 'tbjolset@cisco.call.ciscospark.com',
// callStatus: 0,
// occupants: 0,
// soundLevel: 63,
// ambientNoise: 29,
// temperature: 23.2,
// humidity: 28,
// airQuality: -1,
// lastPeopleCount: '1'

let db;

const createRoomDb = `
CREATE TABLE IF NOT EXISTS roomData (
  id INTEGER PRIMARY KEY,
  timestamp INTEGER,
  macroVersion TEXT,
  macAddress TEXT,
  model TEXT,
  sipuri TEXT,
  deviceName TEXT,
  callStatus INTEGER,
  occupants INTEGER,
  soundLevel INTEGER,
  ambientNoise NUMERIC,
  temperature NUMERIC,
  humidity NUMERIC,
  airQuality NUMERIC
);
`;

function insert(table, obj) {
  const keys  = Object.keys(obj).join(', ');
  const marks = Array(Object.keys(obj).length).fill('?');
  const values = Object.values(obj);
  const sql = `INSERT INTO ${table} (${keys}) VALUES (${marks})`;
  return db.run(sql, values);
}

async function init(dbFile) {
  db = await sqlite3.open(dbFile);
  await db.run(createRoomDb);
}

function saveRoomData(data) {
  // console.log('save', data);
  delete data.lastPeopleCount;
  return insert('roomData', data);
}


module.exports = { init, saveRoomData };
