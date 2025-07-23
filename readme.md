# 💱 Currency Converter Chrome Extension

A Chrome Extension that automatically detects and converts currencies on webpages to your preferred currency. It supports single values and ranges — with real-time display both in words and in numbers!

Convert the prices and currencies to your preferenced currencies in `real-time` values with a **Single Click...**

<img src="assets\Live_working_of_currency_converter.png" alt="Currency Converter Extension Screenshot" width="500" height="300" />


---

## 🌟 Features

- 🔍 **Currency Detection**  
  Detects and converts:
  - Highlighted text
  - Dynamic webpage content

- 💰 **Supports Complex Formats**  
  - Single values (e.g., `$50`, `€49.99`, `¥1000`)
  - Ranges (`$75–$100`, `€200 to €500`)

- 🧠 **Smart Display**
  - Numbers: `$10 → ₹830`
  - Words: `Ten dollars → Eight hundred thirty rupees`

- 🚩 **Countries**
  - Supports `150+` currencies for detection and translation of `50+` currencies.

- 🔁 **Live Exchange Rates**
  - Updates once daily from [ExchangeRate API]([text](https://www.exchangerate-api.com/))
  - Offline support with cached rates

- ⚙️ **User Preferences**
  - Set and change your default currency anytime
  - Stored using `chrome.storage.sync`

---

## 🛠️ Setup Instructions

### 🔖 Option 1: Install via GitHub Release

1. Go to the [Latest Release](https://github.com/Manikanta2502/Currency_Converter_Extension/releases)
2. Download the `.zip` file (e.g., `currency-converter-extension.zip`)
3. Extract it to a folder on your computer
4. Open `chrome://extensions/` in Chrome
5. Enable **Developer Mode** (top-right toggle)
6. Click **Load unpacked** and select the extracted folder

### 💻 Option 2: Clone & Load Locally

1. **Clone this repository**

   ```bash
   git clone https://github.com/manikanta2502/currency-converter-extension.git
   cd currency-converter-extension

2. **Open Chrome Extension Page**

    Go to chrome://extensions/, enable Developer Mode (top-right), then click Load unpacked.

3. **Select the project folder**

    Choose the currency-converter-extension/ folder.

4. **Set your default currency**

    Click the extension icon, pick your default currency from the dropdown, and save.

---
## Note
- Reload the Page after changing the currency for updating the script to the new currency.

---

## 🚀 Future Enhancements

- 🧾 Conversion history
- 📊 Custom formats: accounting style (e.g., USD 1,000.00)
- 🧠 AI-based context filtering to ignore dates, phone numbers, etc.

---

## 📦 APIs & Libraries Used

- 📶 [ExchangeRate API](https://www.exchangerate-api.com/) - for live exchange rates
- 🔢 [bignumber.js](https://github.com/MikeMcl/bignumber.js/) – for large currency calculations (planned)

---

## 🧑‍💻 Author

**Manikanta Maguluri**  
🌐 [Portfolio](https://manikantamaguluri.live)  
🔗 [GitHub](https://github.com/Manikanta2502)  
💼 [LinkedIn](https://www.linkedin.com/in/manikantamaguluri)

---

## 📝 License

This project is licensed under the [MIT License](./LICENSE).
