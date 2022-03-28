const Logger = require('../../logger');
const Config = require('../../config-server');
const { join } = require('path');

const webexMsgUrl = 'https://webexapis.com/v1/messages';

function sendMessage(token, toPersonEmail, roomId, markdown, device) {
  const options = {
    headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token,
    },
    method: 'POST'
  };

  const body = Object.assign({ markdown }, toPersonEmail ? { toPersonEmail } : { roomId });
  // console.log('send', webexMsgUrl, headers, body);
  return Logger.fetchAndLog({ url, options }, 'Report issue', device);
}

function onCommand(command, answer) {
  const config = Config.current();
  const { text, category, person } = command;
  const device = config.devices.find(d => d.device === command.device);
  const room = device?.room || ('Video device ' + command.device);

  const { token, roomId } = config.facilityBot || {};
  let message = `Issue reported from *${room}*:\n`;
  message += `\n* Category: **${category}**`;
  message += `\n* Comment: **${text}**`;
  message += `\n* Reported by: **${person || '(Unknown)'}**`;

  try {
    sendMessage(token, null, roomId, message, command.device)
      .catch(e => console.log(e));
    answer(true);
  }
  catch(e) {
    console.log(e);
    answer({ statusText: e.statusText }, e.status);
  }

}

module.exports = onCommand;