const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const pollInterval = 10E3;

const validPattern = 'lys01-'; // TODO move to config

const dataModel = {
  rooms: [],
  filter: {
    freeOnly: false,
    name: '',
  },

  async fetchData() {
    const data = await fetch('/api/data');
    const rooms = await data.json();
    console.log('got', rooms);
    this.rooms = rooms
      .filter(r => r.deviceName.toLowerCase().includes(validPattern))
      .sort((r1, r2) => r1.deviceName.toLowerCase() < r2.deviceName.toLowerCase() ? -1 : 1);
  },

  isFree(room) {
    return room.occupants < 1 && room.callStatus < 1;
  },

  getRooms() {
    return this.rooms.filter(room => {
      return room.deviceName.toLowerCase().includes(this.filter.name.toLowerCase())
         && (this.filter.freeOnly ? this.isFree(room) : true);
    });
  },

  getStatus(room) {
    return this.isFree(room) ? 'free' : 'occupied';
  },

  init() {
    this.fetchData();
    setInterval(() => this.fetchData(), pollInterval);
  }
};

