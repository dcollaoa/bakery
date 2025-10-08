/**
 * Productos.js - Gestión de Productos REFACTORIZADO
 * Ahora usa FormatUtils para formateo consistente de precios
 * @version 2.0.0
 */

document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('product-form');
    const productIdInput = document.getElementById('product-id');
    const productNameInput = document.getElementById('product-name');
    const productPriceInput = document.getElementById('product-price');
    const productListTableBody = document.querySelector('#product-list-table tbody');
    const saveProductBtn = document.getElementById('save-product-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    let editingProductId = null;

    /**
     * ✅ FUNCIÓN REFACTORIZADA - Ahora usa FormatUtils
     * Obtiene y muestra los productos con formato correcto
     */
    async function fetchProducts() {
        const response = await fetch('/api/products');
        const products = await response.json();
        productListTableBody.innerHTML = '';
        
        products.forEach(product => {
            const row = productListTableBody.insertRow();
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${FormatUtils.formatPrice(product.price)}</td>
                <td>
                    <button type="button" class="action-btn edit-btn" data-id="${product.id}"><i class="fas fa-edit"></i></button>
                    <button type="button" class="action-btn delete-btn" data-id="${product.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
        });
    }

    // Manejo del formulario (Agregar/Actualizar)
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = productNameInput.value.trim();
        const price = parseFloat(productPriceInput.value);

        if (!name || isNaN(price) || price < 0) {
            alert('Por favor, introduce un nombre y un precio válido.');
            return;
        }

        const productData = { name, price };
        let response;

        if (editingProductId) {
            // Actualizar producto existente
            response = await fetch(`/api/products/${editingProductId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        } else {
            // Agregar nuevo producto
            response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        }

        if (response.ok) {
            productForm.reset();
            editingProductId = null;
            saveProductBtn.textContent = 'Guardar Producto';
            cancelEditBtn.style.display = 'none';
            fetchProducts();
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.error || response.statusText}`);
        }
    });

    // Manejo de botones Editar y Eliminar
    productListTableBody.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (editBtn) {
            const id = editBtn.dataset.id;
            const response = await fetch(`/api/products`);
            const products = await response.json();
            const productToEdit = products.find(p => p.id == id);

            if (productToEdit) {
                productNameInput.value = productToEdit.name;
                productPriceInput.value = productToEdit.price;
                editingProductId = productToEdit.id;
                saveProductBtn.textContent = 'Actualizar Producto';
                cancelEditBtn.style.display = 'inline-block';
            }
        } else if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
                const response = await fetch(`/api/products/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    fetchProducts();
                } else {
                    const errorData = await response.json();
                    alert(`Error: ${errorData.error || response.statusText}`);
                }
            }
        }
    });

    // Funcionalidad del botón Cancelar Edición
    cancelEditBtn.addEventListener('click', () => {
        productForm.reset();
        editingProductId = null;
        saveProductBtn.textContent = 'Guardar Producto';
        cancelEditBtn.style.display = 'none';
    });

    // Cargar productos al iniciar
    fetchProducts();
});