const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const pollInterval = 10E3;

const validPattern = 'lys01-'; // TODO move to config

const dataModel = {
  rooms: [],
  filter: {
    freeOnly: false,
  },

  async fetchData() {
    const data = await fetch('/api/data');
    const rooms = await data.json();
    console.log('got', rooms);
    this.rooms = rooms
    .filter(r => r.deviceName.toLowerCase().includes(validPattern))
    .sort((r1, r2) => r1.deviceName.toLowerCase() < r2.deviceName.toLowerCase() ? -1 : 1);
  },

  getRooms() {
    return this.filter.freeOnly ? this.rooms.filter(r => r.occupants < 1) : this.rooms;
  },

  getStatus(room) {
    return room.occupants > 0 ? 'occupied' : 'free';
  },

  init() {
    this.fetchData();
    setInterval(() => this.fetchData(), pollInterval);
  }
};

