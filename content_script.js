// content_script.js
// This script runs on all webpages and is responsible for detecting currency values,
// performing conversions, and injecting tooltips or inline displays.

// --- Global variables for exchange rates and default currency ---
let exchangeRates = {};
let defaultCurrency = '';
let lastUpdated = 0; // Timestamp for when rates were last fetched
let currenciesData = []; // To store the list of currencies for symbol lookup

// --- Embedded Utility Function: numberToWesternWords ---
/**
 * Converts a number (up to quadrillions) into its word representation using Western numbering.
 * Supports positive integers. This version removes the decimal unit (e.g., "Cents", "Paisa").
 * @param {number|string} num - The number to convert. Can be a number or a string.
 * @returns {string} The word representation of the number.
 */
function numberToWesternWords(num) {
    if (typeof num === 'string') {
        num = parseFloat(num);
    }
    if (isNaN(num) || num < 0) {
        console.warn(`numberToWesternWords: Invalid input num=${num}`);
        return "Invalid Number";
    }
    if (num === 0) {
        return "Zero";
    }

    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion']; // Extend if needed

    /**
     * Converts a three-digit number to words.
     * @param {number} n - A number between 0 and 999.
     * @returns {string} The word representation.
     */
    function convertChunk(n) {
        let chunk = '';
        if (Math.floor(n / 100) > 0) {
            chunk += units[Math.floor(n / 100)] + ' Hundred';
            n %= 100;
            if (n > 0) chunk += ' ';
        }

        if (n > 0) {
            if (n < 10) {
                chunk += units[n];
            } else if (n >= 10 && n < 20) {
                chunk += teens[n - 10];
            } else {
                chunk += tens[Math.floor(n / 10)];
                n %= 10;
                if (n > 0) chunk += ' ' + units[n];
            }
        }
        return chunk;
    }

    let words = [];
    let i = 0;
    let tempNum = Math.floor(num); // Work with integer part for now

    if (tempNum === 0) {
        if (num === 0) return "Zero";
    } else {
        do {
            const chunk = tempNum % 1000;
            if (chunk !== 0) {
                let chunkWords = convertChunk(chunk);
                if (i > 0) {
                    chunkWords += ' ' + scales[i];
                }
                words.unshift(chunkWords);
            }
            tempNum = Math.floor(tempNum / 1000);
            i++;
        } while (tempNum > 0);
    }

    let result = words.join(' ').trim();

    // Handle decimal part if any, without adding "Cents" or "Paisa"
    const decimalPart = num - Math.floor(num);
    if (decimalPart > 0) {
        const decimalStr = decimalPart.toFixed(2).split('.')[1]; // Get two decimal places
        if (parseInt(decimalStr) > 0) {
            if (result) { // If there's an integer part
                result += ' and ' + convertChunk(parseInt(decimalStr));
            } else { // If only a decimal part (e.g., 0.50)
                result += convertChunk(parseInt(decimalStr));
            }
        }
    }

    return result || "Zero";
}

// --- Embedded Utility Function: numberToIndianWords ---
/**
 * Converts a number into its word representation using the Indian numbering system (Lakhs, Crores).
 * Supports positive integers.
 * @param {number|string} num - The number to convert.
 * @returns {string} The word representation of the number.
 */
function numberToIndianWords(num) {
    if (typeof num === 'string') {
        num = parseFloat(num);
    }
    if (isNaN(num) || num < 0) {
        console.warn(`numberToIndianWords: Invalid input num=${num}`);
        return "Invalid Number";
    }
    if (num === 0) {
        return "Zero";
    }

    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const indianScales = ['', 'Thousand', 'Lakh', 'Crore', 'Arab', 'Kharab']; // Indian numbering scales

    /**
     * Converts a two-digit number to words (for Lakhs/Crores chunks).
     * @param {number} n - A number between 0 and 99.
     * @returns {string} The word representation.
     */
    function convertTwoDigit(n) {
        if (n < 10) return units[n];
        if (n >= 10 && n < 20) return teens[n - 10];
        return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
    }

    let words = [];
    let tempNum = Math.floor(num);
    let scaleIndex = 0;

    // Process first three digits (hundreds, tens, units)
    let lastThreeDigits = tempNum % 1000;
    if (lastThreeDigits !== 0) {
        let chunk = '';
        if (Math.floor(lastThreeDigits / 100) > 0) {
            chunk += units[Math.floor(lastThreeDigits / 100)] + ' Hundred';
            lastThreeDigits %= 100;
            if (lastThreeDigits > 0) chunk += ' ';
        }
        if (lastThreeDigits > 0) {
            chunk += convertTwoDigit(lastThreeDigits);
        }
        words.unshift(chunk);
    }
    tempNum = Math.floor(tempNum / 1000);
    scaleIndex++; // Now at Thousands

    // Process remaining digits in chunks of two (Lakhs, Crores, etc.)
    while (tempNum > 0) {
        const chunk = tempNum % 100; // Two-digit chunk
        if (chunk !== 0) {
            let chunkWords = convertTwoDigit(chunk);
            if (scaleIndex < indianScales.length) {
                chunkWords += ' ' + indianScales[scaleIndex];
            }
            words.unshift(chunkWords);
        }
        tempNum = Math.floor(tempNum / 100);
        scaleIndex++;
    }

    let result = words.join(' ').trim();

    // Handle decimal part (Paisa)
    const decimalPart = num - Math.floor(num);
    if (decimalPart > 0) {
        const decimalStr = decimalPart.toFixed(2).split('.')[1];
        if (parseInt(decimalStr) > 0) {
            if (result) {
                result += ' and ' + convertTwoDigit(parseInt(decimalStr)) + ' Paisa';
            } else {
                result += convertTwoDigit(parseInt(decimalStr)) + ' Paisa';
            }
        }
    }

    return result || "Zero";
}


// --- Main Dispatcher for numberToWords ---
/**
 * Dispatches to the correct number-to-words function based on currency.
 * @param {number|string} num - The number to convert.
 * @param {string} targetCurrencyCode - The ISO code of the target currency.
 * @returns {string} The word representation of the number.
 */
function numberToWords(num, targetCurrencyCode) {
    console.log(`numberToWords called for num: ${num}, targetCurrencyCode: ${targetCurrencyCode}`);
    if (targetCurrencyCode === 'INR') {
        console.log("Dispatching to numberToIndianWords.");
        return numberToIndianWords(num);
    }
    console.log("Dispatching to numberToWesternWords.");
    return numberToWesternWords(num);
}


// --- Other Utility Functions ---

/**
 * Fetches exchange rates, default currency, and currency definitions from storage.
 * This function will be called initially and whenever settings might change.
 */
async function loadSettings() {
    console.log("Attempting to load settings...");
    try {
        const rateData = await chrome.storage.local.get(["exchangeRates", "lastUpdated"]);
        if (chrome.runtime.lastError) {
            console.error("Error retrieving local storage (rates):", chrome.runtime.lastError.message);
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
            console.error("Error retrieving sync storage (default currency):", chrome.runtime.lastError.message);
            return;
        }

        if (userSettings.defaultCurrency) {
            defaultCurrency = userSettings.defaultCurrency;
            console.log("Content script loaded default currency:", defaultCurrency);
        } else {
            console.warn("No default currency found in sync storage. Please set it in the extension popup.");
        }

        // Hardcoded list for currency data lookup in content script (for symbols)
        currenciesData = [
            { code: "USD", name: "United States Dollar", symbol: "$" },
            { code: "EUR", name: "Euro", symbol: "€" },
            { code: "GBP", name: "British Pound Sterling", symbol: "£" },
            { code: "JPY", name: "Japanese Yen", symbol: "¥" },
            { code: "AUD", name: "Australian Dollar", symbol: "A$" },
            { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
            { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
            { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
            { code: "SEK", name: "Swedish Krona", symbol: "kr" },
            { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
            { code: "INR", name: "Indian Rupee", symbol: "₹" },
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
            { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
            { code: "DKK", name: "Danish Krone", symbol: "kr" },
            { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
            { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
            { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
            { code: "ILS", name: "Israeli New Shekel", symbol: "₪" },
            { code: "CLP", name: "Chilean Peso", symbol: "CLP$" },
            { code: "COP", name: "Colombian Peso", symbol: "COL$" },
            { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
            { code: "SAR", name: "Saudi Riyal", symbol: "SR" },
            { code: "AED", name: "UAE Dirham", symbol: "AED" },
            { code: "QAR", name: "Qatari Riyal", symbol: "QR" },
            { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD" },
            { code: "BHD", name: "Bahraini Dinar", symbol: "BD" },
            { code: "OMR", name: "Omani Rial", symbol: "OMR" },
            { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
            { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
            { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs" },
            { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
            { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
            { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
            { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵" },
            { code: "XAF", name: "CFA Franc BEAC", symbol: "FCFA" },
            { code: "XOF", name: "CFA Franc BCEAO", symbol: "CFA" }
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
    if (!exchangeRates || Object.keys(exchangeRates).length === 0) {
        console.warn("Exchange rates not loaded yet. Cannot convert.");
        return null;
    }
    if (!defaultCurrency) {
        console.warn("Default currency not set. Cannot convert.");
        return null;
    }
    if (!exchangeRates[fromCurrencyCode]) {
        console.warn(`Exchange rate for source currency ${fromCurrencyCode} not available.`);
        return null;
    }
    if (!exchangeRates[defaultCurrency]) {
        console.warn(`Exchange rate for target currency ${defaultCurrency} not available.`);
        return null;
    }

    const amount = parseFloat(amountStr);

    if (isNaN(amount)) {
        console.warn(`Invalid amount string for conversion: ${amountStr}`);
        return null;
    }

    // Check for large numbers that might lose precision with parseFloat
    if (amountStr.replace(/[^0-9]/g, '').length > 15) { // Heuristic for numbers that might lose JS precision
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
 * Updated to include 'K', 'M', 'B', 'T' suffixes and refined currency symbols/codes.
 *
 * Pattern breakdown:
 * (?:                                   - Non-capturing group for the whole match
 * (                                   - Group 1: Currency Symbol
 * \$|€|¥|£|₹|A\$|C\$|CHF|kr|NZ\$|R\$|₽|R|S\$|HK\$|Mex\$|₩|₺|Rp|zł|₱|฿|RM|Kč|Ft|₪|CLP\$|COL\$|E£|SR|AED|QR|KD|BD|OMR|₨|৳|Rs|₫|₦|KSh|GH₵|FCFA|CFA
 * )\s* - Optional space after symbol
 * (\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:k|m|b|t)?)\b - Group 2: Number with optional commas, decimals, and 'k'/'m'/'b'/'t' suffix, followed by word boundary
 * )
 * |                                     - OR
 * (?:                                   - Non-capturing group for code-first match
 * (\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:k|m|b|t)?)\s* - Group 3: Number with optional commas, decimals, and 'k'/'m'/'b'/'t' suffix, followed by optional space
 * (                                   - Group 4: Explicit Currency Code
 * USD|EUR|GBP|JPY|AUD|CAD|CHF|CNY|SEK|NZD|INR|BRL|RUB|ZAR|SGD|HKD|MXN|KRW|TRY|IDR|PLN|PHP|THB|MYR|DKK|NOK|CZK|HUF|ILS|CLP|COP|EGP|SAR|AED|QAR|KWD|BHD|OMR|PKR|BDT|LKR|VND|NGN|KES|GHS|XAF|XOF
 * )\b                                 - Word boundary after code
 * )
 */
const currencyRegex = /(?:(\$|€|¥|£|₹|A\$|C\$|CHF|kr|NZ\$|R\$|₽|R|S\$|HK\$|Mex\$|₩|₺|Rp|zł|₱|฿|RM|Kč|Ft|₪|CLP\$|COL\$|E£|SR|AED|QR|KD|BD|OMR|₨|৳|Rs|₫|₦|KSh|GH₵|FCFA|CFA)\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:k|m|b|t)?)\b)|(?:(\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:k|m|b|t)?)\s*(USD|EUR|GBP|JPY|AUD|CAD|CHF|CNY|SEK|NZD|INR|BRL|RUB|ZAR|SGD|HKD|MXN|KRW|TRY|IDR|PLN|PHP|THB|MYR|DKK|NOK|CZK|HUF|ILS|CLP|COP|EGP|SAR|AED|QAR|KWD|BHD|OMR|PKR|BDT|LKR|VND|NGN|KES|GHS|XAF|XOF)\b)/gi;

/**
 * Maps currency symbols to their ISO codes.
 * Updated to include new symbols and clarify Rs/₨.
 */
const symbolToCodeMap = {
    "$": "USD", "€": "EUR", "¥": "JPY", "£": "GBP", "₹": "INR",
    "A$": "AUD", "C$": "CAD", "CHF": "CHF", "kr": "SEK", "NZ$": "NZD",
    "R$": "BRL", "₽": "RUB", "R": "ZAR", "S$": "SGD", "HK$": "HKD",
    "Mex$": "MXN", "₩": "KRW", "₺": "TRY", "Rp": "IDR", "zł": "PLN",
    "₱": "PHP", "฿": "THB", "RM": "MYR", "Kč": "CZK", "Ft": "HUF",
    "₪": "ILS", "CLP$": "CLP", "COL$": "COP", "E£": "EGP", "SR": "SAR",
    "AED": "AED", "QR": "QAR", "KD": "KWD", "BD": "BHD", "OMR": "OMR",
    "₨": "PKR", // Pakistani Rupee
    "৳": "BDT", // Bangladeshi Taka
    "Rs": "LKR", // Sri Lankan Rupee (common symbol)
    "₫": "VND", "₦": "NGN", "KSh": "KES", "GH₵": "GHS", "FCFA": "XAF", "CFA": "XOF"
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
 * Extracts the numeric amount from a regex match, handling 'K', 'M', 'B', 'T' suffixes.
 * @param {Array} match - The regex match array.
 * @returns {string} The numeric amount string (e.g., "1,000.50" -> "1000.50", "60K" -> "60000").
 */
function getAmountFromMatch(match) {
    // Match group 2: number after symbol (e.g., "1,000.50K" from "$1,000.50K")
    // Match group 3: number before explicit code (e.g., "1,000.50M" from "1,000.50M USD")
    let amountWithSuffix = match[2] || match[3];
    if (!amountWithSuffix) return '';

    let amount = parseFloat(amountWithSuffix.replace(/,/g, ''));
    const suffix = amountWithSuffix.slice(-1).toLowerCase(); // Get last char and make lowercase

    if (suffix === 'k') {
        amount *= 1000;
    } else if (suffix === 'm') {
        amount *= 1000000;
    } else if (suffix === 'b') {
        amount *= 1000000000; // Billion
    } else if (suffix === 't') {
        amount *= 1000000000000; // Trillion
    }
    return String(amount);
}


/**
 * Creates and injects a tooltip element next to the target element.
 * @param {HTMLElement} targetElement - The element next to which the tooltip will appear.
 * @param {string} convertedText - The text to display in the tooltip.
 */
function createTooltip(targetElement, convertedText) {
    // Remove any existing tooltips from the body to prevent duplicates
    document.querySelectorAll('.currency-converter-tooltip').forEach(tooltip => tooltip.remove());

    const tooltip = document.createElement('span');
    tooltip.className = 'currency-converter-tooltip';
    tooltip.style.cssText = `
        background-color: #333;
        color: #fff;
        padding: 6px 10px; /* Slightly larger padding */
        border-radius: 6px; /* Slightly more rounded */
        font-size: 0.85em; /* Slightly larger font */
        position: fixed; /* Position relative to the viewport */
        z-index: 2147483647; /* Max z-index to ensure visibility */
        white-space: normal; /* Allow text to wrap */
        max-width: 350px; /* Increased max width for better readability */
        min-width: 120px; /* Minimum width */
        max-height: 250px; /* Increased max height */
        overflow-y: auto; /* Enable vertical scroll if content overflows */
        pointer-events: none; /* Allow clicks to pass through */
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
        box-sizing: border-box; /* Include padding/border in width calculation */
        word-break: break-word; /* Break long words */
        box-shadow: 0 4px 12px rgba(0,0,0,0.4); /* Stronger shadow */
        line-height: 1.4; /* Improve line spacing */
    `;
    tooltip.textContent = convertedText;

    document.body.appendChild(tooltip); // Append directly to body

    // Calculate position based on the target element's bounding rectangle
    const rect = targetElement.getBoundingClientRect();
    let tooltipX = rect.right + 10; // Start 10px to the right of the target
    let tooltipY = rect.top + (rect.height / 2); // Center vertically with target

    // Adjust for vertical centering of tooltip itself
    // Temporarily set transform to calculate actual offsetWidth/offsetHeight accurately
    // before applying final position.
    tooltip.style.transform = 'translateY(-50%)';

    // Get tooltip dimensions after it's in the DOM and initial styling applied
    // Force reflow to get accurate dimensions
    tooltip.offsetWidth; // Trigger reflow
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    // Boundary checks
    // If tooltip goes off screen to the right, place it to the left
    if (tooltipX + tooltipWidth > window.innerWidth - 15) { // 15px margin from right edge
        tooltipX = rect.left - tooltipWidth - 15; // 15px to the left of the target
    }

    // If tooltip goes off screen to the left (after potential right adjustment), clamp it
    if (tooltipX < 15) {
        tooltipX = 15; // 15px margin from left edge
    }

    // If tooltip goes off screen to the bottom, place it above the target
    if (tooltipY + tooltipHeight > window.innerHeight - 15) { // 15px margin from bottom edge
        tooltipY = rect.bottom - tooltipHeight - 15; // 15px above bottom of target
        // If it still goes off screen to the top, clamp it
        if (tooltipY < 15) {
            tooltipY = 15; // 15px margin from top edge
        }
    }

    tooltip.style.left = `${tooltipX}px`;
    tooltip.style.top = `${tooltipY}px`;


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
    let i = 0;

    // Process matches to identify ranges and single values
    while (i < matches.length) {
        const currentMatch = matches[i];
        const originalValue1 = currentMatch[0];
        const amountStr1 = getAmountFromMatch(currentMatch);
        const fromCurrencyCode1 = getCurrencyCodeFromMatch(currentMatch);

        let processedAsRange = false;

        // Check if there's a next match and if they form a range
        if (i + 1 < matches.length) {
            const nextMatch = matches[i + 1];
            const originalValue2 = nextMatch[0];
            const amountStr2 = getAmountFromMatch(nextMatch);
            const fromCurrencyCode2 = getCurrencyCodeFromMatch(nextMatch);

            // Extract text between the two matched currency values
            const textBetween = text.substring(
                currentMatch.index + originalValue1.length,
                nextMatch.index
            ).trim();

            // Check if the text between is a range indicator and currencies are compatible
            // This is a simplified compatibility check. For strictness, ensure both symbols/codes are identical.
            // For now, we'll check if the currency codes are the same or if their symbols map to the same code.
            const areCurrenciesCompatible = fromCurrencyCode1 === fromCurrencyCode2 ||
                                           (symbolToCodeMap[originalValue1.replace(/[^a-zA-Z$€¥£₹]/g, '')] === symbolToCodeMap[originalValue2.replace(/[^a-zA-Z$€¥£₹]/g, '')] &&
                                            symbolToCodeMap[originalValue1.replace(/[^a-zA-Z$€¥£₹]/g, '')] !== undefined);


            if ((textBetween === '-' || textBetween.toLowerCase() === 'to') && areCurrenciesCompatible) {
                processedAsRange = true;
                const fullOriginalRange = text.substring(currentMatch.index, nextMatch.index + originalValue2.length);

                let rangeConversions = [];
                const valuesToConvert = [
                    { amount: amountStr1, currency: fromCurrencyCode1, original: originalValue1 },
                    { amount: amountStr2, currency: fromCurrencyCode2, original: originalValue2 }
                ];

                for (const val of valuesToConvert) {
                    if (val.amount.replace(/[^0-9]/g, '').length > 15) {
                        rangeConversions.push(`Value too large`); // Shorter message for ranges
                        continue;
                    }
                    const convertedNumeric = convertCurrency(val.amount, val.currency);
                    if (convertedNumeric !== null) {
                        const targetCurrency = currenciesData.find(c => c.code === defaultCurrency);
                        const targetSymbol = targetCurrency ? targetCurrency.symbol : defaultCurrency;
                        rangeConversions.push(`${targetSymbol}${convertedNumeric}`);
                    } else {
                        rangeConversions.push(`Failed`); // Shorter message for ranges
                    }
                }

                if (rangeConversions.length === 2) {
                    let rangeDisplay = rangeConversions.join('–'); // Use en-dash for ranges
                    let rangeWords = '';
                    const num1 = parseFloat(rangeConversions[0].replace(/[^0-9.]/g, ''));
                    const num2 = parseFloat(rangeConversions[1].replace(/[^0-9.]/g, ''));
                    if (!isNaN(num1) && !isNaN(num2)) {
                        rangeWords = `(${numberToWords(num1, defaultCurrency)} to ${numberToWords(num2, defaultCurrency)})`;
                    }
                    convertedParts.push(`${fullOriginalRange} → ${rangeDisplay} ${rangeWords}`);
                } else {
                    convertedParts.push(`${fullOriginalRange} → Partial conversion for range`);
                }
                i += 2; // Skip both current and next match as they form a range
            }
        }

        if (!processedAsRange) {
            // Process as a single value
            if (amountStr1 && fromCurrencyCode1) {
                if (amountStr1.replace(/[^0-9]/g, '').length > 15) {
                    convertedParts.push(`${originalValue1} → Value too large for precise conversion`);
                } else {
                    const convertedNumeric = convertCurrency(amountStr1, fromCurrencyCode1);
                    if (convertedNumeric !== null) {
                        const targetCurrency = currenciesData.find(c => c.code === defaultCurrency);
                        const targetSymbol = targetCurrency ? targetCurrency.symbol : defaultCurrency;
                        let convertedWords = numberToWords(parseFloat(convertedNumeric), defaultCurrency); // Pass defaultCurrency
                        console.log(`Word conversion result for ${convertedNumeric}: ${convertedWords}`); // Added logging
                        let displayString = `${originalValue1} → ${targetSymbol}${convertedNumeric}`;
                        if (convertedWords && convertedWords !== "Invalid Number" && convertedWords !== "Zero") {
                            displayString += ` (${convertedWords})`;
                        }
                        convertedParts.push(displayString);
                    } else {
                        convertedParts.push(`${originalValue1} → Conversion failed`);
                    }
                }
            }
            i++; // Move to the next match
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


// --- Main Logic (Event Listeners and Initial Load) ---

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
