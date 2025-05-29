// content_script.js
// This script runs on all webpages and is responsible for detecting currency values,
// performing conversions, and injecting tooltips or inline displays.

// --- Global variables for exchange rates and default currency ---
let exchangeRates = {};
let defaultCurrency = '';
let lastUpdated = 0; // Timestamp for when rates were last fetched
let currenciesData = []; // To store the list of currencies for symbol lookup

// --- Utility Functions ---

/**
 * Fetches exchange rates, default currency, and currency definitions from storage.
 * This function will be called initially and whenever settings might change.
 */
async function loadSettings() {
    console.log("Attempting to load settings...");
    try {
        const rateData = await chrome.storage.local.get(["exchangeRates", "lastUpdated"]);
        if (chrome.runtime.lastError) {
            console.error("Error retrieving local storage:", chrome.runtime.lastError.message);
            // This error often indicates context invalidation.
            // We can't recover from it in the content script, so just log and return.
            return;
        }

        if (rateData.exchangeRates) {
            exchangeRates = rateData.exchangeRates;
            lastUpdated = rateData.lastUpdated || 0;
            console.log("Content script loaded exchange rates:", exchangeRates);
        } else {
            console.warn("No exchange rates found in local storage. Conversion may not work.");
        }

        const userSettings = await chrome.storage.sync.get('defaultCurrency');
        if (chrome.runtime.lastError) {
            console.error("Error retrieving sync storage:", chrome.runtime.lastError.message);
            return;
        }

        if (userSettings.defaultCurrency) {
            defaultCurrency = userSettings.defaultCurrency;
            console.log("Content script loaded default currency:", defaultCurrency);
        } else {
            console.warn("No default currency found in sync storage. Please set it in the extension popup.");
        }

        // Hardcoded list for currency data lookup in content script (for symbols)
        // This avoids complex messaging or web_accessible_resources for a simple list.
        currenciesData = [
            { code: "USD", name: "United States Dollar", symbol: "$" },
            { code: "EUR", name: "Euro", symbol: "€" },
            { code: "GBP", name: "British Pound Sterling", symbol: "£" },
            { code: "JPY", name: "Japanese Yen", symbol: "¥" },
            { code: "INR", name: "Indian Rupee", symbol: "₹" },
            { code: "AUD", name: "Australian Dollar", symbol: "A$" },
            { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
            { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
            { code: "SEK", name: "Swedish Krona", symbol: "kr" },
            { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
            { code: "BRL", name: "Brazilian Real", symbol: "R$" },
            { code: "RUB", name: "Russian Ruble", symbol: "₽" },
            { code: "ZAR", name: "South African Rand", symbol: "R" },
            { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
            { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
            { code: "MXN", name: "Mexican Peso", symbol: "Mex$" },
            { code: "KRW", name: "South Korean Won", symbol: "₩" },
            { code: "TRY", name: "Turkish Lira", symbol: "₺" },
            { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
            { code: "PLN", name: "Polish Zloty", symbol: "zł" },
            { code: "PHP", name: "Philippine Peso", symbol: "₱" },
            { code: "THB", name: "Thai Baht", symbol: "฿" },
            { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" }
        ];

    } catch (error) {
        console.error("General error loading settings in content script:", error);
    }
}

/**
 * Converts a currency amount from a source currency to the target default currency.
 * Uses standard JavaScript numbers.
 * @param {string} amountStr - The amount as a string (e.g., "1000", "50.99").
 * @param {string} fromCurrencyCode - The ISO code of the source currency (e.g., "USD", "EUR").
 * @returns {string|null} The converted amount as a string, or null if conversion is not possible.
 */
function convertCurrency(amountStr, fromCurrencyCode) {
    if (!exchangeRates || !defaultCurrency || !exchangeRates[fromCurrencyCode] || !exchangeRates[defaultCurrency]) {
        console.warn("Exchange rates or default currency not available for conversion in convertCurrency.");
        return null;
    }

    const amount = parseFloat(amountStr);

    if (isNaN(amount)) {
        console.warn(`Invalid amount string for conversion: ${amountStr}`);
        return null;
    }

    // Check for large numbers that might lose precision with parseFloat
    // As per project doc, for numbers > 20 digits, show "Value too large to convert".
    // For JS precision, we'll use 15 digits as a practical limit for full accuracy.
    if (amountStr.replace(/[^0-9]/g, '').length > 15) { // Count only digits, ignore commas/decimals for length check
        console.warn(`Number ${amountStr} is very large and might lose precision with standard JavaScript numbers.`);
        return "Value too large for precise conversion";
    }

    try {
        // Convert 'fromCurrencyCode' to 'EUR' (base currency for Frankfurter API)
        // Then convert from 'EUR' to 'defaultCurrency'
        const amountInEUR = amount / exchangeRates[fromCurrencyCode];
        const convertedAmount = amountInEUR * exchangeRates[defaultCurrency];

        // Return a fixed number of decimal places, or adjust as needed
        return convertedAmount.toFixed(2); // Example: 2 decimal places
    } catch (e) {
        console.error("Error during currency conversion:", e);
        return null;
    }
}

/**
 * Regex to detect currency patterns.
 * This regex is designed to be comprehensive, matching:
 * - Currency symbols ($€¥£)
 * - Optional spaces after symbol
 * - Numbers with commas and optional decimals
 * - Supports various currency symbols from the project document.
 */
const currencyRegex = /(?:(\$|€|¥|£|₹|A\$|C\$|CHF|kr|NZ\$|R\$|₽|R|S\$|HK\$|Mex\$|₩|₺|Rp|zł|₱|฿|RM)\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?))|(?:(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(USD|EUR|GBP|JPY|AUD|CAD|CHF|CNY|SEK|NZD|INR|BRL|RUB|ZAR|SGD|HKD|MXN|KRW|TRY|IDR|PLN|PHP|THB|MYR)\b)/gi;

/**
 * Maps currency symbols to their ISO codes.
 * This is a simplified map. A more robust solution might need a lookup table.
 */
const symbolToCodeMap = {
    "$": "USD", "€": "EUR", "¥": "JPY", "£": "GBP", "₹": "INR",
    "A$": "AUD", "C$": "CAD", "CHF": "CHF", "kr": "SEK", "NZ$": "NZD",
    "R$": "BRL", "₽": "RUB", "R": "ZAR", "S$": "SGD", "HK$": "HKD",
    "Mex$": "MXN", "₩": "KRW", "₺": "TRY", "Rp": "IDR", "zł": "PLN",
    "₱": "PHP", "฿": "THB", "RM": "MYR"
};

/**
 * Attempts to determine the currency code from a matched string.
 * @param {Array} match - The regex match array.
 * @returns {string|null} The currency code (e.g., "USD") or null if not found.
 */
function getCurrencyCodeFromMatch(match) {
    // Match group 1: symbol (e.g., "$", "€")
    // Match group 4: explicit code (e.g., "USD", "EUR")
    const symbol = match[1];
    const explicitCode = match[4];

    if (explicitCode) {
        return explicitCode.toUpperCase();
    } else if (symbol) {
        return symbolToCodeMap[symbol];
    }
    return null;
}

/**
 * Extracts the numeric amount from a regex match.
 * @param {Array} match - The regex match array.
 * @returns {string} The numeric amount string (e.g., "1,000.50" -> "1000.50").
 */
function getAmountFromMatch(match) {
    // Match group 2: number after symbol (e.g., "1,000.50" from "$1,000.50")
    // Match group 3: number before explicit code (e.g., "1,000.50" from "1,000.50 USD")
    const amountWithCommas = match[2] || match[3];
    return amountWithCommas ? amountWithCommas.replace(/,/g, '') : '';
}


/**
 * Creates and injects a tooltip element next to the target element.
 * @param {HTMLElement} targetElement - The element next to which the tooltip will appear.
 * @param {string} convertedText - The text to display in the tooltip.
 */
function createTooltip(targetElement, convertedText) {
    // console.log("Creating tooltip for:", targetElement, "with text:", convertedText);

    // Remove any existing tooltips for this element to prevent duplicates
    const existingTooltip = targetElement.querySelector('.currency-converter-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }

    const tooltip = document.createElement('span');
    tooltip.className = 'currency-converter-tooltip';
    tooltip.style.cssText = `
        background-color: #333;
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8em;
        position: absolute;
        z-index: 2147483647; /* Max z-index to ensure visibility */
        white-space: nowrap;
        pointer-events: none; /* Allow clicks to pass through */
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
        margin-left: 5px; /* Small offset */
        transform: translateY(-50%); /* Center vertically */
    `;
    tooltip.textContent = convertedText;

    // Append to the target element, or its parent if target is a text node
    let appendTarget = targetElement;
    if (targetElement.nodeType === Node.TEXT_NODE) {
        appendTarget = targetElement.parentElement;
    }
    if (appendTarget) {
        appendTarget.style.position = 'relative'; // Ensure positioning context
        appendTarget.appendChild(tooltip);

        // Position the tooltip relative to the target element
        // This is a more stable way to position within the parent
        tooltip.style.top = '50%';
        tooltip.style.left = '100%';

        // Make it visible after a short delay
        setTimeout(() => tooltip.style.opacity = '1', 50);

        // Remove tooltip after a few seconds or when mouse leaves
        let timeoutId;
        const hideTooltip = () => {
            clearTimeout(timeoutId);
            tooltip.style.opacity = '0';
            tooltip.addEventListener('transitionend', () => tooltip.remove(), { once: true });
        };

        // For inputs, listen to blur. For selected text, it's more complex.
        // We'll rely on the timeout for selected text for now.
        if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA') {
            targetElement.addEventListener('blur', hideTooltip, { once: true });
        }
        // Set a timeout to hide the tooltip automatically
        timeoutId = setTimeout(hideTooltip, 5000); // Hide after 5 seconds
    }
}


/**
 * Processes text for currency conversion.
 * @param {string} text - The text to process.
 * @param {HTMLElement} targetElement - The element to attach the tooltip to.
 * @returns {string} The processed text with conversions.
 */
function processTextForConversion(text, targetElement) {
    if (!defaultCurrency || Object.keys(exchangeRates).length === 0) {
        console.warn("Settings not loaded, cannot process text for conversion.");
        return text; // Return original text if settings are not ready
    }

    const matches = [...text.matchAll(currencyRegex)];
    let convertedParts = [];

    for (const match of matches) {
        const originalValue = match[0];
        const amountStr = getAmountFromMatch(match);
        const fromCurrencyCode = getCurrencyCodeFromMatch(match);

        console.log(`Detected: Original='${originalValue}', Amount='${amountStr}', From='${fromCurrencyCode}'`);

        if (amountStr && fromCurrencyCode) {
            // Check for very large numbers before conversion
            if (amountStr.replace(/[^0-9]/g, '').length > 15) { // Heuristic for numbers that might lose JS precision
                convertedParts.push(`${originalValue} → Value too large for precise conversion`);
                continue;
            }

            const converted = convertCurrency(amountStr, fromCurrencyCode);
            if (converted !== null) {
                const targetCurrency = currenciesData.find(c => c.code === defaultCurrency);
                const targetSymbol = targetCurrency ? targetCurrency.symbol : defaultCurrency; // Fallback to code if symbol not found
                convertedParts.push(`${originalValue} → ${targetSymbol}${converted}`);
            } else {
                convertedParts.push(`${originalValue} → Conversion failed`);
            }
        }
    }

    if (convertedParts.length > 0) {
        const fullConversionText = convertedParts.join('; ');
        console.log("Conversion results:", fullConversionText);
        // Only create tooltip if there's a target element provided and conversions happened
        if (targetElement) {
            createTooltip(targetElement, fullConversionText);
        }
        return fullConversionText; // Return the conversion string for potential inline display
    }
    return text; // Return original text if no conversions
}


/**
 * Handles text selection and attempts currency conversion.
 * @param {Event} event - The 'mouseup' event object.
 */
document.addEventListener('mouseup', async (event) => {
    // Always ensure settings are loaded or refreshed before processing
    await loadSettings();

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    console.log("Mouseup event fired. Selected text:", selectedText);

    if (selectedText.length > 0) {
        // Find the most appropriate element to attach the tooltip to.
        // This is tricky with selections, often the common ancestor.
        let targetElement = null;
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            targetElement = range.commonAncestorContainer;
            // If it's a text node, use its parent element
            if (targetElement.nodeType === Node.TEXT_NODE) {
                targetElement = targetElement.parentElement;
            }
            // Ensure we have a valid HTML element and not body/html itself
            if (targetElement && (targetElement.tagName === 'BODY' || targetElement.tagName === 'HTML' || targetElement.tagName === 'HEAD')) {
                targetElement = null; // Don't attach to body/html/head
            }
        }

        if (targetElement) {
            console.log("Target element for tooltip:", targetElement);
            processTextForConversion(selectedText, targetElement);
        } else {
            console.log("No suitable target element found for tooltip on selection.");
            // If no specific element, we could consider a floating global tooltip,
            // but for now, we'll just log.
        }
    }
});

/**
 * Handles input field changes for real-time conversion.
 */
document.addEventListener('input', async (event) => {
    // Always ensure settings are loaded or refreshed before processing
    await loadSettings();

    const target = event.target;
    // Check if the target is an input field (text, number) or a textarea
    if ((target.tagName === 'INPUT' && (target.type === 'text' || target.type === 'number')) || target.tagName === 'TEXTAREA') {
        const inputValue = target.value.trim();
        console.log("Input event fired. Input value:", inputValue);

        if (inputValue.length > 0) {
            processTextForConversion(inputValue, target);
        } else {
            // If input is empty, remove any existing tooltip
            const existingTooltip = target.querySelector('.currency-converter-tooltip');
            if (existingTooltip) {
                existingTooltip.remove();
            }
        }
    }
});

// Listen for messages from the background script or popup to reload settings
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "settingsUpdated") {
        console.log("Content script received settings update notification. Reloading settings...");
        loadSettings(); // Reload settings when default currency changes in popup
    }
});

// Initial load of settings when the content script is injected
loadSettings();
