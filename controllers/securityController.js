/**
 * Security Management Controller
 * Admin endpoints for security management
 */

import ResponseHandler from '../utils/responseHandler.js';
import { getMessage } from '../utils/translations.js';
import { blockIP, unblockIP, getBlockedIPs } from '../middleware/security.js';

/**
 * Get security status
 * GET /api/admin/security/status
 */
export const getSecurityStatus = async (req, res, next) => {
  try {
    const language = req.language || 'en';

    const status = {
      rateLimiting: {
        enabled: true,
        limits: {
          api: '100 requests per 15 minutes',
          auth: '5 requests per 15 minutes',
          order: '10 requests per hour',
          search: '200 requests per 15 minutes',
          payment: '10 requests per 15 minutes',
          passwordReset: '3 requests per hour'
        }
      },
      security: {
        helmet: 'enabled',
        cors: 'enabled',
        mongoSanitize: 'enabled',
        xssProtection: 'enabled',
        hpp: 'enabled',
        ipBlocking: 'enabled'
      },
      blockedIPs: {
        count: getBlockedIPs().length,
        ips: getBlockedIPs()
      },
      environment: process.env.NODE_ENV || 'development'
    };

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      status
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Block an IP address
 * POST /api/admin/security/block-ip
 */
export const blockIPAddress = async (req, res, next) => {
  try {
    const language = req.language || 'en';
    const { ip } = req.body;

    if (!ip) {
      return ResponseHandler.error(
        res,
        400,
        language === 'en' ? 'IP address is required' : 'IP-adresse er påkrevd'
      );
    }

    // Validate IP format (simple validation)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return ResponseHandler.error(
        res,
        400,
        language === 'en' ? 'Invalid IP address format' : 'Ugyldig IP-adresseformat'
      );
    }

    // Block the IP
    blockIP(ip);

    return ResponseHandler.success(
      res,
      200,
      language === 'en' ? 'IP address blocked successfully' : 'IP-adresse blokkert vellykket',
      { blockedIP: ip, blockedIPs: getBlockedIPs() }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Unblock an IP address
 * POST /api/admin/security/unblock-ip
 */
export const unblockIPAddress = async (req, res, next) => {
  try {
    const language = req.language || 'en';
    const { ip } = req.body;

    if (!ip) {
      return ResponseHandler.error(
        res,
        400,
        language === 'en' ? 'IP address is required' : 'IP-adresse er påkrevd'
      );
    }

    // Unblock the IP
    unblockIP(ip);

    return ResponseHandler.success(
      res,
      200,
      language === 'en' ? 'IP address unblocked successfully' : 'IP-adresse fjernet fra blokkeringsliste',
      { unblockedIP: ip, blockedIPs: getBlockedIPs() }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Get list of blocked IPs
 * GET /api/admin/security/blocked-ips
 */
export const getBlockedIPsList = async (req, res, next) => {
  try {
    const language = req.language || 'en';

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      {
        count: getBlockedIPs().length,
        blockedIPs: getBlockedIPs()
      }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Clear all blocked IPs
 * POST /api/admin/security/clear-blocked-ips
 */
export const clearBlockedIPs = async (req, res, next) => {
  try {
    const language = req.language || 'en';

    const ips = getBlockedIPs();
    ips.forEach(ip => unblockIP(ip));

    return ResponseHandler.success(
      res,
      200,
      language === 'en' ? 'All blocked IPs cleared' : 'Alle blokkerte IP-adresser fjernet',
      { clearedCount: ips.length }
    );

  } catch (error) {
    next(error);
  }
};