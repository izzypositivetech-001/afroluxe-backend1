/**
 * Health Check Controller
 * System health and status endpoints
 */

import mongoose from 'mongoose';
import ResponseHandler from '../utils/responseHandler.js';
import Product from '../models/product.js';
import Order from '../models/order.js';
import Admin from '../models/admin.js';

/**
 * Basic health check
 * GET /api/health
 */
export const healthCheck = async (req, res, next) => {
  try {
    return ResponseHandler.success(
      res,
      200,
      'Server is healthy',
      {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Detailed health check
 * GET /api/health/detailed
 */
export const detailedHealthCheck = async (req, res, next) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // Get database stats
    let dbStats = null;
    if (dbState === 1) {
      try {
        const stats = await mongoose.connection.db.stats();
        dbStats = {
          collections: stats.collections,
          dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
          storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
          indexes: stats.indexes
        };
      } catch (error) {
        dbStats = { error: 'Unable to fetch database stats' };
      }
    }

    // Check collections
    const collections = {
      products: await Product.countDocuments(),
      orders: await Order.countDocuments(),
      admins: await Admin.countDocuments()
    };

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memory = {
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
    };

    // System info
    const system = {
      platform: process.platform,
      nodeVersion: process.version,
      cpuUsage: process.cpuUsage(),
      uptime: `${Math.floor(process.uptime() / 60)} minutes`
    };

    // Overall health status
    const isHealthy = dbState === 1;

    return ResponseHandler.success(
      res,
      isHealthy ? 200 : 503,
      isHealthy ? 'System healthy' : 'System unhealthy',
      {
        status: isHealthy ? 'OK' : 'ERROR',
        timestamp: new Date().toISOString(),
        database: {
          status: dbStatus[dbState],
          connected: dbState === 1,
          stats: dbStats
        },
        collections,
        memory,
        system,
        environment: process.env.NODE_ENV || 'development'
      }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Readiness check
 * GET /api/health/ready
 */
export const readinessCheck = async (req, res, next) => {
  try {
    const dbConnected = mongoose.connection.readyState === 1;
    
    if (!dbConnected) {
      return ResponseHandler.error(
        res,
        503,
        'Service not ready - database disconnected'
      );
    }

    return ResponseHandler.success(
      res,
      200,
      'Service is ready',
      {
        status: 'READY',
        database: 'connected',
        timestamp: new Date().toISOString()
      }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Liveness check
 * GET /api/health/live
 */
export const livenessCheck = async (req, res, next) => {
  try {
    return ResponseHandler.success(
      res,
      200,
      'Service is alive',
      {
        status: 'ALIVE',
        timestamp: new Date().toISOString()
      }
    );
  } catch (error) {
    next(error);
  }
};