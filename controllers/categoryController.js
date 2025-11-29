import Category from "../models/category.js";
import ResponseHandler from "../utils/responseHandler.js";
import { getMessage } from "../utils/translations.js";

/**
 * Get all categories (Public)
 * GET /api/categories
 */
export const getAllCategories = async (req, res, next) => {
  try {
    const language = req.language || "en";

    // Get all active categories
    const categories = await Category.find({ isActive: true }).sort("name.en");

    return ResponseHandler.success(
      res,
      200,
      getMessage("SUCCESS", language),
      categories
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create category (Admin)
 * POST /api/categories
 */
export const createCategory = async (req, res, next) => {
  try {
    const language = req.language || "en";
    const { name, description, slug, isActive } = req.body;

    // Check if category with same slug exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return ResponseHandler.error(
        res,
        400,
        language === "en"
          ? "Category with this slug already exists"
          : "Kategori med denne sluggen finnes allerede"
      );
    }

    const category = await Category.create({
      name,
      description,
      slug,
      isActive,
    });

    return ResponseHandler.success(
      res,
      201,
      language === "en"
        ? "Category created successfully"
        : "Kategori opprettet",
      category
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update category (Admin)
 * PUT /api/categories/:id
 */
export const updateCategory = async (req, res, next) => {
  try {
    const language = req.language || "en";
    const { id } = req.params;
    const { name, description, slug, isActive } = req.body;

    // Check if slug is being changed to an existing one
    if (slug) {
      const existingCategory = await Category.findOne({
        slug,
        _id: { $ne: id },
      });
      if (existingCategory) {
        return ResponseHandler.error(
          res,
          400,
          language === "en"
            ? "Category with this slug already exists"
            : "Kategori med denne sluggen finnes allerede"
        );
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name, description, slug, isActive },
      { new: true, runValidators: true }
    );

    if (!category) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Category not found" : "Kategori ikke funnet"
      );
    }

    return ResponseHandler.success(
      res,
      200,
      language === "en"
        ? "Category updated successfully"
        : "Kategori oppdatert",
      category
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category (Admin)
 * DELETE /api/categories/:id
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const language = req.language || "en";
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Category not found" : "Kategori ikke funnet"
      );
    }

    return ResponseHandler.success(
      res,
      200,
      language === "en" ? "Category deleted successfully" : "Kategori slettet"
    );
  } catch (error) {
    next(error);
  }
};
