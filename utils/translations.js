const translations = {
    SUCCESS: {
        en: "Operation successful",
        no: "Vellykket operasjon",
    },
     ORDER_CREATED: {
    en: 'Order created successfully',
    no: 'Bestilling opprettet vellykket'
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
  }
};

const getMessage = (key, language = "en") => {
    if (translations[key] && translations[key][language]) {
        return translations[key][language];
    }
    return translations[key]?.en || key;
};

export { translations, getMessage };