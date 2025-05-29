// utils/currencies.js
// This file contains a comprehensive list of ISO currency codes and their symbols.

const currencies = [
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
  // Add more currencies as needed
];

// Export the currencies array for use in other scripts
// This is for environments where module exports are supported (like Node.js tests)
// For browser environments (popup.js, content_script.js), it's typically loaded via <script> tag
// or passed via chrome.storage/messaging.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = currencies;
}
// For browser environments, this will be available globally if included via <script> tag