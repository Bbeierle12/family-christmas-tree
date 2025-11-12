import 'express-async-errors';
import express, { Express } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase } from './config/database';
import { redis } from './config/redis';
import {
  securityHeaders,
  corsMiddleware,
  apiRateLimiter,
} from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Create Express app
const app: Express = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
  },
});

// Attach Socket.IO to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security
app.use(securityHeaders);
app.use(corsMiddleware);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', apiRateLimiter);

// Request logging (in development)
if (env.isDevelopment) {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', async (req, res) => {
  try {
    // Check database
    await redis.ping();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// API ROUTES
// ============================================================================

// Import routes
import authRoutes from './modules/auth/auth.routes';
import workspaceRoutes from './modules/workspaces/workspaces.routes';
import giftMapRoutes from './modules/gift-maps/gift-maps.routes';
import peopleRoutes from './modules/people/people.routes';
import giftIdeasRoutes from './modules/gift-ideas/gift-ideas.routes';

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1', giftMapRoutes); // Mounted at /api/v1 for both /workspaces/:id/gift-maps and /gift-maps/:id
app.use('/api/v1', peopleRoutes); // Mounted at /api/v1 for both /gift-maps/:id/people and /people/:id
app.use('/api/v1', giftIdeasRoutes); // Mounted at /api/v1 for both /people/:id/gift-ideas and /gift-ideas/:id

// API root endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Gift Map API v1',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      workspaces: '/api/v1/workspaces',
      giftMaps: '/api/v1/gift-maps',
      people: '/api/v1/people',
      giftIdeas: '/api/v1/gift-ideas',
    },
    stats: {
      totalEndpoints: '40+',
      modules: ['auth', 'workspaces', 'gift-maps', 'people', 'gift-ideas'],
    },
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// WEBSOCKET SETUP
// ============================================================================

io.on('connection', (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`);
  });

  // More WebSocket handlers will be added later
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Test Redis connection
    await redis.ping();
    logger.info('✅ Redis connection successful');

    // Start HTTP server
    httpServer.listen(env.PORT, env.HOST, () => {
      logger.info('='.repeat(50));
      logger.info(`🚀 Server started successfully`);
      logger.info(`📡 Environment: ${env.NODE_ENV}`);
      logger.info(`🌐 URL: http://${env.HOST}:${env.PORT}`);
      logger.info(`📚 API: http://${env.HOST}:${env.PORT}/api/v1`);
      logger.info(`❤️  Health: http://${env.HOST}:${env.PORT}/health`);
      logger.info('='.repeat(50));
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');

  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  await redis.quit();
  logger.info('Redis connection closed');

  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

export { app, httpServer, io };
