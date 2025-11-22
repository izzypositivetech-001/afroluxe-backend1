import Category from '../models/category.js';

const categories = [
  {
    name: {
      en: 'Straight Hair',
      no: 'Rett Hår'
    },
    description: {
      en: 'Smooth and silky straight hair extensions',
      no: 'Glatt og silkemyk rett hårforlengelse'
    }
  },
  {
    name: {
      en: 'Curly Hair',
      no: 'Krøllete Hår'
    },
    description: {
      en: 'Beautiful curly and bouncy hair extensions',
      no: 'Vakker krøllete og sprettende hårforlengelse'
    }
  },
  {
    name: {
      en: 'Wavy Hair',
      no: 'Bølget Hår'
    },
    description: {
      en: 'Natural wavy texture hair extensions',
      no: 'Naturlig bølget tekstur hårforlengelse'
    }
  },
  {
    name: {
      en: 'Wigs',
      no: 'Parykker'
    },
    description: {
      en: 'Premium quality wigs in various styles',
      no: 'Premium kvalitet parykker i ulike stiler'
    }
  },
  {
    name: {
      en: 'Closures & Frontals',
      no: 'Lukking & Frontals'
    },
    description: {
      en: 'Lace closures and frontals for natural look',
      no: 'Blonde lukking og frontals for naturlig utseende'
    }
  },
  {
    name: {
      en: 'Bundles',
      no: 'Bunter'
    },
    description: {
      en: 'Hair bundles in various lengths',
      no: 'Hårbunter i ulike lengder'
    }
  },
  {
    name: {
      en: 'Accessories',
      no: 'Tilbehør'
    },
    description: {
      en: 'Hair care and styling accessories',
      no: 'Hårpleie og stylingtilbehør'
    }
  }
];

const seedCategories = async () => {
  try {
    // Check if categories already exist
    const existingCategories = await Category.countDocuments();
    
    if (existingCategories > 0) {
      console.log('Categories already exist, skipping...');
      return;
    }

    // Create categories
    await Category.insertMany(categories);
    console.log(`${categories.length} categories seeded successfully`);
    
  } catch (error) {
    console.error('Error seeding categories:', error.message);
    throw error;
  }
};

export default seedCategories;