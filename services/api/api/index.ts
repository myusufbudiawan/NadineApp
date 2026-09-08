import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildServer } from '../src/server.js';

const app = buildServer();
const ready = app.ready();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await ready;
  app.server.emit('request', req, res);
}
