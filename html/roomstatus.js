const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const pollInterval = 60E3;

const validPattern = 'lys01-'; // TODO move to config

const dataModel = {
  rooms: [],

  async fetchData() {
    const data = await fetch('/api/data');
    const rooms = await data.json();
    // console.log('got', rooms);
    this.rooms = rooms
    .filter(r => r.deviceName.toLowerCase().includes(validPattern))
    .sort((r1, r2) => r1.deviceName.toLowerCase() < r2.deviceName.toLowerCase() ? -1 : 1);
  },

  getStatus(room) {
    return room.occupants > 0 ? 'occupied' : 'free';
  },

  init() {
    this.fetchData();
    setInterval(() => this.fetchData(), pollInterval);
  }
};

