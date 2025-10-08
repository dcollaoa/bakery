/**
 * Orders.js - Gestión de Pedidos REFACTORIZADO
 * Ahora usa FormatUtils para formateo consistente de precios
 * @version 2.0.0
 */

let products = [];
let clients = [];
let selectedProducts = [];
let currentOrder = {};
let orders = [];

document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadClients();
    loadOrders();
    loadOrderDetails();
    setupStepNavigation();
    initializeStep5();
    setupModal();
    setupPaymentManagement();
});

function setupPaymentManagement() {
    const saveButton = document.getElementById('save-payment-status-btn');

    saveButton.addEventListener('click', () => {
        const anticipoPaid = document.getElementById('anticipo-paid-switch').checked;
        const pendientePaid = document.getElementById('pendiente-paid-switch').checked;

        fetch(`/api/orders/${currentOrder.id}/payment-status`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    anticipo_pagado: anticipoPaid,
                    pendiente_pagado: pendientePaid
                })
            }
        )
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Estado del pago actualizado correctamente');
                location.reload();
            } else {
                alert('Error al actualizar el estado del pago');
            }
        });
    });
}

function setupModal() {
    const modal = document.getElementById('order-detail-modal');
    const closeButton = modal.querySelector('.close-button');
    const ordersTableBody = document.getElementById('ordersTableBody');

    closeButton.addEventListener('click', () => {
        modal.classList.add('force-hidden');
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.add('force-hidden');
        }
    });

    ordersTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-order-btn')) {
            const orderId = parseInt(event.target.dataset.orderId);
            const order = orders.find(o => o.id === orderId);
            if (order) {
                populateAndShowModal(order);
            }
        }
    });
}

function populateAndShowModal(order) {
    currentOrder = order;
    const modal = document.getElementById('order-detail-modal');
    modal.classList.remove('force-hidden');

    // Populate modal with order data
    document.getElementById('modal-order-id').textContent = order.id;
    document.getElementById('modal-client-name').textContent = order.client_name;
    
    // Fetch and display client details
    const client = clients.find(c => c.id === order.client_id);
    if (client) {
        document.getElementById('modal-client-phone').textContent = client.phone || 'No disponible';
        document.getElementById('modal-client-email').textContent = client.email || 'No disponible';
    }


    document.getElementById('modal-delivery-date').textContent = order.delivery_date;
    document.getElementById('modal-delivery-time').textContent = order.delivery_time;
    
    const isDeliveryEnabledSpan = document.getElementById('modal-is-delivery-enabled');
    const deliveryAddressRow = document.getElementById('modal-delivery-address-row');
    if (order.is_delivery_enabled) {
        isDeliveryEnabledSpan.textContent = 'Sí';
        document.getElementById('modal-delivery-address').textContent = order.delivery_address;
        deliveryAddressRow.style.display = 'block';
    } else {
        isDeliveryEnabledSpan.textContent = 'No';
        deliveryAddressRow.style.display = 'none';
    }

    // Products
    const productsList = document.getElementById('modal-products-list');
    productsList.innerHTML = '';
    if (order.products_json) {
        const products = JSON.parse(order.products_json);
        products.forEach(product => {
            const li = document.createElement('li');
            li.textContent = `${product.quantity} x ${product.name} - ${FormatUtils.formatPrice(product.price)}`;
            productsList.appendChild(li);
        });
    }

    // Observations
    const observationsList = document.getElementById('modal-observations-list');
    observationsList.innerHTML = '';
    if (order.observations) {
        const observations = JSON.parse(order.observations);
        if (observations.length > 0) {
            observations.forEach(obs => {
                const li = document.createElement('li');
                li.textContent = obs;
                observationsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No hay observaciones.';
            observationsList.appendChild(li);
        }
    } else {
        const li = document.createElement('li');
        li.textContent = 'No hay observaciones.';
        observationsList.appendChild(li);
    }


    // Totals
    document.getElementById('modal-subtotal').textContent = FormatUtils.formatTotal(order.subtotal);
    const shippingRow = document.getElementById('modal-shipping-row');
    if (order.is_delivery_enabled) {
        document.getElementById('modal-shipping').textContent = FormatUtils.formatTotal(order.shipping);
        shippingRow.style.display = 'block';
    } else {
        shippingRow.style.display = 'none';
    }
    document.getElementById('modal-total-net').textContent = FormatUtils.formatTotal(order.total_net);
    document.getElementById('modal-deposit').textContent = FormatUtils.formatTotal(order.deposit);
    document.getElementById('modal-balance').textContent = FormatUtils.formatTotal(order.balance);

    // Payment Status
    document.getElementById('anticipo-paid-switch').checked = order.deposit > 0;
    document.getElementById('pendiente-paid-switch').checked = order.balance <= 0;
}

function setupStepNavigation() {
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');

    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = this.closest('.step');
            const nextStepId = this.dataset.step;
            if (validateStep(currentStep.id)) {
                currentStep.classList.remove('active');
                document.getElementById(`step${nextStepId}`).classList.add('active');
                updateStepIndicator(nextStepId);
            }
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = this.closest('.step');
            const prevStepId = this.dataset.step;
            currentStep.classList.remove('active');
            document.getElementById(`step${prevStepId}`).classList.add('active');
            updateStepIndicator(prevStepId);
        });
    });
}

function updateStepIndicator(step) {
    document.querySelectorAll('.step-indicator').forEach(indicator => {
        indicator.classList.remove('active');
    });
    document.getElementById(`indicator${step}`).classList.add('active');
}

function validateStep(stepId) {
    if (stepId === 'step1') {
        const clientSelect = document.getElementById('clientSelect');
        if (!clientSelect.value) {
            alert('Por favor, selecciona un cliente.');
            return false;
        }
        currentOrder.client_id = clientSelect.value;
        currentOrder.client_name = clientSelect.options[clientSelect.selectedIndex].text;
        // document.getElementById('orderClientName').textContent = currentOrder.client_name;
    } else if (stepId === 'step2') {
        const orderDate = document.getElementById('orderDate').value;
        const orderTime = document.getElementById('orderTime').value;
        if (!orderDate || !orderTime) {
            alert('Por favor, selecciona la fecha y hora del pedido.');
            return false;
        }
        currentOrder.date = orderDate;
        currentOrder.time = orderTime;
        document.getElementById('orderDateTime').textContent = `${orderDate} ${orderTime}`;
    } else if (stepId === 'step3') {
        if (selectedProducts.length === 0) {
            alert('Por favor, añade al menos un producto al pedido.');
            return false;
        }
        currentOrder.products_json = selectedProducts;
        // renderOrderSummary(); // This function is removed
    } else if (stepId === 'step4') {
        renderProductObservationsUI();
    }
    return true;
}

function loadProducts() {
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            products = data;
            const productSelect = document.getElementById('productSelect');
            productSelect.innerHTML = '';
            data.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = product.name;
                productSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error loading products:', error));
}

function loadClients() {
    fetch('/api/clients')
        .then(response => response.json())
        .then(data => {
            clients = data;
            const clientSelect = document.getElementById('clientSelect');
            clientSelect.innerHTML = '';
            data.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.name;
                clientSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error loading clients:', error));
}

document.getElementById('addProductToOrder').addEventListener('click', function() {
    const productId = parseInt(document.getElementById('productSelect').value);
    const quantity = parseInt(document.getElementById('productQuantity').value);
    const product = products.find(p => p.id === productId);

    if (product && quantity > 0) {
        console.log('Adding product:', { productId, quantity, product });
        const uniqueId = Date.now() + Math.random();
        selectedProducts.push({ ...product, quantity: quantity, observations: [], uniqueId: uniqueId });

        renderSelectedProducts();
        renderProductObservationsUI();
    } else {
        alert('Por favor, selecciona un producto y una cantidad válida.');
    }
});

/**
 * ✅ FUNCIÓN REFACTORIZADA - Ahora usa FormatUtils
 * Renderiza los productos seleccionados en la tabla con formato correcto
 */
function renderSelectedProducts() {
    console.log('Rendering selected products:', selectedProducts);
    const productTableBody = document.querySelector('#product-table tbody');
    productTableBody.innerHTML = '';
    let total = 0;

    selectedProducts.forEach((item) => {
        console.log('Processing item:', item);
        const row = productTableBody.insertRow();
        
        // Nombre del producto
        row.insertCell(0).textContent = item.name;
        
        // Cantidad
        row.insertCell(1).textContent = item.quantity;
        
        // ✅ PRECIO UNITARIO - Ahora formateado correctamente (49.000)
        row.insertCell(2).textContent = FormatUtils.formatPrice(item.price);
        
        // Calcular importe
        const amount = item.quantity * item.price;
        console.log('Item amount:', amount);
        
        // ✅ IMPORTE - Ahora formateado correctamente (98.000)
        row.insertCell(3).textContent = FormatUtils.formatAmount(amount);
        
        // Botón de eliminar
        const actionsCell = row.insertCell(4);
        actionsCell.innerHTML = `<button class="delete-observation-btn observation-btn" data-unique-id="${item.uniqueId}">X</button>`;
        
        total += amount;
        console.log('Current total:', total);
    });

    // ✅ TOTAL - Ahora formateado correctamente
    document.getElementById('selectedProductsTotal').textContent = FormatUtils.formatTotal(total);
    console.log('Final displayed total:', document.getElementById('selectedProductsTotal').textContent);

    // Event listeners para botones de eliminar
    document.querySelectorAll('.remove-product').forEach(button => {
        button.addEventListener('click', function() {
            const productUniqueIdToRemove = parseFloat(this.dataset.uniqueId);
            selectedProducts = selectedProducts.filter(item => item.uniqueId !== productUniqueIdToRemove);
            renderSelectedProducts();
            renderProductObservationsUI();
        });
    });
}

function renderProductObservationsUI() {
    const productObservationTabsNav = document.getElementById('productObservationTabsNav');
    const productObservationTabsContent = document.getElementById('productObservationTabsContent');

    const activeTabButton = productObservationTabsNav.querySelector('.tab-button.active');
    const previouslyActiveUniqueId = activeTabButton ? 
        parseFloat(activeTabButton.dataset.uniqueId) : null;

    productObservationTabsNav.innerHTML = '';
    productObservationTabsContent.innerHTML = '';

    if (selectedProducts.length === 0) {
        return;
    }

    selectedProducts.forEach((item, index) => {
        const tabButton = document.createElement('button');
        tabButton.type = 'button';
        tabButton.classList.add('tab-button');
        tabButton.textContent = item.name;
        tabButton.dataset.uniqueId = item.uniqueId;
        productObservationTabsNav.appendChild(tabButton);

        const tabContent = document.createElement('div');
        tabContent.classList.add('tab-content', 'form-group');
        tabContent.dataset.uniqueId = item.uniqueId;
        tabContent.innerHTML = `
            
            <ul class="list-group product-observation-list" data-unique-id="${item.uniqueId}">
                ${item.observations.map((obs, obsIndex) => `
                    <li class="list-group-item observation-item" data-obs-index="${obsIndex}">
                        <span class="observation-text">${obs}</span>
                        <div class="observation-actions">
                            <button type="button" class="edit-observation-btn observation-btn" data-unique-id="${item.uniqueId}" data-obs-index="${obsIndex}">Editar</button>
                            <button type="button" class="delete-observation-btn observation-btn" data-unique-id="${item.uniqueId}" data-obs-index="${obsIndex}">X</button>
                        </div>
                    </li>`).join('')}
            </ul>
            <div class="input-group mb-3">
                <input type="text" class="form-control product-new-observation-input" data-unique-id="${item.uniqueId}" placeholder="Añadir nueva observación...">
                <button class="add-product-observation-btn observation-btn" type="button" data-unique-id="${item.uniqueId}">Añadir</button>
            </div>
        `;
        productObservationTabsContent.appendChild(tabContent);

        if (item.uniqueId === previouslyActiveUniqueId || (previouslyActiveUniqueId === null && index === 0)) {
            tabButton.classList.add('active');
            tabContent.classList.add('active');
        }
    });

    if (!productObservationTabsNav.querySelector('.tab-button.active') && selectedProducts.length > 0) {
        productObservationTabsNav.querySelector('.tab-button').classList.add('active');
        productObservationTabsContent.querySelector('.tab-content').classList.add('active');
    }

    // Event listeners para tabs
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            this.classList.add('active');
            const targetUniqueId = parseFloat(this.dataset.uniqueId);
            document.querySelector(`.tab-content[data-unique-id="${targetUniqueId}"]`).classList.add('active');
        });
    });

    // Event listeners para agregar observaciones
    document.querySelectorAll('.add-product-observation-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productUniqueId = parseFloat(this.dataset.uniqueId);
            const inputField = document.querySelector(`.product-new-observation-input[data-unique-id="${productUniqueId}"]`);
            const newObservation = inputField.value.trim();

            if (newObservation) {
                const productIndex = selectedProducts.findIndex(item => item.uniqueId === productUniqueId);
                if (productIndex > -1) {
                    selectedProducts[productIndex].observations.push(newObservation);
                    inputField.value = '';
                    renderProductObservationsUI();
                }
            }
        });
    });

    // Event listeners para eliminar observaciones
    document.querySelectorAll('.delete-observation-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productUniqueId = parseFloat(this.dataset.uniqueId);
            const obsIndex = parseInt(this.dataset.obsIndex);
            const productIndex = selectedProducts.findIndex(item => item.uniqueId === productUniqueId);

            if (productIndex > -1 && selectedProducts[productIndex].observations[obsIndex] !== undefined) {
                selectedProducts[productIndex].observations.splice(obsIndex, 1);
                renderProductObservationsUI();
            }
        });
    });

    // Event listeners para editar observaciones
    document.querySelectorAll('.edit-observation-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productUniqueId = parseFloat(this.dataset.uniqueId);
            const obsIndex = parseInt(this.dataset.obsIndex);
            const productIndex = selectedProducts.findIndex(item => item.uniqueId === productUniqueId);

            if (productIndex > -1) {
                const listItem = this.closest('.observation-item');
                const observationTextSpan = listItem.querySelector('.observation-text');
                const currentText = observationTextSpan.textContent;

                observationTextSpan.style.display = 'none';
                this.style.display = 'none';

                const inputField = document.createElement('input');
                inputField.type = 'text';
                inputField.classList.add('form-control', 'edit-observation-input');
                inputField.value = currentText;
                listItem.prepend(inputField);

                const saveButton = document.createElement('button');
                saveButton.type = 'button';
                saveButton.classList.add('save-observation-btn', 'observation-btn');
                saveButton.textContent = 'Guardar';
                listItem.querySelector('.observation-actions').prepend(saveButton);

                inputField.focus();

                const saveChanges = () => {
                    const newText = inputField.value.trim();
                    if (newText) {
                        selectedProducts[productIndex].observations[obsIndex] = newText;
                    }
                    renderProductObservationsUI();
                };

                saveButton.addEventListener('click', saveChanges);
                inputField.addEventListener('blur', saveChanges);
                inputField.addEventListener('keydown', function(event) {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        saveChanges();
                    }
                });
            }
        });
    });
}


function updateFinalTotals() {
    const subtotal = selectedProducts.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const shippingInput = document.getElementById('shipping');
    const depositInput = document.getElementById('deposit'); // Get the deposit input element
    const shipping = parseFloat(shippingInput.value) || 0;

    const totalNet = subtotal + shipping;

    // Calculate 50% of totalNet for suggested deposit
    const suggestedDeposit = totalNet * 0.5;

    // Only pre-fill if the deposit input is currently empty or 0
    // Also, ensure this only happens if the user hasn't manually set a value
    if (depositInput.value === '' || parseFloat(depositInput.value) === 0) {
        depositInput.value = suggestedDeposit.toFixed(0); // Pre-fill with rounded value
    }

    // Get the deposit value AFTER potential pre-filling or user input
    const deposit = parseFloat(depositInput.value) || 0;

    const balance = totalNet - deposit;

    document.getElementById('subtotal').textContent = FormatUtils.formatTotal(subtotal);
    document.getElementById('total-net').textContent = FormatUtils.formatTotal(totalNet);
    document.getElementById('balance').textContent = FormatUtils.formatTotal(balance);

    // Use snake_case for keys to match backend expectation
    currentOrder.subtotal = subtotal;
    currentOrder.shipping = shipping;
    currentOrder.deposit = deposit;
    currentOrder.total_net = totalNet;
    currentOrder.balance = balance;
    
    const clientSelect = document.getElementById('clientSelect');
    if (clientSelect.value) {
        currentOrder.client_id = clientSelect.value;
        currentOrder.client_name = clientSelect.options[clientSelect.selectedIndex].text;
    }

    currentOrder.delivery_date = document.getElementById('delivery-date').value;
    currentOrder.delivery_time = document.getElementById('delivery-time').value;
    currentOrder.is_delivery_enabled = document.getElementById('enable-delivery').checked;
    currentOrder.delivery_address = currentOrder.is_delivery_enabled ? document.getElementById('delivery-address').value : '';
    currentOrder.products_json = selectedProducts;
    const allObservations = selectedProducts.reduce((obs, product) => {
        return obs.concat(product.observations.map(o => `${product.name}: ${o}`));
    }, []);

    currentOrder.observations = allObservations;
}

function initializeStep5() {
    const shippingInput = document.getElementById('shipping');
    const depositInput = document.getElementById('deposit');
    const deliveryCheckbox = document.getElementById('enable-delivery');
    const shippingRow = document.getElementById('shipping-row');
    const deliveryAddressGroup = document.getElementById('delivery-address-group');
    const nextBtn = document.querySelector('.nav-btn.next');

    if (shippingInput) shippingInput.addEventListener('input', updateFinalTotals);
    if (depositInput) depositInput.addEventListener('input', updateFinalTotals);

    if (deliveryCheckbox) {
        deliveryCheckbox.addEventListener('change', function() {
            const isEnabled = this.checked;
            if (shippingRow) shippingRow.classList.toggle('hidden', !isEnabled);
            if (deliveryAddressGroup) deliveryAddressGroup.style.visibility = isEnabled ? 'visible' : 'hidden';
            
            if (!isEnabled) {
                if (shippingInput) shippingInput.value = 0;
            }
            updateFinalTotals();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const activeStep = document.querySelector('.form-step.active');
            if (activeStep && activeStep.dataset.step === '4') {
                setTimeout(updateFinalTotals, 50);
            }
        });
    }
}



document.getElementById('confirmOrder').addEventListener('click', function() {
    updateFinalTotals();

    if (!currentOrder.client_id) {
        alert('Por favor, selecciona un cliente (Paso 1).');
        return;
    }
    if (!currentOrder.products_json || currentOrder.products_json.length === 0) {
        alert('Por favor, añade al menos un producto al pedido (Paso 3).');
        return;
    }

    fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentOrder),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || 'Error en el servidor') });
        }
        return response.json();
    })
    .then(data => {
        alert('Pedido realizado con éxito! ID del Pedido: ' + data.id);
        location.reload();
    })
    .catch(error => {
        console.error('Error al realizar el pedido:', error);
        alert('Hubo un error al crear el pedido: ' + error.message);
    });
});


function resetOrderForm() {
    currentOrder = {};
    selectedProducts = [];
    document.getElementById('clientSelect').value = '';
    document.getElementById('orderDate').value = '';
    document.getElementById('orderTime').value = '';
    document.getElementById('productSelect').value = '';
    document.getElementById('productQuantity').value = '1';
    document.getElementById('selectedProductsList').innerHTML = '';
    document.getElementById('selectedProductsTotal').textContent = '0';
    document.getElementById('orderClientName').textContent = '';
    document.getElementById('orderDateTime').textContent = '';
    document.getElementById('orderSummaryList').innerHTML = '';
    document.getElementById('orderSummaryTotal').textContent = '0';

    document.getElementById('step1').classList.add('active');
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step3').classList.remove('active');
    document.getElementById('step4').classList.remove('active');
    updateStepIndicator(1);
}

function loadOrders() {
    fetch('/api/orders')
        .then(response => response.json())
        .then(data => {
            orders = data;
            renderOrdersTable();
        })
        .catch(error => console.error('Error loading orders:', error));
}

/**
 * ✅ FUNCIÓN REFACTORIZADA - Ahora usa FormatUtils
 */
function renderOrdersTable() {
    const ordersTableBody = document.getElementById('ordersTableBody');
    ordersTableBody.innerHTML = '';
    
    orders.forEach(order => {
        const row = ordersTableBody.insertRow();
        row.insertCell(0).textContent = order.id;
        row.insertCell(1).textContent = order.client_name;
        row.insertCell(2).textContent = FormatUtils.formatDateTime(order.order_date);
        row.insertCell(3).textContent = FormatUtils.formatDateTime(order.delivery_date);
        row.insertCell(4).textContent = FormatUtils.formatTotal(order.total_net);
        row.insertCell(5).textContent = order.deposit > 0 ? 'Realizado' : 'Pendiente';
        row.insertCell(6).textContent = FormatUtils.formatTotal(order.balance);

        // Estado logic
        const estadoCell = row.insertCell(7);
        let estadoText = 'Pendiente';
        if (order.anticipo_pagado && order.balance <= 0) {
            estadoText = 'Pagado Completo';
        } else if (order.anticipo_pagado) {
            estadoText = 'Anticipo Pagado';
        }
        estadoCell.textContent = estadoText;

        // Acciones logic
        const accionesCell = row.insertCell(8);
        accionesCell.innerHTML = `<div class="action-buttons">
                                    <button class="nav-btn view-order-btn" data-order-id="${order.id}"><i class="fas fa-info-circle" style="color: #d8a7b1; font-size: 0.7em;"></i></button>
                                    <button class="nav-btn generate-pdf-btn" data-order-id="${order.id}"><i class="fas fa-file-pdf" style="color: #d8a7b1; font-size: 0.7em;"></i></button>
                                  </div>`;
    });
}

function loadOrderDetails() {
    // Placeholder para funcionalidad futura
}

document.getElementById('ordersTableBody').addEventListener('click', async (event) => {
    if (event.target.closest('.generate-pdf-btn')) {
        const button = event.target.closest('.generate-pdf-btn');
        const orderId = parseInt(button.dataset.orderId);
        const order = orders.find(o => o.id === orderId);
        if (order) {
            generatePDF(order);
        }
    }
});

function generatePDF(order) {
    const pdfArea = document.createElement('div'); // Create a temporary div for PDF content
    pdfArea.style.display = 'none'; // Hide it
    document.body.appendChild(pdfArea); // Append to body to render HTML correctly

    // --- 1. GATHER DATA FROM ORDER OBJECT ---
    const clientName = order.client_name;
    const clientPhone = order.client_phone || 'No disponible';
    const clientEmail = order.client_email || 'No disponible';
    const orderDate = FormatUtils.formatDateTime(order.order_date);
    const deliveryDate = FormatUtils.formatDateTime(order.delivery_date);
    const deliveryTime = order.delivery_time;
    const isDeliveryEnabled = order.is_delivery_enabled;
    const deliveryAddress = order.delivery_address || '';
    const observations = order.observations ? JSON.parse(order.observations).map(obs => `<li>${obs}</li>`).join('') : '<li>No hay observaciones.</li>';

    let productRows = '';
    if (order.products_json) {
        const products = JSON.parse(order.products_json);
        products.forEach(product => {
            const quantity = product.quantity || 0;
            const description = product.name || '';
            const price = product.price || 0;
            const amount = quantity * price;
            productRows += `
                <tr>
                    <td>${quantity}</td>
                    <td>${description}</td>
                    <td>${FormatUtils.formatPrice(price)}</td>
                    <td>${FormatUtils.formatAmount(amount)}</td>
                </tr>
            `;
        });
    }

    const subtotal = FormatUtils.formatTotal(order.subtotal);
    const shipping = FormatUtils.formatTotal(order.shipping);
    const totalNet = FormatUtils.formatTotal(order.total_net);
    const deposit = FormatUtils.formatTotal(order.deposit);
    const balance = FormatUtils.formatTotal(order.balance);

    const pdfHTML = `
        <div class="pdf-container">
            <div class="pdf-header">
                <img src="static/logo.png" alt="Logo Nataly Antezana" class="pdf-logo-img">
            </div>

            <div class="pdf-section">
                <h3>Datos del Pedido</h3>
                <div class="pdf-grid">
                    <div class="item"><strong>Cliente:</strong> <span>${clientName}</span></div>
                    <div class="item"><strong>Teléfono:</strong> <span>${clientPhone}</span></div>
                    <div class="item"><strong>Email:</strong> <span>${clientEmail}</span></div>
                    <div class="item"><strong>Fecha de Pedido:</strong> <span>${orderDate}</span></div>
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

            <div class="pdf-section pdf-notes-section">
                <p><strong>Observaciones:</strong></p>
                <ul>${observations}</ul>
            </div>

            <div class="pdf-totals">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <strong>${subtotal}</strong>
                </div>
                ${order.is_delivery_enabled ? `
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
        const options = {
            margin: 0,
            filename: `pedido_${clientName.replace(/ /g, '_')}_${order.id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(options).from(element).save().finally(() => {
            document.body.removeChild(pdfArea); // Clean up the temporary div
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        document.body.removeChild(pdfArea); // Clean up even on error
    }
}