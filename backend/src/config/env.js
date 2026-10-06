const dotenv = require('dotenv');

dotenv.config();

const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  uploadMaxSizeMb: Number(process.env.UPLOAD_MAX_SIZE_MB || 10),
  restCountriesApiKey: process.env.REST_COUNTRIES_API_KEY || '',
  currencyApiKey: process.env.CURRENCY_API_KEY || '',
  currencyApiBaseUrl: process.env.CURRENCY_API_BASE_URL || 'https://open.er-api.com',
};

module.exports = env;
