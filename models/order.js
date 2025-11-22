import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    en: String,
    no: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  sku: String
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    customer: {
      name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
      },
      email: {
        type: String,
        required: [true, 'Customer email is required'],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
      },
      phone: {
        type: String,
        required: [true, 'Customer phone is required'],
        trim: true
      }
    },
    shippingAddress: {
      street: {
        type: String,
        required: [true, 'Street address is required'],
        trim: true
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
      },
      postalCode: {
        type: String,
        required: [true, 'Postal code is required'],
        trim: true
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
        default: 'Norway',
        trim: true
      }
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'vipps', 'klarna'],
      default: 'stripe'
    },
    paymentIntentId: {
      type: String
    },
    language: {
      type: String,
      enum: ['en', 'no'],
      default: 'en'
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Generate order ID before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    const date = new Date();
    const year = date.getFullYear();
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `ALX-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;