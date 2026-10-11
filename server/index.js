import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import healthRouter from './routes/health.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Load root .env then optional server/.env overrides
dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';
const SERVE_CLIENT = String(process.env.SERVE_CLIENT || 'true').toLowerCase() !== 'false';
const clientDist = path.join(rootDir, 'client', 'dist');

app.disable('x-powered-by');
app.use(
  cors({
    origin: NODE_ENV === 'production' ? true : CLIENT_ORIGIN,
  }),
);
app.use(express.json({ limit: '100kb' }));

app.use('/api/health', healthRouter);

app.get('/api', (_req, res) => {
  res.json({
    name: 'GeoPlot API',
    message: 'Core land measurement runs in the browser.',
    health: '/api/health',
  });
});

// Production: serve the built React app from one process
if (SERVE_CLIENT && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({
      name: 'GeoPlot API',
      message: 'Frontend not built yet. Run npm run build, or use npm run dev for local development.',
      health: '/api/health',
    });
  });
}

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`GeoPlot server listening on http://localhost:${PORT} (${NODE_ENV})`);
  if (SERVE_CLIENT && fs.existsSync(clientDist)) {
    console.log(`Serving frontend from ${clientDist}`);
  }
});
