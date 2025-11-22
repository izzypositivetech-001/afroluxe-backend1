import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
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
        trim: true
      },
      no: {
        type: String,
        trim: true
      }
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Generate slug from English name before saving
categorySchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name.en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);

export default Category;