/**
 * Security Configuration
 * Configure security middleware
 */

import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import cors from 'cors';

/**
 * Configure Helmet for security headers
 */
export const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:', 'http:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  });
};

/**
 * Configure CORS
 */
export const configureCors = () => {
  const whitelist = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000'
  ].filter(Boolean);

  return cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (whitelist.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language']
  });
};

/**
 * Configure MongoDB sanitization
 * Prevents NoSQL injection attacks
 */
export const configureMongoSanitize = () => {
  return mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`MongoDB injection attempt detected: ${key} in ${req.path}`);
    }
  });
};

/**
 * Configure XSS protection
 * Sanitizes user input to prevent XSS attacks
 */
export const configureXssClean = () => {
  return xss();
};

/**
 * Configure HPP (HTTP Parameter Pollution)
 * Prevents parameter pollution attacks
 */
export const configureHpp = () => {
  return hpp({
    whitelist: [
      'price',
      'sortBy',
      'sortOrder',
      'category',
      'page',
      'limit',
      'minPrice',
      'maxPrice',
      'q',
      'inStock'
    ]
  });
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req, res, next) => {
  // Remove powered by Express header
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * Request logging for security monitoring
 */
export const securityLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress;
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    /(\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin)/i, // MongoDB operators
    /<script>/i, // XSS attempts
    /(\bOR\b|\bAND\b).*=.*=/i, // SQL injection patterns
    /\.\.\//i, // Path traversal
    /(union|select|insert|update|delete|drop|create|alter|exec|script)/i // SQL keywords
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(req.originalUrl) || 
    (req.body && pattern.test(JSON.stringify(req.body))) ||
    (req.query && pattern.test(JSON.stringify(req.query)))
  );
  
  if (isSuspicious) {
    console.warn(`[SECURITY] Suspicious request detected:`, {
      timestamp,
      method,
      path,
      ip,
      userAgent: req.headers['user-agent']
    });
  }
  
  next();
};

/**
 * IP blocking middleware (simple implementation)
 */
const blockedIPs = new Set();

export const blockIP = (ip) => {
  blockedIPs.add(ip);
  console.log(`[SECURITY] IP blocked: ${ip}`);
};

export const unblockIP = (ip) => {
  blockedIPs.delete(ip);
  console.log(`[SECURITY] IP unblocked: ${ip}`);
};

export const ipBlocker = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  if (blockedIPs.has(ip)) {
    console.warn(`[SECURITY] Blocked IP attempted access: ${ip}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Your IP has been blocked.'
    });
  }
  
  next();
};

/**
 * Get list of blocked IPs
 */
export const getBlockedIPs = () => {
  return Array.from(blockedIPs);
};