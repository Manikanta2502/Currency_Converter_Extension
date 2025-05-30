// background.js
// This script runs in the background and handles fetching and caching exchange rates.

const API_URL = "https://open.er-api.com/v6/latest/USD";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Fetches the latest exchange rates from the Frankfurter API.
 * @returns {Promise<Object|null>} A promise that resolves with the exchange rates object, or null if fetching fails.
 */
async function fetchExchangeRates() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      console.error(`Failed to fetch exchange rates: ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return null;
  }
}

/**
 * Caches the exchange rates and the last update timestamp in chrome.storage.local.
 * @param {Object} rates - The exchange rates object to cache.
 */
async function cacheRates(rates) {
  const timestamp = Date.now();
  await chrome.storage.local.set({
    exchangeRates: rates,
    lastUpdated: timestamp,
  });
  console.log("Exchange rates cached successfully.");
}

/**
 * Retrieves cached exchange rates and their last update timestamp.
 * @returns {Promise<Object|null>} A promise that resolves with an object containing rates and lastUpdated, or null if not found.
 */
async function getCachedRates() {
  const data = await chrome.storage.local.get(["exchangeRates", "lastUpdated"]);
  if (data.exchangeRates && data.lastUpdated) {
    return {
      rates: data.exchangeRates,
      lastUpdated: data.lastUpdated,
    };
  }
  return null;
}

/**
 * Updates exchange rates if they are older than the cache duration or not available.
 * Caches new rates upon successful fetch.
 */
async function updateExchangeRates() {
  const cached = await getCachedRates();
  const now = Date.now();

  if (!cached || (now - cached.lastUpdated > CACHE_DURATION_MS)) {
    console.log("Fetching new exchange rates...");
    const rates = await fetchExchangeRates();
    if (rates) {
      await cacheRates(rates);
    } else {
      console.warn("Could not fetch new rates. Using cached rates if available.");
    }
  } else {
    console.log("Using cached exchange rates (still fresh).");
  }
}

// Listen for the extension to be installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log("Currency Converter extension installed or updated.");
  updateExchangeRates();
});

// Create an alarm to update rates daily
chrome.alarms.create("dailyRateUpdate", {
  periodInMinutes: 24 * 60 // Once every 24 hours
});

// Listen for the daily rate update alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "dailyRateUpdate") {
    console.log("Daily rate update triggered.");
    updateExchangeRates();
  }
});

// Initial update check when the background script starts
updateExchangeRates();

// Expose a function to get rates for content script/popup if needed
// (This is an example, direct storage access might be preferred for simplicity)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getExchangeRates") {
    getCachedRates().then(cached => {
      sendResponse({ rates: cached ? cached.rates : null });
    });
    return true; // Indicates that sendResponse will be called asynchronously
  }
});
