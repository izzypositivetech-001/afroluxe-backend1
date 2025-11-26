
import Order from '../models/order.js';
import Product from '../models/product.js';
import Admin from '../models/admin.js';
import ResponseHandler from '../utils/responseHandler.js';
import { getMessage } from '../utils/translations.js';

/**
 * Get dashboard overview
 * GET /api/admin/analytics/dashboard
 */
export const getDashboardOverview = async (req, res, next) => {
  try {
    const language = req.language || 'en';

    // Date range (default: last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total revenue (all time)
    const revenueData = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // Recent revenue (last 30 days)
    const recentRevenueData = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          recentRevenue: { $sum: '$total' },
          recentOrders: { $sum: 1 }
        }
      }
    ]);

    // Total customers (unique emails)
    const uniqueCustomers = await Order.distinct('customer.email');

    // Total products
    const totalProducts = await Product.countDocuments();

    // Active products (in stock)
    const activeProducts = await Product.countDocuments({ stock: { $gt: 0 } });

    // Low stock products (stock < 10)
    const lowStockProducts = await Product.countDocuments({
      stock: { $gt: 0, $lt: 10 }
    });

    // Out of stock products
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent orders (last 5)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderId customer.name total orderStatus paymentStatus createdAt');

    const dashboard = {
      revenue: {
        total: revenueData[0]?.totalRevenue || 0,
        recent: recentRevenueData[0]?.recentRevenue || 0,
        averageOrderValue: revenueData[0]?.totalRevenue 
          ? Math.round((revenueData[0].totalRevenue / revenueData[0].totalOrders) * 100) / 100
          : 0
      },
      orders: {
        total: revenueData[0]?.totalOrders || 0,
        recent: recentRevenueData[0]?.recentOrders || 0,
        byStatus: ordersByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      customers: {
        total: uniqueCustomers.length
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts
      },
      recentOrders
    };

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      dashboard
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue analytics
 * GET /api/admin/analytics/revenue
 */
export const getRevenueAnalytics = async (req, res, next) => {
  try {
    const language = req.language || 'en';
    const { startDate, endDate, groupBy = 'day' } = req.query;

    // Date range
    const matchStage = { paymentStatus: 'paid' };
    
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Group format based on groupBy parameter
    let groupFormat;
    switch (groupBy) {
      case 'hour':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
        break;
      case 'day':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        groupFormat = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      case 'year':
        groupFormat = {
          year: { $year: '$createdAt' }
        };
        break;
      default:
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    // Revenue over time
    const revenueOverTime = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Total revenue in period
    const totalRevenue = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          orders: { $sum: 1 },
          average: { $avg: '$total' }
        }
      }
    ]);

    // Revenue by payment method
    const revenueByPaymentMethod = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      }
    ]);

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      {
        summary: {
          totalRevenue: totalRevenue[0]?.total || 0,
          totalOrders: totalRevenue[0]?.orders || 0,
          averageOrderValue: Math.round((totalRevenue[0]?.average || 0) * 100) / 100
        },
        revenueOverTime,
        revenueByPaymentMethod
      }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Get product analytics
 * GET /api/admin/analytics/products
 */
export const getProductAnalytics = async (req, res, next) => {
  try {
    const language = req.language || 'en';
    const { startDate, endDate, limit = 10 } = req.query;

    // Date range for orders
    const matchStage = { orderStatus: { $ne: 'cancelled' } };
    
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Top selling products
    const topSellingProducts = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          name: '$product.name',
          sku: '$product.sku',
          currentStock: '$product.stock',
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: 1
        }
      }
    ]);

    // Top revenue generating products
    const topRevenueProducts = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          totalQuantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          name: '$product.name',
          sku: '$product.sku',
          totalRevenue: 1,
          totalQuantity: 1
        }
      }
    ]);

    // Products by category
    const productsByCategory = await Product.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$categoryInfo.name',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          averagePrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Low stock products
    const lowStockProducts = await Product.find({
      stock: { $gt: 0, $lt: 10 }
    })
      .select('name sku stock price')
      .sort({ stock: 1 })
      .limit(parseInt(limit));

    // Out of stock products
    const outOfStockProducts = await Product.find({ stock: 0 })
      .select('name sku price salesCount')
      .sort({ salesCount: -1 })
      .limit(parseInt(limit));

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      {
        topSellingProducts,
        topRevenueProducts,
        productsByCategory,
        lowStockProducts,
        outOfStockProducts
      }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Get customer analytics
 * GET /api/admin/analytics/customers
 */
export const getCustomerAnalytics = async (req, res, next) => {
  try {
    const language = req.language || 'en';
    const { limit = 10 } = req.query;

    // Top customers by total spending
    const topCustomers = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: '$customer.email',
          customerName: { $first: '$customer.name' },
          totalSpent: { $sum: '$total' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Customer distribution by order count
    const customersByOrderCount = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: '$customer.email',
          orderCount: { $sum: 1 }
        }
      },
      {
        $bucket: {
          groupBy: '$orderCount',
          boundaries: [1, 2, 3, 5, 10, 20],
          default: '20+',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // New vs returning customers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCustomers = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$customer.email',
          firstOrder: { $min: '$createdAt' }
        }
      },
      {
        $group: {
          _id: null,
          newCustomers: {
            $sum: {
              $cond: [{ $gte: ['$firstOrder', thirtyDaysAgo] }, 1, 0]
            }
          },
          returningCustomers: {
            $sum: {
              $cond: [{ $lt: ['$firstOrder', thirtyDaysAgo] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Customer lifetime value distribution
    const customerLTV = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: '$customer.email',
          lifetimeValue: { $sum: '$total' }
        }
      },
      {
        $bucket: {
          groupBy: '$lifetimeValue',
          boundaries: [0, 1000, 5000, 10000, 50000],
          default: '50000+',
          output: {
            count: { $sum: 1 },
            averageLTV: { $avg: '$lifetimeValue' }
          }
        }
      }
    ]);

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      {
        topCustomers,
        customersByOrderCount,
        newVsReturning: recentCustomers[0] || {
          newCustomers: 0,
          returningCustomers: 0
        },
        customerLTV
      }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Get sales trends
 * GET /api/admin/analytics/trends
 */
export const getSalesTrends = async (req, res, next) => {
  try {
    const language = req.language || 'en';
    const { period = 'month' } = req.query;

    let startDate;
    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
    }

    // Sales trend
    const salesTrend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Calculate growth rate
    let growthRate = 0;
    if (salesTrend.length >= 2) {
      const recent = salesTrend[salesTrend.length - 1].revenue;
      const previous = salesTrend[0].revenue;
      growthRate = previous > 0 
        ? Math.round(((recent - previous) / previous) * 10000) / 100
        : 0;
    }

    // Order status trends
    const orderStatusTrend = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            status: '$orderStatus'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date.year': 1, '_id.date.month': 1, '_id.date.day': 1 } }
    ]);

    // Average order value trend
    const aovTrend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          averageOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      {
        period,
        growthRate,
        salesTrend,
        orderStatusTrend,
        aovTrend
      }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Export analytics report
 * GET /api/admin/analytics/export
 */
export const exportAnalyticsReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;

    // Date range
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Get orders with details
    const orders = await Order.find(matchStage)
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // CSV format
      const csvHeaders = [
        'Order ID',
        'Date',
        'Customer Name',
        'Customer Email',
        'Items',
        'Subtotal',
        'Tax',
        'Total',
        'Order Status',
        'Payment Status',
        'Payment Method'
      ].join(',');

      const csvRows = orders.map(order => {
        const items = order.items
          .map(item => `${item.name.en} (x${item.quantity})`)
          .join('; ');

        return [
          order.orderId,
          order.createdAt.toISOString().split('T')[0],
          order.customer.name,
          order.customer.email,
          `"${items}"`,
          order.subtotal,
          order.tax,
          order.total,
          order.orderStatus,
          order.paymentStatus,
          order.paymentMethod
        ].join(',');
      });

      const csv = [csvHeaders, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=analytics-report-${Date.now()}.csv`
      );

      return res.send(csv);
    }

    // JSON format
    return ResponseHandler.success(
      res,
      200,
      'Analytics report generated',
      {
        reportDate: new Date(),
        period: { startDate, endDate },
        totalOrders: orders.length,
        orders: orders.map(order => ({
          orderId: order.orderId,
          date: order.createdAt,
          customer: order.customer,
          items: order.items.length,
          total: order.total,
          status: order.orderStatus,
          paymentStatus: order.paymentStatus
        }))
      }
    );

  } catch (error) {
    next(error);
  }
};