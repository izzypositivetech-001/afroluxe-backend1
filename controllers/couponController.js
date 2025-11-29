import Coupon from "../models/coupon.js";
import ResponseHandler from "../utils/responseHandler.js";
import { getMessage } from "../utils/translations.js";

/**
 * Create new coupon (Admin)
 * POST /api/coupons
 */
export const createCoupon = async (req, res, next) => {
  try {
    const language = req.language || "en";
    const {
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      startDate,
      expiryDate,
      usageLimit,
    } = req.body;

    // Check if coupon exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return ResponseHandler.error(
        res,
        400,
        language === "en"
          ? "Coupon code already exists"
          : "Kupongkode finnes allerede"
      );
    }

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      startDate,
      expiryDate,
      usageLimit,
    });

    return ResponseHandler.success(
      res,
      201,
      language === "en" ? "Coupon created successfully" : "Kupong opprettet",
      coupon
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all coupons (Admin)
 * GET /api/coupons
 */
export const getAllCoupons = async (req, res, next) => {
  try {
    const language = req.language || "en";

    const coupons = await Coupon.find().sort("-createdAt");

    return ResponseHandler.success(
      res,
      200,
      getMessage("SUCCESS", language),
      coupons
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Validate and Apply Coupon (User)
 * POST /api/coupons/validate
 */
export const validateCoupon = async (req, res, next) => {
  try {
    const language = req.language || "en";
    const { code, cartTotal } = req.body;

    if (!code) {
      return ResponseHandler.error(
        res,
        400,
        language === "en"
          ? "Please provide a coupon code"
          : "Vennligst oppgi en kupongkode"
      );
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Invalid coupon code" : "Ugyldig kupongkode"
      );
    }

    // Check expiration
    const now = new Date();
    if (now < new Date(coupon.startDate) || now > new Date(coupon.expiryDate)) {
      return ResponseHandler.error(
        res,
        400,
        language === "en" ? "Coupon is expired" : "Kupongen er utløpt"
      );
    }

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return ResponseHandler.error(
        res,
        400,
        language === "en"
          ? "Coupon usage limit reached"
          : "Kupongens bruksgrense er nådd"
      );
    }

    // Check minimum purchase
    if (cartTotal < coupon.minPurchase) {
      return ResponseHandler.error(
        res,
        400,
        language === "en"
          ? `Minimum purchase of ${coupon.minPurchase} required`
          : `Minimumskjøp på ${coupon.minPurchase} kreves`
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed total
    discountAmount = Math.min(discountAmount, cartTotal);

    return ResponseHandler.success(
      res,
      200,
      language === "en" ? "Coupon applied successfully" : "Kupong lagt til",
      {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        newTotal: cartTotal - discountAmount,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Coupon (Admin)
 * DELETE /api/coupons/:id
 */
export const deleteCoupon = async (req, res, next) => {
  try {
    const language = req.language || "en";
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Coupon not found" : "Kupong ikke funnet"
      );
    }

    return ResponseHandler.success(
      res,
      200,
      language === "en" ? "Coupon deleted successfully" : "Kupong slettet"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update Coupon Status (Admin)
 * PATCH /api/coupons/:id/status
 */
export const updateCouponStatus = async (req, res, next) => {
  try {
    const language = req.language || "en";
    const { id } = req.params;
    const { isActive } = req.body;

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!coupon) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Coupon not found" : "Kupong ikke funnet"
      );
    }

    return ResponseHandler.success(
      res,
      200,
      language === "en" ? "Coupon status updated" : "Kupongstatus oppdatert",
      coupon
    );
  } catch (error) {
    next(error);
  }
};
