const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const pollInterval = 3000;

const dataModel = {
  pages: { about: 'About', config: 'Config', log: 'Log', docs: 'Docs' },
  page: 'about',
  logEvents: [],
  filteredEvents: [],
  currentEvent: null,
  config: {},

  async init() {
    this.config = await Util.loadConfig();
  },

  async setPage(page) {
    this.page = page;
    this.pollEvents( page === 'log');
    if (page === 'config') {
      this.config = await Util.loadConfig();
    }
  },

  saveConfig() {
    const json = $('#edit-config').value;
    try {
      JSON.parse(json);
      if (confirm('Save new configuration to server?')) {
        Util.saveConfigConfirmed(json)
          .then(() => alert('Config updated'))
          .catch(() => alert('Unable to save config :('));
      }
    }
    catch(e) {
      alert('Config is not valid JSON. Remember to use " around all properties and values, and don\'t leave any dangling commas.');
    }
  },

  pollEvents(run) {
    if (run) {
      this.getEvents();
      this.timer = setInterval(async () => this.getEvents(), pollInterval);
    }
    else clearInterval(this.timer);
  },

  get rooms() {
    if (!this.config || !this.config.devices) return [];
    const copy = [...this.config?.devices];
    copy.sort((r1, r2) => r1.room < r2.room ? -1 : 1);
    return copy;
  },

  async getEvents() {
    const events = await Util.fetchEvents();
    this.logEvents = events.map(e => Object.assign(e, { room: this.roomName(e.device) }));
    this.filterEvents();
  },

  showEventDetail(id) {
    const event = this.logEvents.find(e => e.id == id);
    this.currentEvent = event;
  },

  roomName(device) {
    const dev = this.config?.devices?.find(d => d.device === device);
    return dev?.room || device;
  },

  async saveRoom() {
    const device = $('#serial-number').value;
    const name = $('#room-name').value;
    const lightType = $('#light-type').value;
    const lightZone = $('#light-zone').value;
    const lightGateway = $('#light-gateway').value;
    const shadeZone = $('#shade-zone').value;
    const shadeGateway = $('#shade-gateway').value;
    const reportIssue = $('#report-issue-gateway').value;

    const room = {
      device,
      room: name,
    };

    if (lightType !== 'none') {
      room.lights = {
        type: lightType,
        zone: lightZone,
        gateway: lightGateway,
      };
    }
    if (shadeZone) {
      room.shades = {
        zones: shadeZone.split(',').map(i => i.trim()),
        gateway: shadeGateway,
      };
    }
    if (reportIssue) {
      room['reportIssue'] = reportIssue;
    }

    if (!device) {
      alert('You need to enter a device serial number');
      return;
    }

    const existing = await Util.loadConfig();
    // remove existin entry, if any:
    existing.devices = existing.devices.filter(d => d.device !== device);
    existing.devices.push(room);

    try {
      await Util.saveConfigConfirmed(JSON.stringify(existing, null, 2));
      this.cancelDialog();
      this.config = await Util.loadConfig();
    }
    catch(e) {
      alert('Unable to save config');
    }
  },

  async showEditRoom(deviceId) {
    $('.edit-room').showModal();
    if (deviceId) {
      const config = await Util.loadConfig();
      const device = config.devices.find(i => i.device === deviceId);
      $('#serial-number').value = device.device || '';
      $('#room-name').value = device.room || '';
      $('#light-type').value = device.lights?.type;
      $('#light-gateway').value = device.lights?.gateway || '';
      $('#light-zone').value = device.lights?.zone || '';
      $('#shade-zone').value = device.shades?.zones?.join(', ') || '';
      $('#shade-gateway').value = device.shades?.gateway || '';
      $('#report-issue-gateway').value = device['reportIssue'] || '';
    }
    $('#serial-number').disabled = !!deviceId;
  },

  async deleteRoom(deviceId) {
    if (!confirm('Delete room permanently?')) return;

    const config = await Util.loadConfig();
    config.devices = config.devices.filter(i => i.device !== deviceId);

    try {
      await Util.saveConfigConfirmed(JSON.stringify(config, null, 2));
    }
    catch(e) {
      alert('Unable to save config');
    }

    this.config = await Util.loadConfig();
  },

  cancelDialog() {
    $('.form-edit-room').reset();
    $('.edit-room').close();
  },

  filterEvents() {
    const word = $('#filter-events').value.toLowerCase();
    const contain = Util.strContains;
    this.filteredEvents = this.logEvents.filter(e => (
      contain(e.device, word)
      || contain(e.type, word)
      || contain(e.room, word)
      || contain(e.request.url, word)
    ));
  },

  async injectMessage() {
    await Util.injectMessage();
    this.getEvents();
  },
};

