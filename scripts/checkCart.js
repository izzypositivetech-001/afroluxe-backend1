import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });
import mongoose from 'mongoose';
import Cart from '../models/cart.js';
import Product from '../models/product.js';  // Need to import to avoid populate error
import connectDB from '../config/database.js';

const checkCarts = async () => {
  try {
    await connectDB();
    console.log('Connected to DB\n');

    // First, check carts without populate
    const allCarts = await Cart.find({});
    console.log(`Found ${allCarts.length} cart(s) in database:\n`);
    
    if (allCarts.length === 0) {
      console.log('⚠️ NO CARTS FOUND IN DATABASE!');
      console.log('This means items are NOT being saved when you add to cart.\n');
      console.log('Possible issues:');
      console.log('1. Cart API is failing silently');
      console.log('2. Session ID mismatch between frontend and backend');
      console.log('3. Database connection issue during cart creation');
      process.exit(0);
    }
    
    // Try to populate
    const carts = await Cart.find({}).populate('items.product');
    
    carts.forEach((cart, index) => {
      console.log(`--- Cart ${index + 1} ---`);
      console.log(`Session ID: ${cart.sessionId}`);
      console.log(`Items: ${cart.items.length}`);
      console.log(`Total Amount: ${cart.totalAmount} NOK`);
      console.log(`Created: ${cart.createdAt}`);
      console.log(`Expires: ${cart.expiresAt}`);
      
      if (cart.items.length > 0) {
        console.log('Items in cart:');
        cart.items.forEach((item, i) => {
          const productName = item.product?.name?.en || item.product?.name || 'Unknown Product';
          console.log(`  ${i + 1}. ${productName} x ${item.quantity} @ ${item.price} NOK`);
        });
      }
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

checkCarts();
