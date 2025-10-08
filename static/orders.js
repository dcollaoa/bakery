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
});

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
        currentOrder.clientId = clientSelect.value;
        currentOrder.clientName = clientSelect.options[clientSelect.selectedIndex].text;
        document.getElementById('orderClientName').textContent = currentOrder.clientName;
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
        currentOrder.products = selectedProducts;
        renderOrderSummary();
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
        // Generate a unique ID for this product instance
        const uniqueId = Date.now() + Math.random();
        selectedProducts.push({ ...product, quantity: quantity, observations: [], uniqueId: uniqueId });

        renderSelectedProducts();
        renderProductObservationsUI();
    } else {
        alert('Por favor, selecciona un producto y una cantidad válida.');
    }
});

function renderSelectedProducts() {
    console.log('Rendering selected products. Current selectedProducts:', selectedProducts);
    const productTableBody = document.querySelector('#product-table tbody');
    productTableBody.innerHTML = '';
    let total = 0;

    selectedProducts.forEach((item, index) => {
        console.log('Processing item:', item);
        const row = productTableBody.insertRow();
        row.insertCell(0).textContent = item.name;
        row.insertCell(1).textContent = item.quantity;
        row.insertCell(2).textContent = item.price.toFixed(2);
        const amount = item.quantity * item.price;
        console.log('Item amount:', amount);
        row.insertCell(3).textContent = amount.toFixed(2);
        const actionsCell = row.insertCell(4);
        actionsCell.innerHTML = `<button class="remove-product" data-unique-id="${item.uniqueId}">X</button>`;
        total += amount;
        console.log('Current total:', total);
    });

    document.getElementById('selectedProductsTotal').textContent = total.toLocaleString('es-ES', { maximumFractionDigits: 0 });
    console.log('Final displayed total:', document.getElementById('selectedProductsTotal').textContent);

    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-product').forEach(button => {
        button.addEventListener('click', function() {
            const productUniqueIdToRemove = parseFloat(this.dataset.uniqueId);
            selectedProducts = selectedProducts.filter(item => item.uniqueId !== productUniqueIdToRemove);
            renderSelectedProducts();
            renderProductObservationsUI(); // Re-render observations when products change
        });
    });
}

function renderProductObservationsUI() {
    const productObservationTabsNav = document.getElementById('productObservationTabsNav');
    const productObservationTabsContent = document.getElementById('productObservationTabsContent');

    // Store the ID of the currently active tab
    const activeTabButton = productObservationTabsNav.querySelector('.tab-button.active');
    const previouslyActiveUniqueId = activeTabButton ? parseFloat(activeTabButton.dataset.uniqueId) : null;

    productObservationTabsNav.innerHTML = '';
    productObservationTabsContent.innerHTML = '';

    if (selectedProducts.length === 0) {
        return; // No products, no observations UI
    }

    selectedProducts.forEach((item, index) => {
        // Generate tab button
        const tabButton = document.createElement('button');
        tabButton.type = 'button'; // Prevent form submission
        tabButton.classList.add('tab-button', 'btn', 'btn-secondary', 'btn-sm');
        tabButton.textContent = item.name;
        tabButton.dataset.uniqueId = item.uniqueId;
        productObservationTabsNav.appendChild(tabButton);

        // Generate tab content
        const tabContent = document.createElement('div');
        tabContent.classList.add('tab-content', 'form-group');
        tabContent.dataset.uniqueId = item.uniqueId;
        tabContent.innerHTML = `
            <h4>Observaciones para ${item.name}</h4>
            <ul class="list-group product-observation-list" data-unique-id="${item.uniqueId}">
                ${item.observations.map((obs, obsIndex) => `
                    <li class="list-group-item observation-item" data-obs-index="${obsIndex}">
                        <span class="observation-text">${obs}</span>
                        <div class="observation-actions">
                            <button type="button" class="btn btn-info btn-sm edit-observation-btn" data-unique-id="${item.uniqueId}" data-obs-index="${obsIndex}">Editar</button>
                            <button type="button" class="btn btn-danger btn-sm delete-observation-btn" data-unique-id="${item.uniqueId}" data-obs-index="${obsIndex}">X</button>
                        </div>
                    </li>`).join('')}
            </ul>
            <div class="input-group mb-3">
                <input type="text" class="form-control product-new-observation-input" data-unique-id="${item.uniqueId}" placeholder="Añadir nueva observación...">
                <button class="btn btn-outline-secondary add-product-observation-btn" type="button" data-unique-id="${item.uniqueId}">Añadir</button>
            </div>
        `;
        productObservationTabsContent.appendChild(tabContent);

        // Set active tab (either previously active or first one)
        if (item.uniqueId === previouslyActiveUniqueId || (previouslyActiveUniqueId === null && index === 0)) {
            tabButton.classList.add('active');
            tabContent.classList.add('active');
        }
    });

    // If no tab was active, or the previously active product was removed, activate the first tab
    if (!productObservationTabsNav.querySelector('.tab-button.active') && selectedProducts.length > 0) {
        productObservationTabsNav.querySelector('.tab-button').classList.add('active');
        productObservationTabsContent.querySelector('.tab-content').classList.add('active');
    }

    // Add event listeners for tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            this.classList.add('active');
            const targetUniqueId = parseFloat(this.dataset.uniqueId);
            document.querySelector(`.tab-content[data-unique-id="${targetUniqueId}"]`).classList.add('active');
        });
    });

    // Add event listeners for adding new observations
    document.querySelectorAll('.add-product-observation-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productUniqueId = parseFloat(this.dataset.uniqueId);
            const inputField = document.querySelector(`.product-new-observation-input[data-unique-id="${productUniqueId}"]`);
            const newObservation = inputField.value.trim();

            if (newObservation) {
                const productIndex = selectedProducts.findIndex(item => item.uniqueId === productUniqueId);
                if (productIndex > -1) {
                    selectedProducts[productIndex].observations.push(newObservation);
                    inputField.value = ''; // Clear input field
                    renderProductObservationsUI(); // Re-render to show new observation
                }
            }
        });
    });

    // Add event listeners for deleting observations
    document.querySelectorAll('.delete-observation-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productUniqueId = parseFloat(this.dataset.uniqueId);
            const obsIndex = parseInt(this.dataset.obsIndex);
            const productIndex = selectedProducts.findIndex(item => item.uniqueId === productUniqueId);

            if (productIndex > -1 && selectedProducts[productIndex].observations[obsIndex] !== undefined) {
                selectedProducts[productIndex].observations.splice(obsIndex, 1);
                renderProductObservationsUI(); // Re-render to update observations list
            }
        });
    });

    // Add event listeners for editing observations
    document.querySelectorAll('.edit-observation-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productUniqueId = parseFloat(this.dataset.uniqueId);
            const obsIndex = parseInt(this.dataset.obsIndex);
            const productIndex = selectedProducts.findIndex(item => item.uniqueId === productUniqueId);

            if (productIndex > -1) {
                const listItem = this.closest('.observation-item');
                const observationTextSpan = listItem.querySelector('.observation-text');
                const currentText = observationTextSpan.textContent;

                // Hide text and edit button
                observationTextSpan.style.display = 'none';
                this.style.display = 'none';

                // Create input field
                const inputField = document.createElement('input');
                inputField.type = 'text';
                inputField.classList.add('form-control', 'edit-observation-input');
                inputField.value = currentText;
                listItem.prepend(inputField);

                // Create save button
                const saveButton = document.createElement('button');
                saveButton.type = 'button';
                saveButton.classList.add('btn', 'btn-success', 'btn-sm', 'save-observation-btn');
                saveButton.textContent = 'Guardar';
                listItem.querySelector('.observation-actions').prepend(saveButton);

                inputField.focus();

                const saveChanges = () => {
                    const newText = inputField.value.trim();
                    if (newText) {
                        selectedProducts[productIndex].observations[obsIndex] = newText;
                    }
                    renderProductObservationsUI(); // Re-render to update observations list
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

document.getElementById('confirmOrder').addEventListener('click', function() {
    fetch('/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentOrder),
    })
    .then(response => response.json())
    .then(data => {
        alert('Pedido realizado con éxito!');
        resetOrderForm();
        loadOrders();
    })
    .catch(error => console.error('Error al realizar el pedido:', error));
});

function renderOrderSummary() {
    const orderSummaryList = document.getElementById('orderSummaryList');
    orderSummaryList.innerHTML = '';
    let total = 0;
    currentOrder.products.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.name} - ${item.quantity} x $${item.price.toFixed(2)}`;
        orderSummaryList.appendChild(li);
        total += item.quantity * item.price;
    });
    document.getElementById('orderSummaryTotal').textContent = total.toLocaleString('es-ES', { maximumFractionDigits: 0 });
}

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

function renderOrdersTable() {
    const ordersTableBody = document.getElementById('ordersTableBody');
    ordersTableBody.innerHTML = '';
    orders.forEach(order => {
        const row = ordersTableBody.insertRow();
        row.insertCell(0).textContent = order.id;
        row.insertCell(1).textContent = order.clientName;
        row.insertCell(2).textContent = `${order.date} ${order.time}`;
        const productsCell = row.insertCell(3);
        let productsHtml = '<ul>';
        order.products.forEach(p => {
            productsHtml += `<li>${p.name} (${p.quantity} x $${p.price.toFixed(2)})</li>`;
        });
        productsHtml += '</ul>';
        productsCell.innerHTML = productsHtml;
        row.insertCell(4).textContent = `$${calculateOrderTotal(order.products).toLocaleString('es-ES', { maximumFractionDigits: 0 })}`;
    });
}

function calculateOrderTotal(products) {
    return products.reduce((sum, item) => sum + (item.quantity * item.price), 0);
}

function loadOrderDetails() {
    // This function might be used for editing existing orders,
    // but for now, it's a placeholder or can be integrated later.
    // No specific implementation needed for the current "add product" fix.
}