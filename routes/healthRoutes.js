/**
 * Health Check Routes
 * System health monitoring endpoints
 */

import express from 'express';
import {
  healthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck
} from '../controllers/healthController.js';

const router = express.Router();

// Basic health check (public)
router.get('/', healthCheck);

// Detailed health check (public)
router.get('/detailed', detailedHealthCheck);

// Kubernetes readiness probe
router.get('/ready', readinessCheck);

// Kubernetes liveness probe
router.get('/live', livenessCheck);

export default router;