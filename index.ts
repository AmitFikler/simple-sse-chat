import express from 'express';

import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { client, clientNames } from './types';

interface ChatEvents {
  error: (error: Error) => void;
  message: (body: string, showUserName: boolean) => void;
}

const chatEmitter = new EventEmitter() as TypedEmitter<ChatEvents>;

const app = express();

// middleware
app.use(express.json());

let clientId = 0;
const clients: client = {};
let actUserName = '';
const clientNames: clientNames = {};

const sendText = (text: string, showUserName = true) => {
  for (const clientId in clients) {
    let data = '';
    const date = new Date();
    const timestamp = `[${date.getHours()}:${date.getMinutes()}]`;
    if (showUserName) {
      data = `data: ${timestamp} <${actUserName}> ${text}\n\n`;
    } else {
      data = `data: ${timestamp} ${text}\n\n`;
    }
    clients[clientId].write(data);
  }
};

app.use('/', express.static('static'));

app.get('/chat/:name', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');
  (function () {
    clientId++;
    clients[clientId] = res;
    clientNames[clientId] = req.params.name;
    req.on('close', () => {
      delete clients[clientId];
      actUserName = '';
      chatEmitter.emit(
        'message',
        clientNames[clientId] + ' disconnected!',
        false
      );
      delete clientNames[clientId];
    });
  })();
  chatEmitter.emit('message', req.params.name + ' connected!', false);
  let allMates = '';
  for (const cliId in clientNames) {
    allMates += `${clientNames[cliId]}`;
    if (Number(cliId) < clientId) allMates += ' ';
  }
  chatEmitter.emit('message', `logged in [${allMates}]`, false);
});

app.post('/write/', (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  actUserName = req.body.name;
  if (isString(req.body.text)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    chatEmitter.emit('message', req.body.text, true);
    res.json({ success: true });
  } else {
    res.sendStatus(400);
  }
});

chatEmitter.addListener('message', sendText);

app.listen(3000, () => {
  console.log('Server running.');
});

const isString = (text: unknown): text is string => {
  return typeof text === 'string' || text instanceof String;
};
