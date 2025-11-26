/**
 * Search Controller
 * Advanced product search and filtering
 */

import Product from '../models/product.js';
import Category from '../models/category.js';
import ResponseHandler from '../utils/responseHandler.js';
import { getMessage } from '../utils/translations.js';

/**
 * Advanced product search with filters
 * GET /api/search
 */
export const advancedSearch = async (req, res, next) => {
  try {
    const language = req.language || 'en';
    const {
      q,                    // Search query
      category,             // Category filter
      minPrice,             // Minimum price
      maxPrice,             // Maximum price
      inStock,              // In stock only
      sortBy,               // Sort field
      sortOrder,            // Sort direction
      page = 1,             // Page number
      limit = 20            // Items per page
    } = req.query;

    // Build search query
    const searchQuery = {};

    // Text search
    if (q) {
      const searchRegex = new RegExp(q, 'i');
      searchQuery.$or = [
        { [`name.${language}`]: searchRegex },
        { [`description.${language}`]: searchRegex },
        { sku: searchRegex },
        { tags: searchRegex }
      ];
    }

    // Category filter
    if (category) {
      searchQuery.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery.price.$lte = parseFloat(maxPrice);
    }

    // Stock filter
    if (inStock === 'true') {
      searchQuery.stock = { $gt: 0 };
    }

    // Build sort
    let sort = {};
    if (sortBy) {
      const order = sortOrder === 'asc' ? 1 : -1;
      
      // Handle special sort cases
      if (sortBy === 'name') {
        sort[`name.${language}`] = order;
      } else if (sortBy === 'popularity') {
        sort.salesCount = order;
      } else {
        sort[sortBy] = order;
      }
    } else {
      // Default sort: relevance (for search) or newest
      sort = q ? { salesCount: -1 } : { createdAt: -1 };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute search
    const products = await Product.find(searchQuery)
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalProducts = await Product.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    // Get facets for filtering
    const facets = await getFacets(q, language);

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts,
          productsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        },
        facets,
        appliedFilters: {
          query: q || null,
          category: category || null,
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
          inStock: inStock === 'true',
          sortBy: sortBy || 'relevance',
          sortOrder: sortOrder || 'desc'
        }
      }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Get search suggestions (autocomplete)
 * GET /api/search/suggestions
 */
export const getSearchSuggestions = async (req, res, next) => {
  try {
    const language = req.language || 'en';
    const { q, limit = 5 } = req.query;

    if (!q || q.length < 2) {
      return ResponseHandler.success(
        res,
        200,
        getMessage('SUCCESS', language),
        { suggestions: [] }
      );
    }

    const searchRegex = new RegExp(q, 'i');

    // Get product name suggestions
    const productSuggestions = await Product.find({
      $or: [
        { [`name.${language}`]: searchRegex },
        { sku: searchRegex }
      ]
    })
      .select(`name.${language} sku images`)
      .limit(parseInt(limit));

    // Get category suggestions
    const categorySuggestions = await Category.find({
      [`name.${language}`]: searchRegex
    })
      .select(`name.${language}`)
      .limit(3);

    // Format suggestions
    const suggestions = {
      products: productSuggestions.map(p => ({
        type: 'product',
        id: p._id,
        name: p.name[language],
        sku: p.sku,
        image: p.images[0]?.url || null
      })),
      categories: categorySuggestions.map(c => ({
        type: 'category',
        id: c._id,
        name: c.name[language]
      }))
    };

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      suggestions
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Get filter options (facets)
 * GET /api/search/facets
 */
export const getFilterOptions = async (req, res, next) => {
  try {
    const language = req.language || 'en';
    const { q } = req.query;

    // Build base query if search term provided
    let baseQuery = {};
    if (q) {
      const searchRegex = new RegExp(q, 'i');
      baseQuery.$or = [
        { [`name.${language}`]: searchRegex },
        { [`description.${language}`]: searchRegex },
        { sku: searchRegex }
      ];
    }

    const facets = await getFacets(q, language);

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      facets
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Search by category
 * GET /api/search/category/:categoryId
 */
export const searchByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const language = req.language || 'en';
    const {
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Verify category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return ResponseHandler.error(
        res,
        404,
        language === 'en' ? 'Category not found' : 'Kategori ikke funnet'
      );
    }

    // Build query
    const query = { category: categoryId };

    // Price filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Stock filter
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Build sort
    let sort = {};
    const order = sortOrder === 'asc' ? 1 : -1;
    
    if (sortBy === 'name') {
      sort[`name.${language}`] = order;
    } else if (sortBy === 'popularity') {
      sort.salesCount = order;
    } else {
      sort[sortBy] = order;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get products
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    // Get price range for this category
    const priceRange = await Product.aggregate([
      { $match: { category: category._id } },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      {
        category: {
          id: category._id,
          name: category.name[language]
        },
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts,
          productsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        },
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 }
      }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Get popular searches
 * GET /api/search/popular
 */
export const getPopularSearches = async (req, res, next) => {
  try {
    const language = req.language || 'en';
    const { limit = 10 } = req.query;

    // Get top selling products as popular searches
    const popularProducts = await Product.find()
      .select(`name.${language} salesCount`)
      .sort({ salesCount: -1 })
      .limit(parseInt(limit));

    // Get all categories as popular
    const popularCategories = await Category.find()
      .select(`name.${language}`)
      .limit(5);

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      {
        products: popularProducts.map(p => p.name[language]),
        categories: popularCategories.map(c => c.name[language])
      }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Search by price range
 * GET /api/search/price-range
 */
export const searchByPriceRange = async (req, res, next) => {
  try {
    const language = req.language || 'en';
    const {
      minPrice,
      maxPrice,
      category,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (category) {
      query.category = category;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('category', 'name')
      .sort({ price: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts,
          productsPerPage: parseInt(limit)
        },
        priceRange: {
          min: minPrice || 0,
          max: maxPrice || 'unlimited'
        }
      }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to get facets
 */
async function getFacets(searchQuery, language) {
  // Build base query if search term provided
  let baseQuery = {};
  if (searchQuery) {
    const searchRegex = new RegExp(searchQuery, 'i');
    baseQuery.$or = [
      { [`name.${language}`]: searchRegex },
      { [`description.${language}`]: searchRegex },
      { sku: searchRegex }
    ];
  }

  // Get categories with product count
  const categories = await Product.aggregate([
    ...(Object.keys(baseQuery).length > 0 ? [{ $match: baseQuery }] : []),
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: '$category' },
    {
      $project: {
        categoryId: '$_id',
        name: `$category.name.${language}`,
        count: 1
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get price ranges
  const priceRanges = await Product.aggregate([
    ...(Object.keys(baseQuery).length > 0 ? [{ $match: baseQuery }] : []),
    {
      $bucket: {
        groupBy: '$price',
        boundaries: [0, 500, 1000, 2000, 5000, 10000],
        default: '10000+',
        output: {
          count: { $sum: 1 },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    }
  ]);

  // Get stock availability
  const stockCounts = await Product.aggregate([
    ...(Object.keys(baseQuery).length > 0 ? [{ $match: baseQuery }] : []),
    {
      $group: {
        _id: null,
        inStock: {
          $sum: { $cond: [{ $gt: ['$stock', 0] }, 1, 0] }
        },
        outOfStock: {
          $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] }
        }
      }
    }
  ]);

  return {
    categories,
    priceRanges: priceRanges.map(range => ({
      range: range._id === '10000+' ? '10000+' : `${range._id}-${range._id === 10000 ? '+' : ''}`,
      min: range._id === '10000+' ? 10000 : range._id,
      max: range._id === '10000+' ? null : range.minPrice,
      count: range.count
    })),
    stock: stockCounts[0] || { inStock: 0, outOfStock: 0 }
  };
}