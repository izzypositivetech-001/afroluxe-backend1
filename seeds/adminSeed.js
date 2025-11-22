import Admin from '../models/admin.js';

const adminData = {
  name: 'AfroLuxe Admin',
  email: process.env.ADMIN_EMAIL || 'admin@afroluxe.no',
  password: process.env.ADMIN_PASSWORD || 'Admin@123',
  role: 'super_admin',
  isActive: true
};

const seedAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('Admin already exists, skipping...');
      return;
    }

    // Create admin
    await Admin.create(adminData);
    console.log('Admin user seeded successfully');
    console.log(`Email: ${adminData.email}`);
    console.log(`Password: ${adminData.password}`);
    
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    throw error;
  }
};

export default seedAdmin;