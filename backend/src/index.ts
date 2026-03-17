import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import reputationRoutes from './routes/reputation';
import chatRoutes from './routes/chat';
import { swaggerSpec } from './config/swagger';
import { logger } from './utils/logger';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DotRepute API Docs',
}));
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'DotRepute Backend API' });
});

app.use('/api/reputation', reputationRoutes);
app.use('/api/chat', chatRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server started');
  });
}

export default app;
