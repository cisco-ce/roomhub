/**
 * Logs incoming or outgoing http requests
 *
 * Incoming are eg request to server from video device to turn on light for a room
 * Outgoing are eg request from server to light system to turn on lights in a room
 * Usually an incoming request leads to an outgoing request, but not necessarily
 *
 * Log items can be updated by reference 'later' when response arrives etc
 */

// log item:
//   id
//   time
//   direction: in|out
//   type: light|shade|issue|heartbeat|webhook|...
//   state: pending|done|failed
//   device
//   request:
//     url
//     options:
//       method
//       headers
//       body
//   response (or null)
//     ok
//     statusText
//     statusCode
//     comment


const fetch = require('node-fetch');

function convertResponse(res) {
  return { ok: res.ok, status: res.status, statusText: res.statusText };
}

class Logger {
  static counter = 1;
  static logs = [];

  static _log(direction, state, type, request, response, device) {
    const time = new Date().getTime();
    const record = {
      id: this.counter++,
      type,
      state,
      direction,
      time,
      device,
      request,
      response
    };
    this.logs.push(record);

    return record;
  }

  static logIncoming(request, type, device) {
    return this._log('in', 'ok', type, request, null, device);
  }

  static fetchAndLog(request, type, device) {

    const record = this._log('out', 'pending', type, request, null, device);

    // after the fetch has been completed, we update the original record with the response (by reference)
    const promise = fetch(request.url, request.options);
    promise
      .then((res) => {
        record.state = 'ok';
        record.response = convertResponse(res);
      })
      .catch(() => {
        record.state = 'error';
        console.log('Network error fetching', request.url);
      });
    return promise;
  }

  static lastLogs(limit) {
    return this.logs.slice(-limit);
  }
}

module.exports = Logger;
