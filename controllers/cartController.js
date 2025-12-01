import Cart from "../models/cart.js";
import Product from "../models/product.js";
import ResponseHandler from "../utils/responseHandler.js";
import { getMessage } from "../utils/translations.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Helper to transform cart for response
 */
const transformCart = (cart, language) => {
  return {
    _id: cart._id,
    sessionId: cart.sessionId,
    items: cart.items.map((item) => ({
      _id: item._id,
      product: item.product
        ? {
            _id: item.product._id,
            name:
              item.product.name[language] ||
              item.product.name.en ||
              item.product.name,
            images: item.product.images,
            stock: item.product.stock,
            sku: item.product.sku,
            price: item.product.price,
            slug: item.product.slug,
          }
        : null,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    })),
    totalAmount: cart.totalAmount,
    expiresAt: cart.expiresAt,
    createdAt: cart.createdAt,
  };
};

/**
 * Add item to cart
 * POST /api/cart/add
 */
export const addToCart = async (req, res, next) => {
  try {
    const { sessionId, productId, quantity } = req.body;
    const language = req.language || "en";

    // Validate inputs
    if (!productId || !quantity) {
      return ResponseHandler.error(
        res,
        400,
        "Product ID and quantity are required"
      );
    }

    // Verify product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return ResponseHandler.error(
        res,
        404,
        getMessage("PRODUCT_NOT_FOUND", language)
      );
    }

    // Check stock availability
    if (product.stock < quantity) {
      return ResponseHandler.error(
        res,
        400,
        getMessage("INSUFFICIENT_STOCK", language)
      );
    }

    // Generate session ID if not provided
    const finalSessionId = sessionId || uuidv4();

    // Find or create cart
    let cart = await Cart.findOne({ sessionId: finalSessionId });

    if (!cart) {
      // Create new cart
      cart = new Cart({
        sessionId: finalSessionId,
        items: [
          {
            product: productId,
            quantity,
            price: product.price,
          },
        ],
      });
    } else {
      // Check if product already in cart
      const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;

        // Check stock for new quantity
        if (product.stock < newQuantity) {
          return ResponseHandler.error(
            res,
            400,
            getMessage("INSUFFICIENT_STOCK", language)
          );
        }

        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].price = product.price;
      } else {
        // Add new item
        cart.items.push({
          product: productId,
          quantity,
          price: product.price,
        });
      }
    }

    await cart.save();
    await cart.populate("items.product");

    return ResponseHandler.success(
      res,
      200,
      getMessage("ITEM_ADDED_TO_CART", language),
      transformCart(cart, language)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get cart by session ID
 * GET /api/cart/:sessionId
 */
export const getCart = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const language = req.language || "en";

    let cart = await Cart.findOne({ sessionId }).populate("items.product");

    // Create empty cart if it doesn't exist
    if (!cart) {
      try {
        cart = await Cart.create({
          sessionId,
          items: [],
          totalAmount: 0,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });
      } catch (error) {
        // Handle race condition: if cart was created by another request concurrently
        if (error.code === 11000) {
          cart = await Cart.findOne({ sessionId }).populate("items.product");
        } else {
          throw error;
        }
      }
    }

    return ResponseHandler.success(
      res,
      200,
      getMessage("SUCCESS", language),
      transformCart(cart, language)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update cart item quantity
 * PUT /api/cart/update
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const { sessionId, productId, quantity } = req.body;
    const language = req.language || "en";

    // Validate inputs
    if (!sessionId || !productId || quantity === undefined) {
      return ResponseHandler.error(
        res,
        400,
        "Session ID, product ID, and quantity are required"
      );
    }

    const cart = await Cart.findOne({ sessionId });

    if (!cart) {
      return ResponseHandler.error(res, 404, "Cart not found");
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return ResponseHandler.error(res, 404, "Item not found in cart");
    }

    // If quantity is 0, remove item
    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      // Verify product stock
      const product = await Product.findById(productId);
      if (!product) {
        return ResponseHandler.error(
          res,
          404,
          getMessage("PRODUCT_NOT_FOUND", language)
        );
      }

      if (product.stock < quantity) {
        return ResponseHandler.error(
          res,
          400,
          getMessage("INSUFFICIENT_STOCK", language)
        );
      }

      // Update quantity and price
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].price = product.price;
    }

    await cart.save();
    await cart.populate("items.product");

    return ResponseHandler.success(
      res,
      200,
      getMessage("CART_UPDATED", language),
      transformCart(cart, language)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from cart
 * DELETE /api/cart/remove/:sessionId/:itemId
 */
export const removeCartItem = async (req, res, next) => {
  try {
    const { sessionId, itemId } = req.params;
    const language = req.language || "en";

    const cart = await Cart.findOne({ sessionId });

    if (!cart) {
      return ResponseHandler.error(res, 404, "Cart not found");
    }

    // Remove item
    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

    await cart.save();
    await cart.populate("items.product");

    return ResponseHandler.success(
      res,
      200,
      getMessage("ITEM_REMOVED", language),
      transformCart(cart, language)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Clear cart
 * DELETE /api/cart/clear/:sessionId
 */
export const clearCart = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const language = req.language || "en";

    const cart = await Cart.findOneAndDelete({ sessionId });

    // Even if cart not found, we consider it "cleared"
    return ResponseHandler.success(
      res,
      200,
      getMessage("CART_CLEARED", language),
      { message: "Cart cleared successfully" }
    );
  } catch (error) {
    next(error);
  }
};
