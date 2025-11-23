import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
  
});
console.log("🔥 Stripe key loaded:", process.env.STRIPE_SECRET_KEY ? "YES" : "NO");

export default stripe;