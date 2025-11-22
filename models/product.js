import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      en: {
        type: String,
        required: [true, 'English name is required'],
        trim: true
      },
      no: {
        type: String,
        required: [true, 'Norwegian name is required'],
        trim: true
      }
    },
    description: {
      en: {
        type: String,
        required: [true, 'English description is required']
      },
      no: {
        type: String,
        required: [true, 'Norwegian description is required']
      }
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    images: [
      {
        type: String
      }
    ],
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    sku: {
      type: String,
      unique: false,
      uppercase: true
    },
    weight: {
      type: Number,
      min: 0
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    isActive: {
      type: Boolean,
      default: true
    },
    salesCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Generate SKU if not provided
productSchema.pre('save', function (next) {
  if (!this.sku) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.sku = `ALX-${randomNum}`;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;