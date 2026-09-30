import { createServer } from './app.ts';

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
const hostname = process.env.HOST ?? '127.0.0.1';
const application = await createServer();
const url = await application.listen(port, hostname);
console.log(`Night Signal is listening at ${url}`);

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await application.close();
}
process.once('SIGTERM', () => { void stop(); });
process.once('SIGINT', () => { void stop(); });
