import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import reputationRoutes from './routes/reputation';
import chatRoutes from './routes/chat';

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DotRepute API',
      version: '1.0.0',
      description: 'AI-powered reputation system for Polkadot blockchain',
    },
    servers: [{ url: 'http://localhost:8080', description: 'Development server' }],
    components: {
      schemas: {
        OnChainData: {
          type: 'object',
          properties: {
            identity: {
              type: 'object',
              properties: {
                hasIdentity: { type: 'boolean' },
                isVerified: { type: 'boolean' },
                judgements: { type: 'number' },
              },
            },
            governance: {
              type: 'object',
              properties: {
                votesCount: { type: 'number' },
                proposalsCount: { type: 'number' },
                delegations: { type: 'number' },
              },
            },
            staking: {
              type: 'object',
              properties: {
                totalStaked: { type: 'string' },
                isNominator: { type: 'boolean' },
                isValidator: { type: 'boolean' },
              },
            },
            activity: {
              type: 'object',
              properties: {
                transactionCount: { type: 'number' },
                firstSeen: { type: 'number' },
                lastActive: { type: 'number' },
              },
            },
          },
        },
        ReputationScore: {
          type: 'object',
          properties: {
            totalScore: { type: 'number', minimum: 0, maximum: 100 },
            breakdown: {
              type: 'object',
              properties: {
                identity: { type: 'number' },
                governance: { type: 'number' },
                staking: { type: 'number' },
                activity: { type: 'number' },
              },
            },
            rank: { type: 'string' },
            level: { type: 'string' },
            analysis: { type: 'string' },
            strengths: { type: 'array', items: { type: 'string' } },
            improvements: { type: 'array', items: { type: 'string' } },
            insights: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

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
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 DotRepute Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 Gemini API Key: ${process.env.GEMINI_API_KEY ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
});
