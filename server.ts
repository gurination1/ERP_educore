import express from 'express';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { db } from './server/db.ts';
import { authRouter } from './server/routes/authRoutes.ts';
import { studentRouter } from './server/routes/studentRoutes.ts';
import { admissionRouter } from './server/routes/admissionRoutes.ts';
import { feeRouter } from './server/routes/feeRoutes.ts';
import { scholarshipRouter } from './server/routes/scholarshipRoutes.ts';
import { formRouter } from './server/routes/formRoutes.ts';
import { reportRouter } from './server/routes/reportRoutes.ts';
import { noticeRouter } from './server/routes/noticeRoutes.ts';
import { errorHandler } from './server/middleware/errorHandler.ts';

dotenv.config();

async function startServer() {
  await db.initialize();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Security Headers
  app.use(helmet({ contentSecurityPolicy: false }));

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static uploads directory
  const uploadsPath = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsPath));

  // Health check
  app.get('/api/health', async (req, res) => {
    const health = await db.getHealthInfo();
    res.json({
      status: 'ok',
      service: 'EduCore ERP Backend API',
      timestamp: new Date().toISOString(),
      database: health.activeEngine,
      mode: health.mode,
      storageLocation: health.storageLocation,
    });
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/students', studentRouter);
  app.use('/api/admissions', admissionRouter);
  app.use('/api/fees', feeRouter);
  app.use('/api/scholarships', scholarshipRouter);
  app.use('/api/forms', formRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/notices', noticeRouter);

  // Centralized Error Handler for API
  app.use(errorHandler);

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduCore ERP Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start EduCore ERP server:', err);
});
