import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Admin from '../models/admin.js';
import Category from '../models/category.js';
import Product from '../models/product.js';

dotenv.config();

const clearDatabase = async () => {
  try {
    console.log('='.repeat(50));
    console.log('Clearing Database...');
    console.log('='.repeat(50));

    // Connect to database
    await connectDB();
    console.log('');

    // Delete all data
    await Admin.deleteMany({});
    console.log('Admins cleared');

    await Product.deleteMany({});
    console.log('Products cleared');

    await Category.deleteMany({});
    console.log('Categories cleared');

    console.log('');
    console.log('='.repeat(50));
    console.log('Database Cleared Successfully!');
    console.log('='.repeat(50));
    
    process.exit(0);
    
  } catch (error) {
    console.error('Clear database failed:', error.message);
    process.exit(1);
  }
};

clearDatabase();