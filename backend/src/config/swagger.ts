import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DotRepute API',
      version: '1.0.0',
      description: 'AI-powered reputation system for Polkadot blockchain',
      contact: {
        name: 'DotRepute Team',
        url: 'https://github.com/dotrepute',
      },
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
      {
        url: 'https://api.dotrepute.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Reputation',
        description: 'Reputation scoring and on-chain data',
      },
      {
        name: 'Chat',
        description: 'AI chat about wallet reputation',
      },
    ],
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
            totalScore: { type: 'number', example: 75 },
            breakdown: {
              type: 'object',
              properties: {
                identity: { type: 'number', example: 20 },
                governance: { type: 'number', example: 25 },
                staking: { type: 'number', example: 15 },
                activity: { type: 'number', example: 15 },
              },
            },
            rank: { type: 'string', example: 'Top 10%' },
            level: { type: 'string', example: 'Expert' },
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
            details: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
