import Admin from '../models/Admin.js';
import ResponseHandler from '../utils/responseHandler.js';
import { getMessage } from '../utils/translations.js';

/**
 * Get all admins (Super Admin only)
 * GET /api/admin/users
 */
export const getAllAdmins = async (req, res, next) => {
  try {
    const language = req.language || 'en';

    const admins = await Admin.find().select('-password').sort('-createdAt');

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      admins
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Get single admin by ID
 * GET /api/admin/users/:id
 */
export const getAdminById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const language = req.language || 'en';

    const admin = await Admin.findById(id).select('-password');

    if (!admin) {
      return ResponseHandler.error(
        res,
        404,
        language === 'en' ? 'Admin not found' : 'Admin ikke funnet'
      );
    }

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      admin
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Update admin
 * PUT /api/admin/users/:id
 */
export const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;
    const language = req.language || 'en';

    // Find admin
    let admin = await Admin.findById(id);

    if (!admin) {
      return ResponseHandler.error(
        res,
        404,
        language === 'en' ? 'Admin not found' : 'Admin ikke funnet'
      );
    }

    // Check if updating email to existing one
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return ResponseHandler.error(
          res,
          400,
          language === 'en' ? 'Email already in use' : 'E-post allerede i bruk'
        );
      }
    }

    // Update fields
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (role) admin.role = role;
    if (isActive !== undefined) admin.isActive = isActive;

    await admin.save();

    // Remove password from response
    admin = await Admin.findById(id).select('-password');

    return ResponseHandler.success(
      res,
      200,
      getMessage('UPDATED', language),
      admin
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Delete admin
 * DELETE /api/admin/users/:id
 */
export const deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const language = req.language || 'en';

    // Prevent deleting self
    if (id === req.admin.id) {
      return ResponseHandler.error(
        res,
        400,
        language === 'en' 
          ? 'Cannot delete your own account' 
          : 'Kan ikke slette din egen konto'
      );
    }

    const admin = await Admin.findById(id);

    if (!admin) {
      return ResponseHandler.error(
        res,
        404,
        language === 'en' ? 'Admin not found' : 'Admin ikke funnet'
      );
    }

    await admin.deleteOne();

    return ResponseHandler.success(
      res,
      200,
      getMessage('DELETED', language),
      { id }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate admin (soft delete)
 * PATCH /api/admin/users/:id/deactivate
 */
export const deactivateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const language = req.language || 'en';

    // Prevent deactivating self
    if (id === req.admin.id) {
      return ResponseHandler.error(
        res,
        400,
        language === 'en' 
          ? 'Cannot deactivate your own account' 
          : 'Kan ikke deaktivere din egen konto'
      );
    }

    const admin = await Admin.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return ResponseHandler.error(
        res,
        404,
        language === 'en' ? 'Admin not found' : 'Admin ikke funnet'
      );
    }

    return ResponseHandler.success(
      res,
      200,
      language === 'en' ? 'Admin deactivated' : 'Admin deaktivert',
      admin
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Activate admin
 * PATCH /api/admin/users/:id/activate
 */
export const activateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const language = req.language || 'en';

    const admin = await Admin.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return ResponseHandler.error(
        res,
        404,
        language === 'en' ? 'Admin not found' : 'Admin ikke funnet'
      );
    }

    return ResponseHandler.success(
      res,
      200,
      language === 'en' ? 'Admin activated' : 'Admin aktivert',
      admin
    );

  } catch (error) {
    next(error);
  }
};