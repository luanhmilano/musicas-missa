import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { connectToDatabase } from './database.js';
import songRoutes from './routes/song.routes.js';
import missaRoutes from './routes/missa.routes.js';

const app = express();
const PORT = 3333;

app.use(cors()); 
app.use(express.json());

app.use((req, res, next) => {
  const startedAt = Date.now();

  console.debug('[backend][request] incoming', {
    method: req.method,
    path: req.originalUrl,
    query: req.query,
    body: req.body,
  });

  res.on('finish', () => {
    console.debug('[backend][request] completed', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
});

app.use('/songs', songRoutes);
app.use('/missas', missaRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'API rodando na manha!' });
});

async function startServer() {
  let databaseReady = false;

  try {
    await connectToDatabase();
    databaseReady = true;
  } catch (error) {
    console.error('Falha ao conectar no MongoDB:', error);
  }

  app.listen(PORT, () => {
    if (databaseReady) {
      console.log(`Backend Express/TS rodando na porta ${PORT}`);
      return;
    }

    console.log(`Backend Express/TS rodando na porta ${PORT} sem conexão ativa com o MongoDB`);
  });
}

startServer();