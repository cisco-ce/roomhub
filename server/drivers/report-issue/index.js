const Logger = require('../../logger');
const Config = require('../../config-server');

const webexMsgUrl = 'https://webexapis.com/v1/messages';

function sendMessage(token, toPersonEmail, roomId, markdown, device) {
  const body = Object.assign({ markdown }, toPersonEmail ? { toPersonEmail } : { roomId });
  const options = {
    headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token,
    },
    body: JSON.stringify(body),
    method: 'POST'
  };

  // console.log('send', options);
  return Logger.fetchAndLog({ url: webexMsgUrl, options }, 'Report issue', device);
}

async function onCommand(command, answer) {
  const config = Config.current();
  const { text, category, person } = command;
  const device = config.devices.find(d => d.device === command.device);
  const gateway = device?.['reportIssue'];
  const room = device?.room || ('Video device ' + command.device);

  const { token, roomId, email } = config.facilityBot[gateway] || {};
  let message = `Issue reported from *${room}*:\n`;
  message += `\n* Category: **${category}**`;
  message += `\n* Comment: **${text}**`;
  message += `\n* Reported by: **${person || '(Unknown)'}**`;

  try {
    const res = await sendMessage(token, email, roomId, message, command.device);
    if (!res.ok) {
      const data = await res.json();
      answer(data.message, 400);
    }
    else {
      answer(true);
    }
  }
  catch(e) {
    console.log(e);
    answer('Not able to send message', 400);
  }

}

module.exports = onCommand;