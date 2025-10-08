document.addEventListener('DOMContentLoaded', () => {
    const clientForm = document.getElementById('client-form');
    const clientIdInput = document.getElementById('client-id');
    const clientNameInput = document.getElementById('client-name');
    const clientPhoneInput = document.getElementById('client-phone');
    const clientEmailInput = document.getElementById('client-email');
    const clientListTableBody = document.querySelector('#client-list-table tbody');
    const saveClientBtn = document.getElementById('save-client-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    let editingClientId = null;

    // Function to fetch and display clients
    async function fetchClients() {
        const response = await fetch('/api/clients');
        const clients = await response.json();
        clientListTableBody.innerHTML = ''; // Clear existing rows
        clients.forEach(client => {
            const row = clientListTableBody.insertRow();
            row.innerHTML = `
                <td>${client.id}</td>
                <td>${client.name}</td>
                <td>${client.phone || '-'}</td>
                <td>${client.email || '-'}</td>
                <td>
                    <button type="button" class="action-btn edit-btn" data-id="${client.id}"><i class="fas fa-edit"></i></button>
                    <button type="button" class="action-btn delete-btn" data-id="${client.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
        });
    }

    // Function to handle form submission (Add/Update)
    clientForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = clientNameInput.value.trim();
        const phone = clientPhoneInput.value.trim();
        const email = clientEmailInput.value.trim();

        if (!name) {
            alert('Por favor, introduce el nombre del cliente.');
            return;
        }

        const clientData = { name, phone, email };
        let response;

        if (editingClientId) {
            // Update existing client
            response = await fetch(`/api/clients/${editingClientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });
        } else {
            // Add new client
            response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });
        }

        if (response.ok) {
            clientForm.reset();
            editingClientId = null;
            saveClientBtn.textContent = 'Guardar Cliente';
            cancelEditBtn.style.display = 'none';
            fetchClients(); // Refresh the list
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.error || response.statusText}`);
        }
    });

    // Handle Edit and Delete buttons
    clientListTableBody.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (editBtn) {
            const id = editBtn.dataset.id;
            const response = await fetch('/api/clients'); // Fetch all to find the one to edit
            const clients = await response.json();
            const clientToEdit = clients.find(c => c.id == id);

            if (clientToEdit) {
                clientNameInput.value = clientToEdit.name;
                clientPhoneInput.value = clientToEdit.phone;
                clientEmailInput.value = clientToEdit.email;
                editingClientId = clientToEdit.id;
                saveClientBtn.textContent = 'Actualizar Cliente';
                cancelEditBtn.style.display = 'inline-block';
            }
        } else if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
                const response = await fetch(`/api/clients/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    fetchClients(); // Refresh the list
                } else {
                    const errorData = await response.json();
                    alert(`Error: ${errorData.error || response.statusText}`);
                }
            }
        }
    });

    // Cancel Edit button functionality
    cancelEditBtn.addEventListener('click', () => {
        clientForm.reset();
        editingClientId = null;
        saveClientBtn.textContent = 'Guardar Cliente';
        cancelEditBtn.style.display = 'none';
    });

    // Initial fetch of clients when the page loads
    fetchClients();
});
