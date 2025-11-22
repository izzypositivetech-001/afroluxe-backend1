/**
 * Translations Utility
 * Static translations for API messages
 * Supports: English (en) and Norwegian (no)
 */

const translations = {
  SUCCESS: {
    en: 'Operation successful',
    no: 'Vellykket operasjon'
  },
  CREATED: {
    en: 'Resource created successfully',
    no: 'Ressurs opprettet vellykket'
  },
  UPDATED: {
    en: 'Resource updated successfully',
    no: 'Ressurs oppdatert vellykket'
  },
  DELETED: {
    en: 'Resource deleted successfully',
    no: 'Ressurs slettet vellykket'
  },
  ORDER_CREATED: {
    en: 'Order created successfully',
    no: 'Bestilling opprettet vellykket'
  },
  ORDER_CONFIRMED: {
    en: 'Order confirmed',
    no: 'Bestilling bekreftet'
  },
  ORDER_SHIPPED: {
    en: 'Order has been shipped',
    no: 'Bestilling er sendt'
  },
  ORDER_DELIVERED: {
    en: 'Order delivered successfully',
    no: 'Bestilling levert vellykket'
  },
  ORDER_CANCELLED: {
    en: 'Order cancelled',
    no: 'Bestilling kansellert'
  },
  ITEM_ADDED_TO_CART: {
    en: 'Item added to cart',
    no: 'Vare lagt til i handlekurv'
  },
  INVALID_CREDENTIALS: {
    en: 'Invalid email or password',
    no: 'Ugyldig e-post eller passord'
  },
  NOT_FOUND: {
    en: 'Resource not found',
    no: 'Ressurs ikke funnet'
  },
  PRODUCT_NOT_FOUND: {
    en: 'Product not found',
    no: 'Produkt ikke funnet'
  },
  INSUFFICIENT_STOCK: {
    en: 'Insufficient stock available',
    no: 'Utilstrekkelig lager tilgjengelig'
  },
  OUT_OF_STOCK: {
    en: 'Product is out of stock',
    no: 'Produkt er utsolgt'
  },
  CART_UPDATED: {
    en: 'Cart updated successfully',
    no: 'Handlekurv oppdatert vellykket'
  },
  ITEM_REMOVED: {
    en: 'Item removed from cart',
    no: 'Vare fjernet fra handlekurv'
  },
  CART_CLEARED: {
    en: 'Cart cleared successfully',
    no: 'Handlekurv tømt vellykket'
  }
};

const getMessage = (key, language = 'en') => {
  if (translations[key] && translations[key][language]) {
    return translations[key][language];
  }
  return translations[key]?.en || key;
};

export { translations, getMessage };