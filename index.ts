import express, { Response } from 'express';

import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { client, clientNames } from './types';

interface ChatEvents {
  error: (error: Error) => void;
  message: (body: string, showUserName: boolean) => void;
  _userJoined: (res: Response, name: string) => void;
  _userLeft: () => void;

  updateUserList: () => void;
}

const chatEmitter = new EventEmitter() as TypedEmitter<ChatEvents>;

const app = express();

// middleware
app.use(express.json());

let clientId = 0;
const clients: client = {};
let actUserName = '';
const clientNames: clientNames = {};
const clientArr: string[] = [];

const sendText = (text: string, showUserName = true) => {
  for (const clientId in clients) {
    let data = '';
    const date = new Date();
    const timestamp = `[${date.getHours()}:${date.getMinutes()}]`;
    if (showUserName) {
      data = `data: ${JSON.stringify(
        `${timestamp} <${actUserName}> ${text}`
      )}\n\n`;
    } else {
      data = `data: ${JSON.stringify(`${timestamp} ${text}`)}\n\n`;
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
  chatEmitter.emit('_userJoined', res, req.params.name);
  req.on('close', () => chatEmitter.emit('_userLeft'));
  chatEmitter.emit('updateUserList');
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

app.listen(3000, () => {
  console.log('Server running.');
});

const isString = (text: unknown): text is string => {
  return typeof text === 'string' || text instanceof String;
};

const userJoined = (res: Response, name: string): void => {
  clientId++;
  clients[clientId] = res;
  clientArr.push(name);
  clientNames[clientId] = name;
};

const userLeft = () => {
  delete clients[clientId];
  clientArr.filter((name) => name !== clientNames[clientId]);
  actUserName = '';
  chatEmitter.emit('message', clientNames[clientId] + ' disconnected!', false);
  delete clientNames[clientId];
  chatEmitter.emit('updateUserList');
};

const sendUsersList = (): void => {
  for (const clientId in clients) {
    clients[clientId].write(
      `data: ${JSON.stringify({ users: clientArr })}\n\n`
    );
  }
};

chatEmitter.addListener('message', sendText);
chatEmitter.addListener('_userJoined', userJoined);
chatEmitter.addListener('_userLeft', userLeft);
chatEmitter.addListener('updateUserList', sendUsersList);
