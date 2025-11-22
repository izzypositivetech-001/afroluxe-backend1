import Product from '../models/product.js';
import Category from '../models/category.js';

const getProducts = async () => {
  // Get category IDs
  const straightHair = await Category.findOne({ 'name.en': 'Straight Hair' });
  const curlyHair = await Category.findOne({ 'name.en': 'Curly Hair' });
  const wavyHair = await Category.findOne({ 'name.en': 'Wavy Hair' });
  const wigs = await Category.findOne({ 'name.en': 'Wigs' });
  const closures = await Category.findOne({ 'name.en': 'Closures & Frontals' });
  const bundles = await Category.findOne({ 'name.en': 'Bundles' });
  const accessories = await Category.findOne({ 'name.en': 'Accessories' });

  return [
    // Straight Hair Products
    {
      name: {
        en: 'Brazilian Straight Hair 20"',
        no: 'Brasiliansk Rett Hår 20"'
      },
      description: {
        en: 'Premium quality Brazilian straight hair, 20 inches. Soft, silky texture that can be dyed and styled. Perfect for a sleek, elegant look.',
        no: 'Premium kvalitet brasiliansk rett hår, 20 tommer. Myk, silkemyk tekstur som kan farges og styles. Perfekt for et elegant utseende.'
      },
      category: straightHair._id,
      price: 1299,
      stock: 45,
      images: ['https://via.placeholder.com/800x800?text=Brazilian+Straight+20'],
      weight: 100
    },
    {
      name: {
        en: 'Indian Straight Hair 22"',
        no: 'Indisk Rett Hår 22"'
      },
      description: {
        en: 'Natural Indian straight hair, 22 inches. Thick and lustrous with minimal shedding. Ideal for voluminous styles.',
        no: 'Naturlig indisk rett hår, 22 tommer. Tykt og glansfull med minimal felling. Ideelt for voluminøse stiler.'
      },
      category: straightHair._id,
      price: 1499,
      stock: 38,
      images: ['https://via.placeholder.com/800x800?text=Indian+Straight+22'],
      weight: 110
    },
    {
      name: {
        en: 'Peruvian Straight Hair 18"',
        no: 'Peruansk Rett Hår 18"'
      },
      description: {
        en: 'Luxurious Peruvian straight hair, 18 inches. Lightweight and easy to maintain. Great for everyday wear.',
        no: 'Luksuriøs peruansk rett hår, 18 tommer. Lett og enkelt å vedlikeholde. Flott for daglig bruk.'
      },
      category: straightHair._id,
      price: 1199,
      stock: 52,
      images: ['https://via.placeholder.com/800x800?text=Peruvian+Straight+18'],
      weight: 95
    },

    // Curly Hair Products
    {
      name: {
        en: 'Brazilian Curly Hair 20"',
        no: 'Brasiliansk Krøllete Hår 20"'
      },
      description: {
        en: 'Beautiful Brazilian curly hair, 20 inches. Bouncy curls that hold well. Perfect for a natural, voluminous look.',
        no: 'Vakker brasiliansk krøllete hår, 20 tommer. Sprettende krøller som holder godt. Perfekt for et naturlig, voluminøst utseende.'
      },
      category: curlyHair._id,
      price: 1399,
      stock: 35,
      images: ['https://via.placeholder.com/800x800?text=Brazilian+Curly+20'],
      weight: 105
    },
    {
      name: {
        en: 'Malaysian Curly Hair 18"',
        no: 'Malaysisk Krøllete Hår 18"'
      },
      description: {
        en: 'Stunning Malaysian curly hair, 18 inches. Defined curls with natural shine. Low maintenance and long-lasting.',
        no: 'Fantastisk malaysisk krøllete hår, 18 tommer. Definerte krøller med naturlig glans. Lavt vedlikehold og langvarig.'
      },
      category: curlyHair._id,
      price: 1349,
      stock: 41,
      images: ['https://via.placeholder.com/800x800?text=Malaysian+Curly+18'],
      weight: 100
    },
    {
      name: {
        en: 'Peruvian Deep Curly Hair 22"',
        no: 'Peruansk Dyp Krøllete Hår 22"'
      },
      description: {
        en: 'Gorgeous Peruvian deep curly hair, 22 inches. Tight, defined curls. Perfect for dramatic styles.',
        no: 'Nydelig peruansk dyp krøllete hår, 22 tommer. Tette, definerte krøller. Perfekt for dramatiske stiler.'
      },
      category: curlyHair._id,
      price: 1599,
      stock: 28,
      images: ['https://via.placeholder.com/800x800?text=Peruvian+Deep+Curly+22'],
      weight: 115
    },

    // Wavy Hair Products
    {
      name: {
        en: 'Brazilian Body Wave 20"',
        no: 'Brasiliansk Body Wave 20"'
      },
      description: {
        en: 'Premium Brazilian body wave hair, 20 inches. Soft waves with natural movement. Versatile and elegant.',
        no: 'Premium brasiliansk body wave hår, 20 tommer. Myke bølger med naturlig bevegelse. Allsidig og elegant.'
      },
      category: wavyHair._id,
      price: 1399,
      stock: 48,
      images: ['https://via.placeholder.com/800x800?text=Brazilian+Body+Wave+20'],
      weight: 105
    },
    {
      name: {
        en: 'Indian Water Wave 18"',
        no: 'Indisk Water Wave 18"'
      },
      description: {
        en: 'Beautiful Indian water wave hair, 18 inches. Natural wave pattern with great texture. Easy to style.',
        no: 'Vakker indisk water wave hår, 18 tommer. Naturlig bølgemønster med flott tekstur. Lett å style.'
      },
      category: wavyHair._id,
      price: 1299,
      stock: 43,
      images: ['https://via.placeholder.com/800x800?text=Indian+Water+Wave+18'],
      weight: 98
    },
    {
      name: {
        en: 'Peruvian Loose Wave 22"',
        no: 'Peruansk Løs Bølge 22"'
      },
      description: {
        en: 'Luxurious Peruvian loose wave hair, 22 inches. Gentle waves for a romantic look. Soft and manageable.',
        no: 'Luksuriøs peruansk løs bølge hår, 22 tommer. Milde bølger for et romantisk utseende. Mykt og håndterbart.'
      },
      category: wavyHair._id,
      price: 1549,
      stock: 36,
      images: ['https://via.placeholder.com/800x800?text=Peruvian+Loose+Wave+22'],
      weight: 112
    },

    // Wigs
    {
      name: {
        en: 'Full Lace Wig Straight 18"',
        no: 'Full Blonde Parykk Rett 18"'
      },
      description: {
        en: 'Premium full lace wig with straight hair, 18 inches. Natural hairline and versatile styling. Pre-plucked and bleached knots.',
        no: 'Premium full blonde parykk med rett hår, 18 tommer. Naturlig hårgrense og allsidig styling. Forhåndsplukket og bleket knuter.'
      },
      category: wigs._id,
      price: 2499,
      stock: 15,
      images: ['https://via.placeholder.com/800x800?text=Full+Lace+Wig+Straight'],
      weight: 150
    },
    {
      name: {
        en: 'Lace Front Wig Curly 20"',
        no: 'Blonde Front Parykk Krøllete 20"'
      },
      description: {
        en: 'Beautiful lace front wig with curly hair, 20 inches. Natural-looking hairline. Ready to wear.',
        no: 'Vakker blonde front parykk med krøllete hår, 20 tommer. Naturlig utseende hårgrense. Klar til bruk.'
      },
      category: wigs._id,
      price: 2299,
      stock: 18,
      images: ['https://via.placeholder.com/800x800?text=Lace+Front+Wig+Curly'],
      weight: 145
    },
    {
      name: {
        en: 'Bob Wig Straight 12"',
        no: 'Bob Parykk Rett 12"'
      },
      description: {
        en: 'Chic bob style lace front wig, 12 inches. Perfect for a modern, sophisticated look. Pre-styled and ready to wear.',
        no: 'Elegant bob stil blonde front parykk, 12 tommer. Perfekt for et moderne, sofistikert utseende. Forhåndsstylet og klar til bruk.'
      },
      category: wigs._id,
      price: 1999,
      stock: 22,
      images: ['https://via.placeholder.com/800x800?text=Bob+Wig+Straight'],
      weight: 120
    },

    // Closures & Frontals
    {
      name: {
        en: '4x4 Lace Closure Straight',
        no: '4x4 Blonde Lukking Rett'
      },
      description: {
        en: '4x4 lace closure with straight hair. Natural parting and seamless blend. Can be dyed and styled.',
        no: '4x4 blonde lukking med rett hår. Naturlig skilning og sømløs blanding. Kan farges og styles.'
      },
      category: closures._id,
      price: 599,
      stock: 65,
      images: ['https://via.placeholder.com/800x800?text=4x4+Closure+Straight'],
      weight: 45
    },
    {
      name: {
        en: '13x4 Lace Frontal Curly',
        no: '13x4 Blonde Frontal Krøllete'
      },
      description: {
        en: '13x4 lace frontal with curly hair. Ear to ear coverage. Natural hairline for versatile styling.',
        no: '13x4 blonde frontal med krøllete hår. Øre til øre dekning. Naturlig hårgrense for allsidig styling.'
      },
      category: closures._id,
      price: 899,
      stock: 42,
      images: ['https://via.placeholder.com/800x800?text=13x4+Frontal+Curly'],
      weight: 65
    },
    {
      name: {
        en: '5x5 Lace Closure Body Wave',
        no: '5x5 Blonde Lukking Body Wave'
      },
      description: {
        en: '5x5 lace closure with body wave texture. Larger parting space. Pre-plucked and bleached knots.',
        no: '5x5 blonde lukking med body wave tekstur. Større skillingsplass. Forhåndsplukket og bleket knuter.'
      },
      category: closures._id,
      price: 699,
      stock: 58,
      images: ['https://via.placeholder.com/800x800?text=5x5+Closure+Body+Wave'],
      weight: 50
    },

    // Bundles
    {
      name: {
        en: '3 Bundle Deal Straight 18-20-22"',
        no: '3 Bunt Tilbud Rett 18-20-22"'
      },
      description: {
        en: 'Value bundle deal with 3 straight hair bundles. Mixed lengths 18", 20", and 22". Perfect for full install.',
        no: 'Verdi bunt tilbud med 3 rett hår bunter. Blandede lengder 18", 20" og 22". Perfekt for full installasjon.'
      },
      category: bundles._id,
      price: 3499,
      stock: 25,
      images: ['https://via.placeholder.com/800x800?text=3+Bundle+Deal+Straight'],
      weight: 300
    },
    {
      name: {
        en: '4 Bundle Deal Curly 18-20-22-24"',
        no: '4 Bunt Tilbud Krøllete 18-20-22-24"'
      },
      description: {
        en: 'Premium bundle deal with 4 curly hair bundles. Mixed lengths for maximum volume. Best value for full sew-in.',
        no: 'Premium bunt tilbud med 4 krøllete hår bunter. Blandede lengder for maksimalt volum. Best verdi for full sew-in.'
      },
      category: bundles._id,
      price: 4599,
      stock: 18,
      images: ['https://via.placeholder.com/800x800?text=4+Bundle+Deal+Curly'],
      weight: 400
    },

    // Accessories
    {
      name: {
        en: 'Wig Cap Set (3 pack)',
        no: 'Parykk Cap Sett (3 pakke)'
      },
      description: {
        en: 'Pack of 3 wig caps in neutral color. Breathable and comfortable. Essential for wig wearing.',
        no: 'Pakke med 3 parykk caps i nøytral farge. Pustende og komfortabel. Nødvendig for parykk bruk.'
      },
      category: accessories._id,
      price: 99,
      stock: 150,
      images: ['https://via.placeholder.com/800x800?text=Wig+Cap+Set'],
      weight: 15
    },
    {
      name: {
        en: 'Edge Control Gel',
        no: 'Edge Control Gel'
      },
      description: {
        en: 'Strong hold edge control gel. Tames baby hairs and flyaways. Non-flaky formula.',
        no: 'Sterkt hold edge control gel. Temmer babyhår og flyaways. Ikke-flassende formel.'
      },
      category: accessories._id,
      price: 149,
      stock: 120,
      images: ['https://via.placeholder.com/800x800?text=Edge+Control+Gel'],
      weight: 100
    },
    {
      name: {
        en: 'Wide Tooth Comb',
        no: 'Bred Tann Kam'
      },
      description: {
        en: 'Professional wide tooth comb. Gentle on extensions. Reduces breakage and tangling.',
        no: 'Profesjonell bred tann kam. Skånsom mot extensions. Reduserer hårbrudd og floker.'
      },
      category: accessories._id,
      price: 79,
      stock: 200,
      images: ['https://via.placeholder.com/800x800?text=Wide+Tooth+Comb'],
      weight: 30
    }
  ];
};

const seedProducts = async () => {
  try {
    console.log("Clearing existing products...");
    await Product.deleteMany({});

    console.log("Generating products...");
    const products = await getProducts();

    console.log("Inserting products...");
    await Product.insertMany(products);

    console.log(`${products.length} products seeded successfully`);
    
  } catch (error) {
    console.error('Error seeding products:', error.message);
    throw error;
  }
};

export default seedProducts;