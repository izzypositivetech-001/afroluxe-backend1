/**
 * Image Upload Controller
 * Handles image uploads to Cloudinary
 */

import cloudinary from "../config/cloudinary.js";
import Product from "../models/product.js";
import ResponseHandler from "../utils/responseHandler.js";
import { getMessage } from "../utils/translations.js";

/**
 * Upload product images
 * POST /api/admin/images/products/:productId
 */
export const uploadProductImages = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const language = req.language || "en";

    // Check if files uploaded
    if (!req.files || req.files.length === 0) {
      return ResponseHandler.error(
        res,
        400,
        language === "en" ? "No files uploaded" : "Ingen filer lastet opp"
      );
    }

    // Check product exists
    const product = await Product.findById(productId);
    if (!product) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Product not found" : "Produkt ikke funnet"
      );
    }

    // Upload images to Cloudinary
    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "afroluxe/products",
            resource_type: "image",
            transformation: [
              { width: 1000, height: 1000, crop: "limit" },
              { quality: "auto" },
              { fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(file.buffer);
      });
    });

    const uploadResults = await Promise.all(uploadPromises);

    // Extract URLs only (Product schema expects array of strings)
    const imageUrls = uploadResults.map((result) => result.secure_url);

    // Add image URLs to product
    product.images.push(...imageUrls);
    await product.save();

    // Return metadata for frontend
    const uploadedImages = uploadResults.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
    }));

    return ResponseHandler.success(
      res,
      200,
      language === "en"
        ? "Images uploaded successfully"
        : "Bilder lastet opp vellykket",
      {
        productId: product._id,
        uploadedImages,
        totalImages: product.images.length,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product image
 * DELETE /api/admin/products/:productId/images/:imageIndex
 */
export const deleteProductImage = async (req, res, next) => {
  try {
    const { productId, imageIndex } = req.params;
    const language = req.language || "en";

    const product = await Product.findById(productId);
    if (!product) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Product not found" : "Produkt ikke funnet"
      );
    }

    const index = parseInt(imageIndex);
    if (index < 0 || index >= product.images.length) {
      return ResponseHandler.error(
        res,
        400,
        language === "en" ? "Invalid image index" : "Ugyldig bildeindeks"
      );
    }

    const imageToDelete = product.images[index];

    // Delete from Cloudinary - extract public_id from URL
    if (imageToDelete) {
      const publicId = imageToDelete
        .split("/")
        .slice(-2)
        .join("/")
        .split(".")[0];
      await cloudinary.uploader.destroy(
        `afroluxe/products/${publicId.split("/")[1]}`
      );
    }

    // Remove from product
    product.images.splice(index, 1);
    await product.save();

    return ResponseHandler.success(
      res,
      200,
      language === "en"
        ? "Image deleted successfully"
        : "Bilde slettet vellykket",
      {
        deletedImage: imageToDelete,
        remainingImages: product.images.length,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder product images
 * PATCH /api/admin/products/:productId/images/reorder
 */
export const reorderProductImages = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { imageOrder } = req.body;
    const language = req.language || "en";

    if (!imageOrder || !Array.isArray(imageOrder)) {
      return ResponseHandler.error(res, 400, "Image order array is required");
    }

    const product = await Product.findById(productId);
    if (!product) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Product not found" : "Produkt ikke funnet"
      );
    }

    // Validate image order array
    if (imageOrder.length !== product.images.length) {
      return ResponseHandler.error(
        res,
        400,
        "Image order array length must match number of images"
      );
    }

    // Reorder images
    const reorderedImages = imageOrder.map((index) => {
      if (index < 0 || index >= product.images.length) {
        throw new Error("Invalid image index in order array");
      }
      return product.images[index];
    });

    product.images = reorderedImages;
    await product.save();

    return ResponseHandler.success(
      res,
      200,
      language === "en"
        ? "Images reordered successfully"
        : "Bilder omorganisert vellykket",
      {
        images: product.images,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Set primary image
 * PATCH /api/admin/products/:productId/images/:imageIndex/primary
 */
export const setPrimaryImage = async (req, res, next) => {
  try {
    const { productId, imageIndex } = req.params;
    const language = req.language || "en";

    const product = await Product.findById(productId);
    if (!product) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Product not found" : "Produkt ikke funnet"
      );
    }

    const index = parseInt(imageIndex);
    if (index < 0 || index >= product.images.length) {
      return ResponseHandler.error(
        res,
        400,
        language === "en" ? "Invalid image index" : "Ugyldig bildeindeks"
      );
    }

    // Move selected image to first position
    const selectedImage = product.images.splice(index, 1)[0];
    product.images.unshift(selectedImage);
    await product.save();

    return ResponseHandler.success(
      res,
      200,
      language === "en"
        ? "Primary image set successfully"
        : "Hovedbilde satt vellykket",
      {
        primaryImage: selectedImage,
        images: product.images,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete all product images
 * DELETE /api/admin/products/:productId/images
 */
export const deleteAllProductImages = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const language = req.language || "en";

    const product = await Product.findById(productId);
    if (!product) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Product not found" : "Produkt ikke funnet"
      );
    }

    // Delete all images from Cloudinary
    const deletePromises = product.images.map((imageUrl) => {
      const publicId = imageUrl.split("/").slice(-2).join("/").split(".")[0];
      return cloudinary.uploader.destroy(
        `afroluxe/products/${publicId.split("/")[1]}`
      );
    });

    await Promise.all(deletePromises);

    const deletedCount = product.images.length;
    product.images = [];
    await product.save();

    return ResponseHandler.success(
      res,
      200,
      language === "en"
        ? "All images deleted successfully"
        : "Alle bilder slettet vellykket",
      {
        deletedCount,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get Cloudinary signature for client-side uploads
 * GET /api/admin/images/signature
 */
export const getUploadSignature = async (req, res, next) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: "afroluxe/products",
      },
      process.env.CLOUDINARY_API_SECRET
    );

    return ResponseHandler.success(res, 200, "Signature generated", {
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: "afroluxe/products",
    });
  } catch (error) {
    next(error);
  }
};
