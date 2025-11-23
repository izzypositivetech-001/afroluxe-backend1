import axios from 'axios';
import Stripe from 'stripe';
import 'dotenv/config';

const BASE_URL = 'http://localhost:5000/api';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Test Data
const adminCredentials = {
  email: 'admin@afroluxe.no',
  password: 'Admin@123'
};

let state = {
  authToken: '',
  productId: '',
  sessionId: '',
  paymentIntentId: '',
  clientSecret: '',
  orderId: '',
  refundId: ''
};

const logStep = (step, message) => {
  console.log(`\n[STEP ${step}] ${message}`);
};

const logSuccess = (message) => {
  console.log(`✅ ${message}`);
};

const logError = (message, error) => {
  console.error(`❌ ${message}`);
  if (error.response) {
    console.error('   Status:', error.response.status);
    console.error('   Data:', JSON.stringify(error.response.data, null, 2));
  } else {
    console.error('   Error:', error.message);
  }
  process.exit(1);
};

const runTests = async () => {
  console.log('🚀 Starting Automated Payment Flow Test...\n');

  try {
    // 1. Login as Admin
    logStep(1, 'Logging in as Admin...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, adminCredentials);
    state.authToken = loginRes.data.data.token;
    logSuccess('Admin logged in successfully');

    // 2. Get Products
    logStep(2, 'Fetching Products...');
    const productsRes = await axios.get(`${BASE_URL}/products`);
    if (productsRes.data.data.length === 0) throw new Error('No products found');
    state.productId = productsRes.data.data[0]._id;
    logSuccess(`Product found: ${state.productId}`);

    // 3. Add to Cart
    logStep(3, 'Adding item to Cart...');
    const cartRes = await axios.post(`${BASE_URL}/cart/add`, {
      productId: state.productId,
      quantity: 2
    });
    state.sessionId = cartRes.data.data.sessionId;
    logSuccess(`Cart created with Session ID: ${state.sessionId}`);

    // 4. Verify Cart
    logStep(4, 'Verifying Cart...');
    const verifyCartRes = await axios.get(`${BASE_URL}/cart/${state.sessionId}`);
    if (verifyCartRes.data.data.items.length === 0) throw new Error('Cart is empty');
    logSuccess(`Cart verified. Total: ${verifyCartRes.data.data.totalAmount} NOK`);

    // 5. Create Payment Intent
    logStep(5, 'Creating Payment Intent...');
    const intentRes = await axios.post(`${BASE_URL}/payments/create-intent`, {
      sessionId: state.sessionId
    });
    state.paymentIntentId = intentRes.data.data.paymentIntentId;
    state.clientSecret = intentRes.data.data.clientSecret;
    logSuccess(`Payment Intent created: ${state.paymentIntentId}`);

    // 6. Verify Initial Status
    logStep(6, 'Verifying Initial Payment Status...');
    const statusRes = await axios.get(`${BASE_URL}/payments/status/${state.paymentIntentId}`);
    if (statusRes.data.data.status !== 'requires_payment_method') {
      throw new Error(`Unexpected status: ${statusRes.data.data.status}`);
    }
    logSuccess('Status is "requires_payment_method"');

    // 7. AUTOMATED PAYMENT (The Magic Step)
    logStep(7, '🤖 Automating Payment Confirmation (Stripe SDK)...');
    await stripe.paymentIntents.confirm(state.paymentIntentId, {
      payment_method: 'pm_card_visa', // Test card
      return_url: 'http://localhost:3000/checkout/success'
    });
    logSuccess('Payment confirmed via Stripe SDK');

    // 8. Confirm Payment & Create Order
    logStep(8, 'Confirming Order in Backend...');
    const confirmRes = await axios.post(`${BASE_URL}/payments/confirm`, {
      paymentIntentId: state.paymentIntentId,
      sessionId: state.sessionId,
      customer: {
        name: 'Test Bot',
        email: 'bot@test.com',
        phone: '+4799999999'
      },
      shippingAddress: {
        street: 'Robot Lane 1',
        city: 'Oslo',
        postalCode: '0123',
        country: 'Norway'
      },
      notes: 'Automated Test Order'
    });
    state.orderId = confirmRes.data.data.orderId;
    logSuccess(`Order created successfully! Order ID: ${state.orderId}`);

    // 9. Verify Cart Cleared
    logStep(9, 'Verifying Cart is Cleared...');
    try {
      await axios.get(`${BASE_URL}/cart/${state.sessionId}`);
      throw new Error('Cart should be gone (404 expected)');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logSuccess('Cart successfully cleared (404 Not Found)');
      } else {
        throw error;
      }
    }

    // 10. Refund Order (Admin Action)
    logStep(10, 'Refunding Order (Admin Action)...');
    const refundRes = await axios.post(
      `${BASE_URL}/payments/refund`,
      {
        paymentIntentId: state.paymentIntentId,
        reason: 'requested_by_customer'
      },
      {
        headers: { Authorization: `Bearer ${state.authToken}` }
      }
    );
    state.refundId = refundRes.data.data.refundId;
    logSuccess(`Refund processed: ${state.refundId}`);

    console.log('\n✨ ALL TESTS PASSED SUCCESSFULLY! ✨');

  } catch (error) {
    logError('Test Failed', error);
  }
};

runTests();
