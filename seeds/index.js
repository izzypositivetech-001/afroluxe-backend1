import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import seedAdmin from './adminSeed.js';
import seedCategories from './categorySeed.js';
import seedProducts from './productSeed.js';

dotenv.config();

const runSeeds = async () => {
  try {
    console.log('Starting Database Seeding...');
    // Connect to database
    await connectDB();
    console.log('');

    // Seed Admin
    console.log('1. Seeding Admin...');
    await seedAdmin();
    console.log('');

    // Seed Categories
    console.log('2. Seeding Categories...');
    await seedCategories();
    console.log('');

    // Seed Products
    console.log('3. Seeding Products...');
    await seedProducts();
    console.log('');

    console.log('Database Seeding Completed Successfully!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

runSeeds();