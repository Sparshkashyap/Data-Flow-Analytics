const axios = require('axios');
const env = require('../config/env');

class ExchangeRateProvider {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async convert(amount, from, to) {
    const normalizedFrom = String(from).toUpperCase();
    const normalizedTo = String(to).toUpperCase();

    if (!normalizedFrom || !normalizedTo || !amount || Number(amount) <= 0) {
      throw new Error('Invalid conversion parameters.');
    }

    const response = await axios.get(`${this.baseUrl}/v6/latest/${normalizedFrom}`, {
      timeout: 8000,
      headers: {
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
    });

    const rate = Number(response?.data?.rates?.[normalizedTo]);
    if (!rate) {
      throw new Error('Currency conversion rate unavailable.');
    }

    return {
      source: normalizedFrom,
      target: normalizedTo,
      amount: Number(amount),
      convertedAmount: Number(amount) * rate,
      rate,
    };
  }
}

async function convertCurrency(amount, from, to) {
  try {
    const provider = new ExchangeRateProvider(env.currencyApiBaseUrl, env.currencyApiKey);
    return await provider.convert(amount, from, to);
  } catch (error) {
    const apiError = new Error('Currency conversion is temporarily unavailable.');
    apiError.statusCode = 502;
    apiError.code = 'CURRENCY_API_ERROR';
    apiError.publicMessage = 'Currency conversion is temporarily unavailable.';
    throw apiError;
  }
}

module.exports = { ExchangeRateProvider, convertCurrency };
