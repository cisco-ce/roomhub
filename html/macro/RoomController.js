/**
 * Room service integration for Cisco New York offices
 *
 * Makes request to the Manhattan server, which controls lights, shades etc
 *
 * @author Tore Bjolseth <tbjolset@cisco.com>
 */
import xapi from 'xapi';

/** This is the url of the Room Hub server. Must be set. eg https://roomhub.acme.com:8080/ */
const domain = '';

// As defined in config for roomhub (or empty)
const password = '';

const pingInterval = 1000 * 60 * 60;

let serialNumber;
let ip4;

const issueOptions = {
  Text: 'What type of issue?',
  Title: 'Report issue in this room (1/3)',
  'Option.1': 'Technology issue',
  "Option.2": 'Facility issue',
  'Option.3': 'CXC issue',
  'Option.4': 'Collab support (employee)',
  'Option.5': 'Just a demo',
  FeedbackId: 'issue-category',
  Duration: 20,
};
let issueCategory;
let issueComment;

function send(data) {
  const url = join(domain, '/api/command/');
  // console.log('send', url, data);
  data.device = serialNumber;
  data.ip = ip4;
  const body = JSON.stringify(data);
  const Header = ['Content-Type: application/json'];
  if (password) Header.push(getHeader(password));

  const promise = xapi.Command.HttpClient.Post({ Url: url, Header, AllowInsecureHTTPS: 'True' }, body);
  promise.catch(e => {
      console.warn('Request failed');
      xapi.Command.UserInterface.Message.Alert.Display({ Text: 'RoomHub was not able to perform the requested action.', Duration: 5 });
    });
  return promise;
}

function join(url1, url2) {
  const base = url1.endsWith('/') ? url1.slice(0, -1) : url1;
  const end = url2.startsWith('/') ? url2 : '/' + url2;
  return base + end;
}

function getHeader(password) {
  return 'Authorization: Basic ' + btoa('admin:' + password);
}

function onEvent(event) {
  // console.log(event);
  const { Type, WidgetId, Value } = event;
  if (WidgetId === 'lights-preset' && Type === 'released') {
    send({ type: 'lights', level: parseInt(Value) });
    xapi.Command.UserInterface.Extensions.Widget.UnsetValue({ WidgetId: 'lights-preset' });
  }
  else if (WidgetId.startsWith('shades') && Type === 'released') {
    xapi.Command.UserInterface.Extensions.Widget.SetValue({ WidgetId: 'shades_status', Value: 'Moving shades...' });
    setTimeout(() => {
      xapi.Command.UserInterface.Extensions.Widget.SetValue({ WidgetId: 'shades_status', Value: '' });
    }, 5000);

    if (WidgetId === 'shades_all_open') {
      send({ type: 'shades', shadeIndex: -1, position: 0 });
    }
    else if (WidgetId === 'shades_all_closed') {
      send({ type: 'shades', shadeIndex: -1, position: 4 });
    }
    else if (WidgetId === 'shades_1_preset') {
      send({ type: 'shades', shadeIndex: 0, position: parseInt(Value) });
    }
    else if (WidgetId === 'shades_2_preset') {
      send({ type: 'shades', shadeIndex: 1, position: parseInt(Value) });
    }

    // reset group buttons
    xapi.Command.UserInterface.Extensions.Widget.UnsetValue({ WidgetId: 'shades_1_preset' }).catch(() => {});
    xapi.Command.UserInterface.Extensions.Widget.UnsetValue({ WidgetId: 'shades_2_preset' }).catch(() => {});
  }
}

async function installPanel(id, xml) {
  try {
    await xapi.Command.UserInterface.Extensions.Panel.Save({ PanelId: id }, xml);
  }
  catch(e) {
    console.warn('Not able to install extension', id, e);
  }
}

async function removePanel(id) {
  try {
    await xapi.Command.UserInterface.Extensions.Panel.Remove({ PanelId: id });
  }
  catch(e) {
    console.warn('Not able to remove', id);
  }
}

async function installUiExtensions() {
  const url = join(domain, '/api/uiextensions/' + serialNumber);
  const Header = password ? [getHeader(password)] : [];

  try {
    const res = await xapi.Command.HttpClient.Get({ url, Header, AllowInsecureHTTPS: true });
    const config = JSON.parse(res.Body);
    for (const id in config) {
      const xml = config[id];
      if (xml) {
        await installPanel(id, config[id]);
      }
      else {
        await removePanel(id);
      }
    }
  }
  catch(e) {
    console.log('error', e);
  }
}

function alert(title, text, duration) {
  xapi.Command.UserInterface.Message.Alert.Display({ Title: title, Text: text, Duration: duration });
}

function onTextInput(e) {
  if (e.FeedbackId === 'issue-comment') {
    issueComment = e.Text;
    setTimeout(() => {
      xapi.Command.UserInterface.Message.TextInput.Display({
        Title: 'Report issue (3/3)',
        Text: 'Your name',
        FeedbackId: 'issue-name',
        InputText: '',
      });
    }, 600);
  }
  else if (e.FeedbackId === 'issue-name') {
    const person = e.Text;
    send({
      type: 'report-issue',
      text: issueComment,
      category: issueCategory,
      person,
    })
      .then(() => alert('Thank you!', 'Your feedback has been posten in a Webex space.', 5))
      .catch(() => alert('Error', 'Not able to send message, sorry :(', 10));
  }
}

function onPromptResponse(e) {
  if (e.FeedbackId !== 'issue-category') return;
  issueCategory = issueOptions['Option.' + e.OptionId];

  xapi.Command.UserInterface.Message.TextInput.Display({
    Title: 'Report issue (2/3)',
    Text: 'Short description of the issue',
    InputText: '',
    FeedbackId: 'issue-comment',
    Duration: 600,
  });
}

function onPanelClicked(e) {
  if (e.PanelId === 'report-issue') {
    xapi.Command.UserInterface.Message.Prompt.Display(issueOptions)
  }
}

async function ping() {
  ip4 = await xapi.Status.Network[1].IPv4.Address.get();
  await send({ type: 'heartbeat' });
}

function handleVoiceAssistDirective(cmd) {
  // console.log('voice assist:' + cmd.name);
  switch(cmd.name) {
    case'open-shades':
      send({ type: 'shades', shadeIndex: -1, position: 0 });
      break;
    case'close-shades':
      send({ type: 'shades', shadeIndex: -1, position: 4 });
      break;
    case'set-lights-state':
      send({ type: 'lights', level: cmd.payload.level });
      break;
    case'turn-lights-on':
      send({ type: 'lights', level: 100 });
      break;
    case'turn-lights-off':
      send({ type: 'lights', level: 0 });
      break;
    case 'turn-party-mode-on':
      send({ type: 'lights', level: 10 });
      send({ type: 'shades', shadeIndex: -1, position: 3 });
      xapi.Command.Audio.Volume.Set({ Level: 70 });
      xapi.Command.UserInterface.WebView.Display({ Url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
      break;
    case 'turn-party-mode-off':
      send({ type: 'lights', level: 70 });
      send({ type: 'shades', shadeIndex: -1, position: 1 });
      xapi.Command.UserInterface.WebView.Clear();
      break;
    default:
      console.warn('Unknown voice command', cmd.name);
  }
}

function onVoiceCommand(assistant_event) {
  if (assistant_event.Name != 'room-skill-event' && assistant_event.Name != 'room-control-event') {
    return;
  }

  let payload = JSON.parse(assistant_event.Payload)
  payload.commands.forEach(handleVoiceAssistDirective);
}

async function init() {
  if (!domain) {
    xapi.Command.UserInterface.Message.Alert.Display({ Text: 'RoomHub integration has not been configured yet.', Duration: 30 });
    return;
  }
  await xapi.Config.HttpClient.Mode.set('On');
  await xapi.Config.HttpClient.AllowInsecureHTTPS.set('True');

  // uncomment below if you need non-https
  // await xapi.Config.HttpClient.AllowHTTP.set('True');

  serialNumber = await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get();
  ip4 = await xapi.Status.Network[1].IPv4.Address.get();

  xapi.Event.UserInterface.Extensions.Widget.Action.on(onEvent);
  setInterval(ping, pingInterval);
  setTimeout(ping, 60 * 1000);
  xapi.event.on('UserInterface Assistant Notification', onVoiceCommand);
  xapi.Event.UserInterface.Extensions.Panel.Clicked.on(onPanelClicked);
  xapi.Event.UserInterface.Message.Prompt.Response.on(onPromptResponse);
  xapi.Event.UserInterface.Message.TextInput.Response.on(onTextInput);

  installUiExtensions();
}

init();
