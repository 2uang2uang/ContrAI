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
/**
 * @swagger
 * /:
 *   get:
 *     summary: Root endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Backend is running
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: DotRepute Backend API
 */
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
