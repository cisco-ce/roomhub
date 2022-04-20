const Util = {

  strContains(haystack, needle) {

    return (haystack || '').toLowerCase()
      .includes((needle || '').toLowerCase());
  },

  formatTime(sec) {
    const [day, m, d, y, t, z, z2 ] = new Date(sec).toString().split(' ');
    return `${m} ${d} ${t}`;
  },

  formatUrl(url, max) {
    const u = url.startsWith('http') ? url : location.host + url;
    const u2 = u.split('?').shift();
    return u2.length > max ? u2.slice(0, max) + '...' : u2;
  },

  async fetchEvents() {
    const heartbeat = $('#heartbeat')?.checked;
    const url = '/api/commands' + (heartbeat ? '/?heartbeat=1' : '');
    try {
      const json = await fetch(url);
      const data = await json.json();
      // console.log(data);
      return data;
    }
    catch(e) {
      console.log('not able to fetch events');
      return [];
    }
  },

  async loadConfig() {
    try {
      const json = await fetch('/api/config');
      return await json.json();
    }
    catch(e) {
      console.warn('unable to load config');
    }
  },

  saveConfigConfirmed(json) {
    const headers = {};
    headers['Content-Type'] = 'application/json';

    // console.log('save', json);
    return fetch('/api/config', {
      method: 'POST', headers, body: json });
  },

  injectMessage() {
    const data = $('.inject').value;
    try {
      const json = JSON.stringify(JSON.parse(data.trim()));
      return fetch('/api/command', {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: json,
      }).catch(console.log);
    }
    catch(e) {
      alert('Data is not valid json');
      return;
    }
  },

  logStatus(logItem) {
    const { response, state } = logItem;
    if (state === 'error') {
      return { state: 'error', text: 'Network' };
    }
    if (state === 'pending') {
      return { state: 'pending', text: 'Pending' };
    }
    if (response) {
      return { state: response.ok ? 'ok' : 'notok', text: response.status };
    }

    return { state: 'unknonw', text: '?' };
  },

};




