import 'reflect-metadata';
import { container } from './config/container.ts';
import express, { type Express } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import imageRoutes from './routes/image.routes.ts';
import postRoutes from './routes/post.routes.ts';
import jobRoutes from './routes/job.routes.ts';
import costLogRoutes from './routes/cost-log.routes.ts';
import { DatabaseInitializerService } from './services/database-initializer.service.ts';
import { visionWorker } from './workers/image-understand.worker.ts';
import { textEmbedWorker } from './workers/text-embed.worker.ts';
import { postSummarizeWorker } from './workers/post-summarize.worker.ts';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Initialize DB (creates all tables via consolidated initializer)
const databaseInitializer = container.resolve('DatabaseInitializerService') as DatabaseInitializerService;
await databaseInitializer.initializeAll();

// Start workers

// each worker is an independent "loop" that listens
// to the redis queue for jobs and processes them, utilizing BullMQ.
// If we want to run more than one instance of a worker, we can do so by simply starting more instances of the worker.
// The worker will automatically pick up jobs from the queue and process them.
// This is a simple way to implement a message queue.
visionWorker().then(worker => {
  console.log('Vision worker started');
  worker.on('error', err => console.error('Vision worker error:', err));
});

textEmbedWorker().then(worker => {
  console.log('Text embed worker started');
  worker.on('error', err => console.error('Text embed worker error:', err));
});

postSummarizeWorker().then(worker => {
  console.log('Post summarize worker started');
  worker.on('error', err => console.error('Post summarize worker error:', err));
});

app.use('/', imageRoutes);
app.use('/', postRoutes);
app.use('/', jobRoutes);
app.use('/', costLogRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback - serve dashboard.html for frontend routes
const frontendRoutes = ['/dashboard', '/jobs', '/images', '/posts', '/ranking'];
app.get(/^\/(dashboard|jobs|images|posts|ranking|download)(?:\/.*)?$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard.html`);
  console.log(`Jobs: http://localhost:${PORT}/jobs.html`);
  console.log(`Images: http://localhost:${PORT}/images.html`);
  console.log(`Posts: http://localhost:${PORT}/posts.html`);
  console.log(`Ranking: http://localhost:${PORT}/ranking.html`);
  console.log(`Download: http://localhost:${PORT}/download.html`);
});