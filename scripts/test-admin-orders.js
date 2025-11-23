import axios from 'axios';
import 'dotenv/config';

const BASE_URL = 'http://localhost:5000/api';

// Test Data
const adminCredentials = {
  email: 'admin@afroluxe.no',
  password: 'Admin@123'
};

let state = {
  authToken: '',
  productId: '',
  sessionId: '',
  orderId: '' // The ID of the order we create for testing
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
  console.log('🚀 Starting Admin Order Management Tests...\n');

  try {
    // ==========================================
    // 1. SETUP
    // ==========================================
    
    // 1. Login as Admin
    logStep(1, 'Logging in as Admin...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, adminCredentials);
    state.authToken = loginRes.data.data.token;
    logSuccess('Admin logged in successfully');

    // 2. Get Products (to create an order)
    logStep(2, 'Fetching Products...');
    const productsRes = await axios.get(`${BASE_URL}/products`);
    if (productsRes.data.data.length === 0) throw new Error('No products found');
    state.productId = productsRes.data.data[0]._id;
    logSuccess(`Product found: ${state.productId}`);

    // 3. Create Test Order (Public Checkout)
    logStep(3, 'Creating Test Order...');
    // First add to cart
    const cartRes = await axios.post(`${BASE_URL}/cart/add`, {
      productId: state.productId,
      quantity: 1
    });
    state.sessionId = cartRes.data.data.sessionId;
    
    // Then checkout
    const checkoutRes = await axios.post(`${BASE_URL}/checkout`, {
      sessionId: state.sessionId,
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+4712345678'
      },
      shippingAddress: {
        street: 'Test Street 123',
        city: 'Oslo',
        postalCode: '0123',
        country: 'Norway'
      },
      notes: 'Test order for Batch 8'
    });
    state.orderId = checkoutRes.data.data.orderId;
    logSuccess(`Test Order Created: ${state.orderId}`);


    // ==========================================
    // 2. ORDER LISTING & FILTERING
    // ==========================================

    const authHeader = { headers: { Authorization: `Bearer ${state.authToken}` } };

    // 4. Get All Orders
    logStep(4, 'Getting All Orders...');
    const allOrdersRes = await axios.get(`${BASE_URL}/admin/orders`, authHeader);
    if (!Array.isArray(allOrdersRes.data.data.orders)) throw new Error('Orders is not an array');
    logSuccess(`Retrieved ${allOrdersRes.data.data.orders.length} orders`);

    // 5. Pagination
    logStep(5, 'Testing Pagination...');
    const pageRes = await axios.get(`${BASE_URL}/admin/orders?page=1&limit=5`, authHeader);
    if (pageRes.data.data.pagination.ordersPerPage !== 5) throw new Error('Pagination limit failed');
    logSuccess('Pagination working');

    // 6. Filter by Status
    logStep(6, 'Filtering by Status (pending)...');
    const statusFilterRes = await axios.get(`${BASE_URL}/admin/orders?orderStatus=pending`, authHeader);
    const allPending = statusFilterRes.data.data.orders.every(o => o.orderStatus === 'pending');
    if (!allPending) throw new Error('Status filter failed');
    logSuccess('Status filter working');

    // 7. Filter by Payment Status
    logStep(7, 'Filtering by Payment Status (pending)...');
    const paymentFilterRes = await axios.get(`${BASE_URL}/admin/orders?paymentStatus=pending`, authHeader);
    const allUnpaid = paymentFilterRes.data.data.orders.every(o => o.paymentStatus === 'pending');
    if (!allUnpaid) throw new Error('Payment status filter failed');
    logSuccess('Payment status filter working');

    // 8. Search
    logStep(8, 'Searching Orders (ALX)...');
    const searchRes = await axios.get(`${BASE_URL}/admin/orders?search=ALX`, authHeader);
    if (searchRes.data.data.orders.length === 0) throw new Error('Search returned no results');
    logSuccess('Search working');

    // 9. Date Range
    logStep(9, 'Filtering by Date Range...');
    const dateRes = await axios.get(`${BASE_URL}/admin/orders?startDate=2024-01-01&endDate=2025-12-31`, authHeader);
    if (dateRes.data.data.orders.length === 0) throw new Error('Date filter returned no results');
    logSuccess('Date filter working');

    // 10. Sorting
    logStep(10, 'Testing Sorting...');
    await axios.get(`${BASE_URL}/admin/orders?sortBy=total&sortOrder=desc`, authHeader);
    logSuccess('Sorting working');


    // ==========================================
    // 3. ORDER MANAGEMENT
    // ==========================================

    // 13. Get Single Order
    logStep(13, 'Getting Single Order...');
    const singleOrderRes = await axios.get(`${BASE_URL}/admin/orders/${state.orderId}`, authHeader);
    if (singleOrderRes.data.data.orderId !== state.orderId) throw new Error('Order ID mismatch');
    logSuccess('Single order retrieval working');

    // 14. Update Status -> Processing
    logStep(14, 'Updating Status to Processing...');
    await axios.patch(`${BASE_URL}/admin/orders/${state.orderId}/status`, { orderStatus: 'processing' }, authHeader);
    logSuccess('Status updated to processing');

    // 15. Add Shipping Info
    logStep(15, 'Adding Shipping Info...');
    await axios.patch(`${BASE_URL}/admin/orders/${state.orderId}/shipping`, {
      trackingNumber: '1Z999AA10123456784',
      carrier: 'Posten Norge',
      estimatedDelivery: '2024-12-25'
    }, authHeader);
    logSuccess('Shipping info added');

    // 16. Verify Status -> Shipped (Auto-update)
    logStep(16, 'Verifying Auto-Status Update (Shipped)...');
    const shippedOrderRes = await axios.get(`${BASE_URL}/admin/orders/${state.orderId}`, authHeader);
    if (shippedOrderRes.data.data.orderStatus !== 'shipped') throw new Error('Order should be auto-updated to shipped');
    logSuccess('Order auto-updated to shipped');

    // 17. Update Status -> Delivered
    logStep(17, 'Updating Status to Delivered...');
    await axios.patch(`${BASE_URL}/admin/orders/${state.orderId}/status`, { orderStatus: 'delivered' }, authHeader);
    logSuccess('Status updated to delivered');


    // ==========================================
    // 4. STATISTICS & EXPORT
    // ==========================================

    // 19. Get Stats
    logStep(19, 'Fetching Statistics...');
    const statsRes = await axios.get(`${BASE_URL}/admin/orders/stats`, authHeader);
    if (!statsRes.data.data.overview) throw new Error('Invalid stats structure');
    logSuccess('Statistics retrieved');

    // 20. Export CSV
    logStep(20, 'Exporting CSV...');
    const csvRes = await axios.get(`${BASE_URL}/admin/orders/export`, authHeader);
    if (!csvRes.data.includes('Order ID,Customer Name')) throw new Error('Invalid CSV format');
    logSuccess('CSV export working');


    // ==========================================
    // 5. VALIDATION (Negative Tests)
    // ==========================================

    logStep(22, 'Testing Invalid Status...');
    try {
      await axios.patch(`${BASE_URL}/admin/orders/${state.orderId}/status`, { orderStatus: 'invalid' }, authHeader);
      throw new Error('Should have failed');
    } catch (e) {
      if (e.response?.status === 400) logSuccess('Caught invalid status (400)');
      else throw e;
    }

    logStep(24, 'Testing Invalid Date...');
    try {
      await axios.patch(`${BASE_URL}/admin/orders/${state.orderId}/shipping`, { estimatedDelivery: 'not-a-date' }, authHeader);
      throw new Error('Should have failed');
    } catch (e) {
      if (e.response?.status === 400) logSuccess('Caught invalid date (400)');
      else throw e;
    }

    logStep(25, 'Testing Non-existent Order...');
    try {
      await axios.get(`${BASE_URL}/admin/orders/NON-EXISTENT-ID`, authHeader);
      throw new Error('Should have failed');
    } catch (e) {
      if (e.response?.status === 404) logSuccess('Caught non-existent order (404)');
      else throw e;
    }


    // ==========================================
    // 6. AUTHORIZATION
    // ==========================================

    logStep(26, 'Testing Unauthorized Access...');
    try {
      await axios.get(`${BASE_URL}/admin/orders`); // No auth header
      throw new Error('Should have failed');
    } catch (e) {
      if (e.response?.status === 401) logSuccess('Caught unauthorized access (401)');
      else throw e;
    }


    // ==========================================
    // 7. DELETE (Soft Delete)
    // ==========================================

    logStep(28, 'Deleting Order (Soft Delete)...');
    await axios.delete(`${BASE_URL}/admin/orders/${state.orderId}`, authHeader);
    
    // Verify it's cancelled
    const cancelledRes = await axios.get(`${BASE_URL}/admin/orders/${state.orderId}`, authHeader);
    if (cancelledRes.data.data.orderStatus !== 'cancelled') throw new Error('Order was not cancelled');
    logSuccess('Order successfully cancelled (Soft Delete)');


    console.log('\n✨ ALL ADMIN ORDER TESTS PASSED SUCCESSFULLY! ✨');

  } catch (error) {
    logError('Test Failed', error);
  }
};

runTests();
