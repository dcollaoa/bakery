document.addEventListener('DOMContentLoaded', () => {
    // --- Auto-set today's date ---
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    document.getElementById('event-date').value = formattedDate;
    document.getElementById('delivery-date').value = formattedDate;

    // --- DOM Elements ---
    const form = document.getElementById('order-form');
    const themeSwitcher = document.getElementById('theme-switcher');
    const body = document.body;
    const tableBody = document.querySelector('#product-table tbody');
    const addRowButton = document.getElementById('add-row');
    const deliveryCheckbox = document.getElementById('enable-delivery');
    const deliveryAddressGroup = document.getElementById('delivery-address-group');
    const shippingRow = document.getElementById('shipping-row');

    // --- Multi-Step Form Elements ---
    const prevBtn = document.querySelector('.nav-btn.prev');
    const nextBtn = document.querySelector('.nav-btn.next');
    const pdfBtn = document.getElementById('generate-pdf');
    const formSteps = [...document.querySelectorAll('.form-step')];
    const progressSteps = [...document.querySelectorAll('.progress-bar-step')];
    let currentStep = 1;

    // --- Initial Setup ---
    updateFormSteps();
    updateProgressBar();
    updateNavButtons();

    // --- Event Listeners ---
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

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateFormSteps();
            updateProgressBar();
            updateNavButtons();
        }
    });

    deliveryCheckbox.addEventListener('change', () => {
        const isEnabled = deliveryCheckbox.checked;
        console.log('Delivery checkbox changed. isEnabled:', isEnabled);
        console.log('Before toggle - deliveryAddressGroup classList:', deliveryAddressGroup.classList);
        console.log('Before toggle - shippingRow classList:', shippingRow.classList);
        deliveryAddressGroup.classList.toggle('hidden', !isEnabled);
        shippingRow.classList.toggle('hidden', !isEnabled);
        console.log('After toggle - deliveryAddressGroup classList:', deliveryAddressGroup.classList);
        console.log('After toggle - shippingRow classList:', shippingRow.classList);
        document.getElementById('delivery-address').required = isEnabled;
        if (!isEnabled) {
            document.getElementById('shipping').value = 0;
        }
        updateTotals();
    });

    pdfBtn.addEventListener('click', generatePDF);

    // --- Validation ---
    function validateStep(stepNumber) {
        const currentStepElement = formSteps[stepNumber - 1];
        const requiredInputs = currentStepElement.querySelectorAll('[required]');
        let allValid = true;

        for (const input of requiredInputs) {
            const formGroup = input.closest('.form-group');
            if (!input.value.trim()) {
                allValid = false;
                if (formGroup) {
                    formGroup.classList.add('invalid');
                } else {
                    input.classList.add('invalid');
                }
            } else {
                if (formGroup) {
                    formGroup.classList.remove('invalid');
                } else {
                    input.classList.remove('invalid');
                }
            }
        }
        return allValid;
    }

    // Remove invalid status on input
    form.addEventListener('input', (e) => {
        if (e.target.hasAttribute('required')) {
            const formGroup = e.target.closest('.form-group');
            if (e.target.value.trim()) {
                if (formGroup) {
                    formGroup.classList.remove('invalid');
                } else {
                    e.target.classList.remove('invalid');
                }
            }
        }
    });

    // --- Multi-Step Functions ---
    function updateFormSteps() {
        formSteps.forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step) === currentStep);
        });
    }

    function updateProgressBar() {
        progressSteps.forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step) <= currentStep);
        });
    }

    function updateNavButtons() {
        prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
        nextBtn.style.display = currentStep < formSteps.length ? 'block' : 'none';
        pdfBtn.style.display = currentStep === formSteps.length ? 'block' : 'none';
    }

    // --- PDF Generation ---
    function generatePDF() {
        console.log('generatePDF function called.');
        const pdfArea = document.getElementById('pdf-export-area');
        console.log('pdfArea:', pdfArea);

        // --- 1. GATHER DATA ---
        const clientName = document.getElementById('client-name').value;
        const clientPhone = document.getElementById('client-phone').value;
        const clientEmail = document.getElementById('client-email').value;
        const eventDate = document.getElementById('event-date').value;
        const deliveryDate = document.getElementById('delivery-date').value;
        const deliveryTime = document.getElementById('delivery-time').value;
        const isDeliveryEnabled = document.getElementById('enable-delivery').checked;
        const deliveryAddress = document.getElementById('delivery-address').value;
        const notes = document.getElementById('notes').value;

        // --- 2. BUILD PDF HTML STRING ---
        let productRows = '';
        tableBody.querySelectorAll('tr').forEach(row => {
            const quantity = row.querySelector('.quantity').value;
            const description = row.querySelector('.description').value;
            const price = parseFloat(row.querySelector('.price').value || 0);
            const amount = Math.round(quantity * price);
            productRows += `
                <tr>
                    <td>${quantity}</td>
                    <td>${description}</td>
                    <td>${price.toFixed(0)}</td>
                    <td>${amount}</td>
                </tr>
            `;
        });

        const subtotal = document.getElementById('subtotal').textContent;
        const shipping = parseFloat(document.getElementById('shipping').value) || 0;
        const totalNet = subtotal + shipping;
        const deposit = parseFloat(document.getElementById('deposit').value) || 0;
        const balance = totalNet - deposit;

        const pdfHTML = `
            <div class="pdf-container">
                <div class="pdf-header">
                    <img src="logo.png" alt="Logo Nataly Antezana" class="pdf-logo-img">
                </div>

                <div class="pdf-section">
                    <h3>Datos del Pedido</h3>
                    <div class="pdf-grid">
                        <div class="item"><strong>Cliente:</strong> <span>${clientName}</span></div>
                        <div class="item"><strong>Teléfono:</strong> <span>${clientPhone}</span></div>
                        <div class="item"><strong>Email:</strong> <span>${clientEmail}</span></div>
                        <div class="item"><strong>Fecha del Evento:</strong> <span>${eventDate}</span></div>
                        <div class="item"><strong>Fecha de Entrega:</strong> <span>${deliveryDate} a las ${deliveryTime}</span></div>
                        <div class="item"><strong>Entrega a Domicilio:</strong> <span>${isDeliveryEnabled ? 'Sí' : 'No'}</span></div>
                        ${isDeliveryEnabled ? `<div class="item full-width"><strong>Dirección:</strong> <span>${deliveryAddress}</span></div>` : ''}
                    </div>
                </div>

                <div class="pdf-section">
                    <h3>Detalles del Producto</h3>
                    <table class="pdf-table">
                        <thead>
                            <tr>
                                <th>Cantidad</th>
                                <th>Descripción</th>
                                <th>Precio Unit.</th>
                                <th>Importe</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productRows}
                        </tbody>
                    </table>
                </div>

                ${notes ? `<div class="pdf-section pdf-notes-section"><p><strong>Observaciones:</strong> ${notes}</p></div>` : ''}

                <div class="pdf-totals">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <strong>${subtotal}</strong>
                    </div>
                    ${isDeliveryEnabled ? `
                    <div class="total-row">
                        <span>Envío:</span>
                        <strong>${shipping}</strong>
                    </div>` : ''}
                    <div class="total-row grand-total">
                        <span>Total Neto:</span>
                        <strong>${totalNet}</strong>
                    </div>
                    <div class="total-row">
                        <span>Anticipo:</span>
                        <strong>-${deposit}</strong>
                    </div>
                    <div class="total-row grand-total">
                        <span>Resto a Pagar:</span>
                        <strong>${balance}</strong>
                    </div>
                </div>

                <div class="pdf-footer">
                    <p>¡Gracias por su compra!</p>
                </div>
            </div>
        `;

        pdfArea.innerHTML = pdfHTML;

        // --- 3. CALL HTML2PDF ---
        try {
            const element = pdfArea.querySelector('.pdf-container');
            console.log('element:', element);
            const options = {
                margin: 0,
                filename: `pedido_${clientName.replace(/ /g, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(options).from(element).save();
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    }

    // --- Theme Switcher Logic ---
    const applyTheme = (theme) => {
        body.classList.toggle('dark-theme', theme === 'dark');
    };

    themeSwitcher.addEventListener('click', () => {
        const isDark = body.classList.contains('dark-theme');
        const newTheme = isDark ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // --- Calculation Logic ---
    const updateTotals = () => {
        let subtotal = 0;
        tableBody.querySelectorAll('tr').forEach(row => {
            const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
            const price = parseFloat(row.querySelector('.price').value) || 0;
            const amount = quantity * price;
            row.querySelector('.amount').textContent = Math.round(amount);
            subtotal += amount;
        });

        const shipping = parseFloat(document.getElementById('shipping').value) || 0;
        const deposit = parseFloat(document.getElementById('deposit').value) || 0;
        const totalNet = subtotal + shipping;
        const balance = totalNet - deposit;

        document.getElementById('subtotal').textContent = Math.round(subtotal);
        document.getElementById('total-net').textContent = Math.round(totalNet);
        document.getElementById('balance').textContent = Math.round(balance);
    };

    const createNewRow = () => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td><input type="number" class="quantity" value="1" min="1"></td>
            <td><input type="text" class="description" required></td>
            <td><input type="number" class="price" min="0" step="0.01" required></td>
            <td><span class="amount">0</span></td>
            <td><button type="button" class="remove-row">X</button></td>
        `;
        tableBody.appendChild(newRow);
    };

    addRowButton.addEventListener('click', createNewRow);

    form.addEventListener('input', (e) => {
        if (e.target.closest('#product-table') || ['shipping', 'deposit'].includes(e.target.id)) {
            updateTotals();
        }
        if (e.target.hasAttribute('required')) {
            const formGroup = e.target.closest('.form-group');
            if (e.target.value.trim()) {
                if (formGroup) {
                    formGroup.classList.remove('invalid');
                } else {
                    e.target.classList.remove('invalid');
                }
            }
        }
    });

    tableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-row') && tableBody.querySelectorAll('tr').length > 1) {
            e.target.closest('tr').remove();
            updateTotals();
        }
    });

    // Initial calculation
    updateTotals();
});