// Vercel serverless entry point. vercel.json rewrites /api/* to this function.
import { createApp } from '../server/app.js';

const app = createApp({ mountAtRoot: true });

export default app;
