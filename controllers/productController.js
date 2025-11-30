import Product from "../models/product.js";
import Category from "../models/category.js";
import ResponseHandler from "../utils/responseHandler.js";
import { getMessage } from "../utils/translations.js";

export const getAllProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const language = req.language || "en";

    // Build filter
    const filter = { isActive: true };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [
        { "name.en": searchRegex },
        { "name.no": searchRegex },
        { sku: searchRegex },
      ];
    }

    // Get products with category populated
    const products = await Product.find(filter)
      .populate("category")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Product.countDocuments(filter);

    // Transform products based on language
    const transformedProducts = products.map((product) => ({
      _id: product._id,
      name: product.name[language],
      description: product.description[language],
      category: product.category
        ? {
            _id: product.category._id,
            name: product.category.name[language],
            slug: product.category.slug,
          }
        : null,
      price: product.price,
      images: product.images,
      stock: product.stock,
      sku: product.sku,
      weight: product.weight,
      isActive: product.isActive,
      salesCount: product.salesCount,
      createdAt: product.createdAt,
    }));

    return ResponseHandler.paginated(
      res,
      200,
      getMessage("SUCCESS", language),
      transformedProducts,
      {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get single product by ID (Public)
 * GET /api/products/:id
 */
export const getProductById = async (req, res, next) => {
  try {
    const language = req.language || "en";

    const product = await Product.findById(req.params.id)
      .populate("category")
      .lean();

    if (!product) {
      return ResponseHandler.error(
        res,
        404,
        getMessage("PRODUCT_NOT_FOUND", language)
      );
    }

    // Transform product based on language
    const transformedProduct = {
      _id: product._id,
      name: product.name[language],
      description: product.description[language],
      category: product.category
        ? {
            _id: product.category._id,
            name: product.category.name[language],
            slug: product.category.slug,
          }
        : null,
      price: product.price,
      images: product.images,
      stock: product.stock,
      sku: product.sku,
      weight: product.weight,
      dimensions: product.dimensions,
      isActive: product.isActive,
      salesCount: product.salesCount,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return ResponseHandler.success(
      res,
      200,
      getMessage("SUCCESS", language),
      transformedProduct
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get products by category (Public)
 * GET /api/products/category/:categoryId
 */
export const getProductsByCategory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const language = req.language || "en";

    const products = await Product.find({
      category: req.params.categoryId,
      isActive: true,
    })
      .populate("category")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Product.countDocuments({
      category: req.params.categoryId,
      isActive: true,
    });

    // Transform products
    const transformedProducts = products.map((product) => ({
      _id: product._id,
      name: product.name[language],
      description: product.description[language],
      category: product.category
        ? {
            _id: product.category._id,
            name: product.category.name[language],
            slug: product.category.slug,
          }
        : null,
      price: product.price,
      images: product.images,
      stock: product.stock,
      sku: product.sku,
      createdAt: product.createdAt,
    }));

    return ResponseHandler.paginated(
      res,
      200,
      getMessage("SUCCESS", language),
      transformedProducts,
      {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Search products (Public)
 * GET /api/products/search?q=keyword
 */
export const searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const language = req.language || "en";

    if (!q) {
      return ResponseHandler.error(res, 400, "Search query is required");
    }

    const searchRegex = new RegExp(q, "i");

    const products = await Product.find({
      isActive: true,
      $or: [
        { "name.en": searchRegex },
        { "name.no": searchRegex },
        { "description.en": searchRegex },
        { "description.no": searchRegex },
        { sku: searchRegex },
      ],
    })
      .populate("category")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Product.countDocuments({
      isActive: true,
      $or: [
        { "name.en": searchRegex },
        { "name.no": searchRegex },
        { "description.en": searchRegex },
        { "description.no": searchRegex },
        { sku: searchRegex },
      ],
    });

    // Transform products
    const transformedProducts = products.map((product) => ({
      _id: product._id,
      name: product.name[language],
      description: product.description[language],
      category: product.category
        ? {
            _id: product.category._id,
            name: product.category.name[language],
          }
        : null,
      price: product.price,
      images: product.images,
      stock: product.stock,
      sku: product.sku,
    }));

    return ResponseHandler.paginated(
      res,
      200,
      getMessage("SUCCESS", language),
      transformedProducts,
      {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create product (Admin)
 * POST /api/admin/products
 */
export const createProduct = async (req, res, next) => {
  try {
    const language = req.language || "en";

    // Verify category exists
    const category = await Category.findById(req.body.category);
    if (!category) {
      return ResponseHandler.error(res, 404, "Category not found");
    }

    const product = await Product.create(req.body);

    return ResponseHandler.success(
      res,
      201,
      getMessage("CREATED", language),
      product
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update product (Admin)
 * PUT /api/admin/products/:id
 */
export const updateProduct = async (req, res, next) => {
  try {
    const language = req.language || "en";

    // If category is being updated, verify it exists
    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (!category) {
        return ResponseHandler.error(res, 404, "Category not found");
      }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("category");

    if (!product) {
      return ResponseHandler.error(
        res,
        404,
        getMessage("PRODUCT_NOT_FOUND", language)
      );
    }

    return ResponseHandler.success(
      res,
      200,
      getMessage("UPDATED", language),
      product
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product (Admin)
 * DELETE /api/admin/products/:id
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const language = req.language || "en";

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return ResponseHandler.error(
        res,
        404,
        getMessage("PRODUCT_NOT_FOUND", language)
      );
    }

    return ResponseHandler.success(res, 200, getMessage("DELETED", language), {
      id: product._id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all products for admin (Admin)
 * GET /api/admin/products
 * Includes inactive products
 */
export const getAdminProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter (no isActive filter for admin)
    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.status) {
      filter.isActive = req.query.status === "active";
    }

    const products = await Product.find(filter)
      .populate("category")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const [total, activeCount, lowStockCount, outOfStockCount] =
      await Promise.all([
        Product.countDocuments(filter),
        Product.countDocuments({ ...filter, isActive: true }),
        Product.countDocuments({ ...filter, stock: { $gt: 0, $lte: 10 } }),
        Product.countDocuments({ ...filter, stock: 0 }),
      ]);

    return ResponseHandler.paginated(
      res,
      200,
      "Products retrieved successfully",
      products,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        stats: {
          active: activeCount,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
        },
      }
    );
  } catch (error) {
    next(error);
  }
};
