# 💱 Currency Converter Chrome Extension

A Chrome Extension that automatically detects and converts currencies on webpages to your preferred currency. It supports single values, ranges, and even mixed currencies — with real-time display in numbers!

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

- 🔁 **Live Exchange Rates**
  - Updates once daily from [Frankfurter API](https://www.frankfurter.app/)
  - Offline support with cached rates

- ⚙️ **User Preferences**
  - Set and change your default currency anytime
  - Stored using `chrome.storage.sync`

---

## 🛠️ Setup Instructions

1. **Clone this repository**

   ```bash
   git clone https://github.com/yourusername/currency-converter-extension.git
   cd currency-converter-extension

2. **Open Chrome Extension Page**

    Go to chrome://extensions/, enable Developer Mode (top-right), then click Load unpacked.

3. **Select the project folder**

    Choose the currency-converter-extension/ folder.

4. **Set your default currency**

    Click the extension icon, pick your default currency from the dropdown, and save.


---

## 🚀 Future Enhancements

- ✅ Right-click menu: “Convert this amount”
- 🧾 Conversion history
- 📊 Custom formats: accounting style (e.g., USD 1,000.00)
- 🧠 AI-based context filtering to ignore dates, phone numbers, etc.

---

## 📦 APIs & Libraries Used

- 📡 [Frankfurter API](https://www.frankfurter.app/) – for live exchange rates
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