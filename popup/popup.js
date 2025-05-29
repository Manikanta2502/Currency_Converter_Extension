// popup/popup.js
// This script handles the logic for the extension's popup UI.

// The 'currencies' array is now expected to be loaded from '../utils/currencies.js'
// via a <script> tag in popup.html before this script executes.
// Therefore, we remove the placeholder declaration here.

document.addEventListener('DOMContentLoaded', async () => {
    const defaultCurrencySelect = document.getElementById('defaultCurrency');
    const saveButton = document.getElementById('saveButton');
    const statusMessage = document.getElementById('statusMessage');

    /**
     * Displays a status message to the user.
     * @param {string} message - The message to display.
     * @param {string} type - 'success' or 'error' for styling.
     */
    function showStatusMessage(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `block text-center text-sm font-medium mt-2 p-2 rounded-md transition-opacity duration-300 ${type}`;
        statusMessage.classList.remove('hidden'); // Ensure it's visible
        // Hide after a few seconds
        setTimeout(() => {
            statusMessage.classList.add('opacity-0');
            statusMessage.addEventListener('transitionend', () => {
                statusMessage.classList.add('hidden'); // Hide completely after fade out
                statusMessage.classList.remove('success', 'error'); // Clean up classes
            }, { once: true });
        }, 3000);
    }

    /**
     * Populates the currency dropdown with options.
     */
    function populateCurrencyDropdown() {
        // Clear existing options
        defaultCurrencySelect.innerHTML = '';

        // Create a default "Select a currency" option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select your default currency';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        defaultCurrencySelect.appendChild(defaultOption);

        // Add currency options from the currencies array (now globally available from currencies.js)
        // Ensure 'currencies' is accessible. If not, revisit how currencies.js is loaded.
        if (typeof currencies !== 'undefined' && Array.isArray(currencies)) {
            currencies.forEach(currency => {
                const option = document.createElement('option');
                option.value = currency.code;
                option.textContent = `${currency.name} (${currency.symbol})`;
                defaultCurrencySelect.appendChild(option);
            });
        } else {
            console.error("Currencies data not found or not an array. Check utils/currencies.js loading.");
            showStatusMessage("Error: Currency list not loaded.", "error");
        }
    }

    /**
     * Loads the user's saved default currency from chrome.storage.sync
     * and sets the dropdown value.
     */
    async function loadDefaultCurrency() {
        try {
            const result = await chrome.storage.sync.get('defaultCurrency');
            if (result.defaultCurrency) {
                defaultCurrencySelect.value = result.defaultCurrency;
                // If a value is loaded, ensure the "Select a currency" option is not selected
                const selectedOption = defaultCurrencySelect.querySelector('option[value="' + result.defaultCurrency + '"]');
                if (selectedOption) {
                    selectedOption.selected = true;
                }
                const disabledOption = defaultCurrencySelect.querySelector('option[disabled]');
                if (disabledOption) {
                    disabledOption.selected = false;
                }
            }
        } catch (error) {
            console.error("Error loading default currency:", error);
            showStatusMessage("Failed to load saved currency.", "error");
        }
    }

    /**
     * Saves the selected default currency to chrome.storage.sync.
     */
    async function saveDefaultCurrency() {
        const selectedCurrency = defaultCurrencySelect.value;
        if (selectedCurrency) {
            try {
                await chrome.storage.sync.set({ defaultCurrency: selectedCurrency });
                console.log("Default currency saved:", selectedCurrency);
                showStatusMessage(`Default currency set to ${selectedCurrency}!`, "success");
            } catch (error) {
                console.error("Error saving default currency:", error);
                showStatusMessage("Failed to save currency. Please try again.", "error");
            }
        } else {
            showStatusMessage("Please select a currency.", "error");
        }
    }

    // Initialize the dropdown and load saved preferences
    populateCurrencyDropdown();
    await loadDefaultCurrency();

    // Add event listener to the save button
    saveButton.addEventListener('click', saveDefaultCurrency);
});
