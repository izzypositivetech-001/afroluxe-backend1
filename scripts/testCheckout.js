import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });
import mongoose from 'mongoose';
import Order from '../models/order.js';
import Cart from '../models/cart.js';
import Product from '../models/product.js';
import Counter from '../models/counter.js';
import { createOrder } from '../controllers/orderController.js';
import connectDB from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// Mock Express objects
const req = {
  body: {},
  language: 'en'
};
const res = {
  status: (code) => ({
    json: (data) => {
      console.log(`Response Status: ${code}`);
      console.log('Response Data:', JSON.stringify(data, null, 2));
      return data;
    }
  })
};
const next = (err) => {
  console.error('Next called with error:', err);
};

const runTest = async () => {
  try {
    await connectDB();
    console.log('Connected to DB');

    // 1. Create a product
    const product = await Product.create({
      name: { en: 'Test Product', no: 'Test Produkt' },
      description: { en: 'Test Desc', no: 'Test Besk' },
      price: 100,
      category: new mongoose.Types.ObjectId(), // Dummy ID
      images: [],
      stock: 10,
      sku: 'TEST-SKU-' + Date.now(),
      isActive: true
    });
    console.log('Product created:', product._id);

    // 2. Create a cart
    const sessionId = uuidv4();
    const cart = await Cart.create({
      sessionId,
      items: [{
        product: product._id,
        quantity: 1,
        price: 100
      }],
      totalAmount: 100
    });
    console.log('Cart created:', cart.sessionId);

    // 3. Prepare checkout data
    req.body = {
      sessionId,
      customer: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '12345678'
      },
      shippingAddress: {
        street: 'Test Street 1',
        city: 'Oslo',
        postalCode: '0123',
        country: 'Norway'
      }
    };

    // 4. Call createOrder
    console.log('Calling createOrder...');
    await createOrder(req, res, next);

    // Cleanup
    await Product.findByIdAndDelete(product._id);
    await Order.findOneAndDelete({ 'customer.email': 'test@example.com' });
    await Cart.findOneAndDelete({ sessionId });
    
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

runTest();
