console.log('Script loaded!');

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Elements ---
    const themeSwitcher = document.getElementById('theme-switcher');
    const body = document.documentElement;

    // --- Theme Switcher Logic ---
    if (themeSwitcher) {
        const applyTheme = (theme) => {
            body.classList.toggle('dark-theme', theme === 'dark');
        };

        themeSwitcher.addEventListener('click', () => {
            const isDark = body.classList.contains('dark-theme');
            const newTheme = isDark ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });

        // No need to apply theme here, it is done in the inline script
        // const savedTheme = localStorage.getItem('theme') || 'light';
        // applyTheme(savedTheme);
    }

    // --- Form-Specific Logic ---
    const form = document.getElementById('order-form');
    if (form) {
        // --- Auto-set today's date ---
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        const eventDateEl = document.getElementById('event-date');
        const deliveryDateEl = document.getElementById('delivery-date');
        if (eventDateEl) {
            eventDateEl.value = formattedDate;
        }
        if (deliveryDateEl) {
            deliveryDateEl.value = formattedDate;
        }

        // --- DOM Elements ---
        const tableBody = document.querySelector('#product-table tbody');
        const addRowButton = document.getElementById('add-product-row');
        const deliveryCheckbox = document.getElementById('enable-delivery');
        const deliveryAddressGroup = document.getElementById('delivery-address-group');
        const shippingRow = document.getElementById('shipping-row');
        // const clientSelect = document.getElementById('client-select'); // Moved to orders.js
        let clientsPopulated = false; // Guard variable

        // Function to populate a single product dropdown
        async function populateProductDropdown(selectElement) {
            if (!selectElement) return;
            try {
                const response = await fetch('/api/products');
                if (!response.ok) throw new Error('Failed to fetch products');
                const products = await response.json();
                
                const firstOption = selectElement.options[0];
                selectElement.innerHTML = '';
                selectElement.add(firstOption);

                products.forEach(product => {
                    const option = new Option(product.name, product.id);
                    console.log('Product price from API:', product.price);
                    option.dataset.price = product.price;
                    console.log('Option dataset price set to:', option.dataset.price);
                    selectElement.add(option);
                });
            } catch (error) {
                console.error('Error populating products:', error);
            }
        }


        // --- Multi-Step Form Elements ---
        const prevBtn = document.querySelector('.nav-btn.prev');
        const nextBtn = document.querySelector('.nav-btn.next');
        const pdfBtn = document.getElementById('generate-pdf');
        const formSteps = [...document.querySelectorAll('.form-step')];
        const progressSteps = [...document.querySelectorAll('.progress-bar-step')];
        let currentStep = 1;

        // --- Initial Setup ---
        // populateClientDropdown(); // Removed as orders.js handles this
        populateProductDropdown(document.querySelector('.product-select'));
        updateFormSteps();
        updateProgressBar();
        updateNavButtons();

        // --- Event Listeners ---
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (validateStep(currentStep)) {
                    if (currentStep < formSteps.length) {
                        currentStep++;
                        updateFormSteps();
                        updateProgressBar();
                        updateNavButtons();
                    }
                }
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentStep > 1) {
                    currentStep--;
                    updateFormSteps();
                    updateProgressBar();
                    updateNavButtons();
                }
            });
        }

        if (deliveryCheckbox) {
            deliveryCheckbox.addEventListener('change', () => {
                const isEnabled = deliveryCheckbox.checked;
                deliveryAddressGroup.style.visibility = isEnabled ? 'visible' : 'hidden';
                shippingRow.classList.toggle('hidden', !isEnabled);
                document.getElementById('delivery-address').required = isEnabled;
                if (!isEnabled) {
                    document.getElementById('shipping').value = 0;
                }
                updateTotals();
            });
        }

        if (pdfBtn) {
            // pdfBtn.addEventListener('click', generatePDF);
        }

        // --- Validation ---
        function validateStep(stepNumber) {