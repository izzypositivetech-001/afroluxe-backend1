
const languageMiddleware = (req, res, next) => {
  const acceptLanguage = req.headers['accept-language'];
  const supportedLanguages = ['en', 'no'];
  let language = 'en';
  
  if (acceptLanguage) {
    const primaryLanguage = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
    if (supportedLanguages.includes(primaryLanguage)) {
      language = primaryLanguage;
    }
  }
  
  req.language = language;
  next();
};

export default languageMiddleware;
