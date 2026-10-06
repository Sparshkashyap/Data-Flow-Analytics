const axios = require('axios');
const env = require('../config/env');

const countryCache = new Map();

async function fetchCountries() {
  const cacheKey = 'countries';
  if (countryCache.has(cacheKey)) return countryCache.get(cacheKey);

  try {
    const response = await axios.get('https://restcountries.com/v3.1/all', {
      timeout: 8000,
      headers: {
        ...(env.restCountriesApiKey ? { Authorization: `Bearer ${env.restCountriesApiKey}` } : {}),
      },
    });

    const normalized = response.data.map((country) => ({
      name: country.name?.common || country.name?.official || null,
      cca2: country.cca2 || null,
      cca3: country.cca3 || null,
      currencies: country.currencies ? Object.entries(country.currencies).map(([code, value]) => ({
        code,
        name: value.name || null,
        symbol: value.symbol || null,
      })) : [],
      languages: country.languages ? Object.values(country.languages) : [],
      region: country.region || null,
      population: country.population || 0,
      flag: country.flags?.png || country.flags?.svg || null,
    }));

    countryCache.set(cacheKey, normalized);
    return normalized;
  } catch (error) {
    const apiError = new Error('Country data is temporarily unavailable.');
    apiError.statusCode = 502;
    apiError.code = 'COUNTRY_API_ERROR';
    apiError.publicMessage = 'Country data is temporarily unavailable.';
    throw apiError;
  }
}

async function searchCountries(query) {
  const countries = await fetchCountries();
  if (!query) return countries;
  const normalizedQuery = String(query).trim().toLowerCase();
  return countries.filter((country) => {
    return country.name?.toLowerCase().includes(normalizedQuery)
      || country.cca2?.toLowerCase().includes(normalizedQuery)
      || country.cca3?.toLowerCase().includes(normalizedQuery);
  });
}

async function getCountryByCode(code) {
  const countries = await fetchCountries();
  const normalizedCode = String(code).trim().toLowerCase();
  return countries.find((country) => {
    return country.cca2?.toLowerCase() === normalizedCode || country.cca3?.toLowerCase() === normalizedCode;
  }) || null;
}

async function getCurrencyInfo(currencyCode) {
  const countries = await fetchCountries();
  const normalizedCurrency = String(currencyCode).trim().toUpperCase();
  const matches = countries.filter((country) => country.currencies.some((currency) => currency.code === normalizedCurrency));
  return matches.map((country) => ({
    country: country.name,
    countryCode: country.cca2,
    currency: country.currencies.find((currency) => currency.code === normalizedCurrency),
  }));
}

module.exports = { fetchCountries, searchCountries, getCountryByCode, getCurrencyInfo };
