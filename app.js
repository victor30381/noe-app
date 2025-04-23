// app.js - Lógica para Bella Indumentaria Femenina

// --- Funcionalidad del Menú Hamburguesa ---
document.addEventListener('DOMContentLoaded', function() {
    // No inicializar el menú hamburguesa en la página index
    if (document.getElementById('page-index')) {
        console.log('Página index detectada, no se inicializa el menú hamburguesa');
        return;
    }
    
    // Elementos del menú
    const menuButton = document.querySelector('.mobile-menu-button');
    const closeButton = document.querySelector('.close-menu');
    const sideMenu = document.querySelector('.side-menu');
    const menuOverlay = document.querySelector('.menu-overlay');
    
    // Verificar que los elementos existen antes de continuar
    if (!menuButton || !closeButton || !sideMenu || !menuOverlay) {
        console.log('Elementos del menú no encontrados');
        return;
    }
    
    // Función para abrir el menú
    function openMenu() {
        sideMenu.classList.remove('translate-x-full');
        menuOverlay.classList.remove('hidden');
        // Añadir un pequeño retraso para que la transición de opacidad funcione correctamente
        setTimeout(() => {
            menuOverlay.classList.add('opacity-100');
        }, 10);
    }
    
    // Función para cerrar el menú
    function closeMenu() {
        sideMenu.classList.add('translate-x-full');
        menuOverlay.classList.remove('opacity-100');
        // Añadir un pequeño retraso para que la transición de opacidad funcione correctamente
        setTimeout(() => {
            menuOverlay.classList.add('hidden');
        }, 300);
    }
    
    // Event listeners
    if (menuButton) {
        menuButton.addEventListener('click', openMenu);
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', closeMenu);
    }
    
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }
    
    // Cerrar el menú cuando se hace clic en un enlace
    const menuLinks = document.querySelectorAll('.side-menu a');
    menuLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
});

// --- Constantes Globales ---
const STOCK_STORAGE_KEY = 'bella_stock';
const CLIENTS_STORAGE_KEY = 'bella_clients';
const SALES_STORAGE_KEY = 'bella_sales';
const NEXT_CLIENT_ID_KEY = 'bella_nextClientId';

// --- Funciones de Utilidad Comunes ---

/**
 * Muestra un mensaje de feedback al usuario en un área designada.
 * @param {string} text - El texto del mensaje.
 * @param {string} type - 'success', 'error' o 'info'.
 * @param {string} areaId - El ID del elemento contenedor del mensaje (default: 'messageArea').
 */
function showMessage(text, type = 'success', areaId = 'messageArea') {
    const area = document.getElementById(areaId);
    if (area) {
        area.innerHTML = `
            <div class="message ${type === 'success' ? 'message-success' : 'message-error'}">
                ${text}
            </div>
        `;
        setTimeout(() => {
            area.innerHTML = '';
        }, 3000);
    }
}

/**
 * Formatea un número como moneda (ARS - Peso Argentino).
 * @param {number | string} number - El número a formatear.
 * @returns {string} - El número formateado como moneda.
 */
function formatCurrency(number) {
    const num = Number(number); // Ya no multiplicamos por 1000 aquí
    if (isNaN(num)) {
        return new Intl.NumberFormat('es-AR', { 
            style: 'currency', 
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(0);
    }
    return new Intl.NumberFormat('es-AR', { 
        style: 'currency', 
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

/**
 * Formatea una fecha ISO string a un formato legible (DD/MM/AAAA HH:MM).
 * @param {string} isoString - La fecha en formato ISO.
 * @returns {string} - La fecha formateada o 'Fecha inválida'.
 */
function formatDate(isoString) {
    if (!isoString) return 'Fecha inválida';
    try {
        const date = new Date(isoString);
        // Opciones para formato más legible
        const options = {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false // Formato 24hs
        };
        // Intl.DateTimeFormat es más robusto que toLocaleString para consistencia
        return new Intl.DateTimeFormat('es-AR', options).format(date).replace(',', ''); // Formato DD/MM/AAAA HH:MM
    } catch (e) {
        console.error("Error formatting date:", isoString, e);
        return 'Fecha inválida';
    }
}

// --- Funciones de Datos (localStorage) ---

function getStorageData(key) {
    const data = localStorage.getItem(key);
    try {
        return data ? JSON.parse(data) : (key === NEXT_CLIENT_ID_KEY ? 1 : []); // Default a 1 para ID, array vacío para otros
    } catch (e) {
        console.error(`Error parsing data from localStorage (key: ${key}):`, e);
        showMessage(`Error al cargar datos (${key}). Se usarán datos vacíos.`, "error");
        return (key === NEXT_CLIENT_ID_KEY ? 1 : []); // Retorna default seguro en caso de error
    }
}

function saveStorageData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Error saving data to localStorage (key: ${key}):`, e);
        showMessage(`Error al guardar los datos (${key}).`, "error");
    }
}

function getStockData() {
    try {
        const data = localStorage.getItem(STOCK_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error al leer datos de stock:', error);
        localStorage.removeItem(STOCK_STORAGE_KEY);
        return [];
    }
}

function saveStockData(data) {
    try {
        localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error al guardar datos de stock:', error);
        showMessage('Error al guardar los datos', 'error');
    }
}

function getClientsData() {
    try {
        const data = localStorage.getItem(CLIENTS_STORAGE_KEY);
        if (!data) {
            console.log('No hay datos de clientes en localStorage');
            return [];
        }
        const parsedData = JSON.parse(data);
        if (!Array.isArray(parsedData)) {
            console.error('Los datos de clientes no son un array válido');
            return [];
        }
        return parsedData;
    } catch (error) {
        console.error('Error al leer datos de clientes:', error);
        localStorage.removeItem(CLIENTS_STORAGE_KEY);
        return [];
    }
}

function saveClientsData(data) {
    try {
        if (!Array.isArray(data)) {
            console.error('Los datos a guardar no son un array válido');
            return;
        }
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error al guardar datos de clientes:', error);
        showMessage('Error al guardar los datos de clientes', 'error');
    }
}

function getSalesData() {
    try {
        const data = localStorage.getItem(SALES_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error al leer datos de ventas:', error);
        localStorage.removeItem(SALES_STORAGE_KEY);
        return [];
    }
}

function saveSalesData(data) {
    try {
        localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error al guardar datos de ventas:', error);
        showMessage('Error al guardar los datos', 'error');
    }
}

function getNextClientId() {
    let nextId = getStorageData(NEXT_CLIENT_ID_KEY);
    if (typeof nextId !== 'number' || nextId < 1) {
        nextId = 1; // Resetear si no es válido
    }
    saveStorageData(NEXT_CLIENT_ID_KEY, nextId + 1);
    return nextId;
}


// ==========================================================================
// --- LÓGICA ESPECÍFICA DE LA PÁGINA DE STOCK (stock.html) ---
// ==========================================================================

function initStockPage() {
    console.log("Initializing Stock Page...");
    const addItemForm = document.getElementById('addItemForm');
    const stockTableBody = document.getElementById('stockTableBody');

    if (!addItemForm || !stockTableBody) {
        console.error("Stock page elements not found!");
        return;
    }

    /** Renderiza la tabla de stock completa. */
    function renderStockTable() {
        const stockTableBody = document.getElementById('stockTableBody');
        stockTableBody.innerHTML = '';

        const stockData = getStockData();
        if (stockData.length === 0) {
            stockTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-gray-500" role="alert">
                        No hay productos en el stock. Agrega uno nuevo.
                    </td>
                </tr>
            `;
            return;
        }

        // Ordenar stock por nombre de producto
        stockData.sort((a, b) => a.name.localeCompare(b.name));

        stockData.forEach(item => {
            const row = document.createElement('tr');
            row.classList.add('hover:bg-gray-50');

            // Celda Nombre
            const nameCell = document.createElement('td');
            nameCell.className = 'px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900';
            nameCell.textContent = item.name;
            nameCell.setAttribute('role', 'cell');
            row.appendChild(nameCell);

            // Celda Precio de Costo
            const costPriceCell = document.createElement('td');
            costPriceCell.className = 'px-4 py-3 whitespace-nowrap text-sm text-gray-500';
            costPriceCell.textContent = formatCurrency(item.costPrice || 0);
            costPriceCell.setAttribute('role', 'cell');
            row.appendChild(costPriceCell);

            // Celda Precio de Venta
            const priceCell = document.createElement('td');
            priceCell.className = 'px-4 py-3 whitespace-nowrap text-sm text-gray-500';
            priceCell.textContent = formatCurrency(item.price || 0);
            priceCell.setAttribute('role', 'cell');
            row.appendChild(priceCell);

            // Celda Cantidad
            const quantityCell = document.createElement('td');
            quantityCell.className = 'px-4 py-3 whitespace-nowrap text-sm text-gray-500';
            quantityCell.textContent = item.quantity || 0;
            quantityCell.setAttribute('role', 'cell');
            row.appendChild(quantityCell);

            // Celda Acciones
            const actionsCell = document.createElement('td');
            actionsCell.className = 'px-4 py-3 text-center whitespace-nowrap text-sm font-medium flex justify-center space-x-6';
            actionsCell.setAttribute('role', 'cell');
            
            // Botón de editar (lápiz fucsia)
            const editButton = document.createElement('button');
            editButton.className = 'text-brand-fuchsia hover:text-brand-fuchsia-dark editItemBtn';
            editButton.dataset.itemName = item.name;
            editButton.innerHTML = '<i class="fas fa-pencil-alt" aria-hidden="true"></i>';
            editButton.setAttribute('aria-label', `Editar ${item.name}`);
            editButton.title = 'Editar producto';
            actionsCell.appendChild(editButton);
            
            // Botón de eliminar (basura roja)
            const deleteButton = document.createElement('button');
            deleteButton.className = 'text-red-600 hover:text-red-800 deleteItemBtn';
            deleteButton.dataset.itemName = item.name;
            deleteButton.innerHTML = '<i class="fas fa-trash-alt" aria-hidden="true"></i>';
            deleteButton.setAttribute('aria-label', `Eliminar ${item.name}`);
            deleteButton.title = 'Eliminar producto';
            actionsCell.appendChild(deleteButton);
            
            row.appendChild(actionsCell);

            stockTableBody.appendChild(row);
        });
    }

    /** Maneja el envío del formulario para agregar un nuevo producto. */
    function handleAddItem(event) {
        event.preventDefault();
        const itemNameInput = document.getElementById('itemName');
        const itemCostPriceInput = document.getElementById('itemCostPrice');
        const itemPriceInput = document.getElementById('itemPrice');
        const itemQuantityInput = document.getElementById('itemQuantity');
        const name = itemNameInput.value.trim();
        const costPrice = parseFloat(itemCostPriceInput.value); // Ya no dividimos por 1000
        const price = parseFloat(itemPriceInput.value); // Ya no dividimos por 1000
        const quantity = parseInt(itemQuantityInput.value) || 0;

        // Validaciones
        if (!name) {
            showMessage("El nombre del producto no puede estar vacío.", "error");
            itemNameInput.focus(); return;
        }
        if (isNaN(costPrice) || costPrice < 0) {
            showMessage("Ingresa un precio de costo válido (mayor o igual a 0).", "error");
            itemCostPriceInput.focus(); return;
        }
        if (isNaN(price) || price < 0) {
            showMessage("Ingresa un precio de venta válido (mayor o igual a 0).", "error");
            itemPriceInput.focus(); return;
        }

        const stockData = getStockData();
        const existingItem = stockData.find(item => item.name.toLowerCase() === name.toLowerCase());
        if (existingItem) {
            showMessage(`El producto "${name}" ya existe en el stock.`, "error"); return;
        }

        // Generar un color aleatorio en formato HSL para asegurar colores distintos y agradables
        const hue = Math.floor(Math.random() * 360); // Tono aleatorio
        const color = `hsl(${hue}, 70%, 65%)`; // Saturación y luminosidad fijas para colores agradables

        // Crear nuevo item con color
        const newItem = {
            name: name,
            costPrice: costPrice,
            price: price,
            color: color,
            quantity: quantity
        };

        stockData.push(newItem);
        saveStockData(stockData);

        itemNameInput.value = '';
        itemCostPriceInput.value = '';
        itemPriceInput.value = '';
        itemQuantityInput.value = '';
        renderStockTable();
        showMessage(`Producto "${name}" agregado correctamente.`, "success");
        itemNameInput.focus();
    }

    /** Abre el modal de edición de stock y carga los datos del item seleccionado. */
    function setupEditStockModal(itemName) {
        const stockData = getStockData();
        const item = stockData.find(item => item.name === itemName);
        
        if (!item) {
            showMessage(`No se encontró la prenda "${itemName}".`, "error");
            return;
        }
        
        // Llenar el formulario con los datos del item
        document.getElementById('editItemName').textContent = item.name;
        document.getElementById('editItemCostPrice').value = item.costPrice || 0;
        document.getElementById('editItemPrice').value = item.price || 0;
        document.getElementById('editItemQuantity').value = item.quantity || 0;
        
        // Guardar el nombre del item en el formulario para referencia
        document.getElementById('editStockForm').dataset.itemName = item.name;
        
        // Abrir el modal
        openModal('editStockModal');
    }
    
    /** Maneja el envío del formulario de edición de stock. */
    function handleEditStockSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const itemName = form.dataset.itemName;
        
        // Obtener valores del formulario
        const costPrice = parseFloat(document.getElementById('editItemCostPrice').value);
        const price = parseFloat(document.getElementById('editItemPrice').value);
        
        // Obtener valor de cantidad
        const quantity = parseInt(document.getElementById('editItemQuantity').value) || 0;
        
        // Validaciones
        if (isNaN(costPrice) || costPrice < 0) {
            showMessage("Ingresa un precio de costo válido (mayor o igual a 0).", "error");
            return;
        }
        if (isNaN(price) || price < 0) {
            showMessage("Ingresa un precio de venta válido (mayor o igual a 0).", "error");
            return;
        }
        
        // Actualizar datos en el almacenamiento
        const stockData = getStockData();
        const itemIndex = stockData.findIndex(item => item.name === itemName);
        
        if (itemIndex === -1) {
            showMessage(`No se encontró la prenda "${itemName}".`, "error");
            return;
        }
        
        // Actualizar el objeto del item
        stockData[itemIndex].costPrice = costPrice;
        stockData[itemIndex].price = price;
        stockData[itemIndex].quantity = quantity;
        
        // Guardar los cambios
        saveStockData(stockData);
        
        // Cerrar el modal y actualizar la tabla
        closeModal('editStockModal');
        renderStockTable();
        
        showMessage(`Producto "${itemName}" actualizado correctamente.`, "success");
    }

    /** Maneja el cambio en un input de cantidad de stock. */
    function handleQuantityChange(event) {
        const input = event.target;
        if (!input.classList.contains('stock-quantity-input') || !input.closest('#stockTableBody')) {
            return;
        }

        const itemName = input.dataset.itemName;
        const size = input.dataset.size;
        let newQuantity = parseInt(input.value, 10);

        // Validación: asegurar que sea un número no negativo
        if (isNaN(newQuantity) || newQuantity < 0) {
            showMessage("La cantidad debe ser un número mayor o igual a 0.", "error");
            const stockData = getStockData();
            const item = stockData.find(i => i.name === itemName);
            input.value = item?.sizes?.[size] || 0;
            return;
        }

        // Actualizar los datos
        const stockData = getStockData();
        const itemIndex = stockData.findIndex(item => item.name === itemName);
        
        if (itemIndex > -1) {
            stockData[itemIndex].sizes[size] = newQuantity;
            saveStockData(stockData);
        }
    }

    /** Maneja el clic en un botón de eliminar prenda. */
    function handleDeleteItem(itemName) {
        if (!itemName) {
            console.error('No se proporcionó un nombre de prenda para eliminar');
            return;
        }

        if (confirm(`¿Estás seguro de que quieres eliminar la prenda "${itemName}"? Esta acción no se puede deshacer.`)) {
            let stockData = getStockData();
            stockData = stockData.filter(item => item.name !== itemName);
            saveStockData(stockData);
            renderStockTable();
            showMessage(`Prenda "${itemName}" eliminada correctamente.`, "success");
        }
    }

    // --- Inicialización y Asignación de Eventos para Stock ---
    addItemForm.addEventListener('submit', handleAddItem);
    
    // Configurar el formulario de edición
    const editStockForm = document.getElementById('editStockForm');
    if (editStockForm) {
        editStockForm.addEventListener('submit', handleEditStockSubmit);
    }

    // Configurar botón de cancelar edición
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            closeModal('editStockModal');
        });
    }

    // Configurar cierre del modal con el botón X
    const closeModalBtn = document.querySelector('#editStockModal .modal-close-btn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            closeModal('editStockModal');
        });
    }

    // Event delegation para botones de eliminar, editar y cambios en inputs
    document.addEventListener('click', function(event) {
        // Botón eliminar
        if (event.target.closest('.deleteItemBtn')) {
            const button = event.target.closest('.deleteItemBtn');
            const itemName = button.dataset.itemName;
            handleDeleteItem(itemName);
        }
        
        // Botón editar
        if (event.target.closest('.editItemBtn')) {
            const button = event.target.closest('.editItemBtn');
            const itemName = button.dataset.itemName;
            setupEditStockModal(itemName);
        }
    });

    document.addEventListener('change', function(event) {
        handleQuantityChange(event);
    });

    // Renderizar tabla inicial
    renderStockTable();
}


// ==========================================================================
// --- LÓGICA ESPECÍFICA DE LA PÁGINA DE CLIENTES (clientes.html) ---
// ==========================================================================

/** Renderiza la tabla de clientes. */
function renderClientsTable() {
    const clientsTableBody = document.getElementById('clientsTableBody');
    if (!clientsTableBody) {
        console.error('No se encontró el elemento clientsTableBody');
        return;
    }

    const clients = getClientsData();
    clientsTableBody.innerHTML = '';

    if (clients.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="4" class="text-center py-4 text-gray-500" role="alert">
                No hay clientes registrados
            </td>
        `;
        clientsTableBody.appendChild(emptyRow);
        return;
    }

    // Ordenar clientes por nombre
    clients.sort((a, b) => a.name.localeCompare(b.name));

    clients.forEach(client => {
        const row = document.createElement('tr');
        
        // Verificar si el cliente tiene pruebas registradas
        const hasTrials = client.movements && client.movements.some(movement => movement.type === 'prueba');
        
        row.innerHTML = `
            <td class="px-4 py-2">${client.name}</td>
            <td class="px-4 py-2">
                <span class="text-red-600 font-semibold">${formatCurrency(client.debt || 0)}</span>
            </td>
            <td class="px-4 py-2 text-center">
                <button class="action-btn text-green-600 hover:text-green-800 mx-1" 
                        data-client-id="${client.id}" 
                        data-action="purchase"
                        title="Agregar compra">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="action-btn text-blue-600 hover:text-blue-800 mx-1" 
                        data-client-id="${client.id}" 
                        data-action="movements"
                        title="Ver movimientos">
                    <i class="fas fa-eye"></i>
                </button>
                ${hasTrials ? `
                <button class="action-btn text-yellow-500 hover:text-yellow-700 mx-1" 
                        data-client-id="${client.id}" 
                        data-action="trials"
                        title="Ver pruebas">
                    <i class="fas fa-exclamation-triangle"></i>
                </button>
                ` : ''}
                <button class="action-btn text-red-600 hover:text-red-800 mx-1" 
                        data-client-id="${client.id}" 
                        data-action="delete"
                        title="Eliminar cliente">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        clientsTableBody.appendChild(row);
    });
}

/** Inicializa la página de clientes. */
function initClientsPage() {
    console.log('Inicializando página de clientes...');
    const clientsTableBody = document.getElementById('clientsTableBody');
    if (!clientsTableBody) {
        console.error('No se encontró el elemento clientsTableBody');
        return;
    }

    // Renderizar tabla inicial
    renderClientsTable();

    // Agregar cliente
    const addClientForm = document.getElementById('addClientForm');
    if (addClientForm) {
        addClientForm.addEventListener('submit', handleAddClient);
    }

    // Manejar acciones de clientes
    clientsTableBody.addEventListener('click', (event) => {
        const button = event.target.closest('.action-btn');
        if (!button) return;

        const clientId = parseInt(button.dataset.clientId, 10);
        const action = button.dataset.action;

        switch (action) {
            case 'purchase':
                document.getElementById('registerClientName').textContent = button.closest('tr').querySelector('td:first-child').textContent;
                document.getElementById('registerPurchaseBtn').dataset.clientId = clientId;
                document.getElementById('registerPaymentBtn').dataset.clientId = clientId;
                openModal('registerOptionsModal');
                break;
            case 'movements':
                setupMovementsModal(clientId);
                break;
            case 'trials':
                setupTrialsModal(clientId);
                break;
            case 'delete':
                handleDeleteClient(clientId);
                break;
        }
    });

    // Manejar botones del modal de compra
    const fullPaymentBtn = document.getElementById('fullPaymentBtn');
    const partialPaymentBtn = document.getElementById('partialPaymentBtn');
    const noPaymentBtn = document.getElementById('noPaymentBtn');
    const registerPartialPaymentBtn = document.getElementById('registerPartialPaymentBtn');

    if (fullPaymentBtn) fullPaymentBtn.addEventListener('click', handleFullPayment);
    if (partialPaymentBtn) partialPaymentBtn.addEventListener('click', handlePartialPayment);
    if (noPaymentBtn) noPaymentBtn.addEventListener('click', handleNoPayment);
    if (registerPartialPaymentBtn) registerPartialPaymentBtn.addEventListener('click', handlePartialPayment);

    // Manejar formulario de pago
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }

    // Manejar botones de registro
    const registerPurchaseBtn = document.getElementById('registerPurchaseBtn');
    const registerPaymentBtn = document.getElementById('registerPaymentBtn');

    if (registerPurchaseBtn) {
        registerPurchaseBtn.addEventListener('click', () => {
            const clientId = registerPurchaseBtn.dataset.clientId;
            closeModal('registerOptionsModal');
            setupPurchaseModal(clientId);
        });
    }
    if (registerPaymentBtn) {
        registerPaymentBtn.addEventListener('click', () => {
            const clientId = registerPaymentBtn.dataset.clientId;
            closeModal('registerOptionsModal');
            setupPaymentModal(clientId);
        });
    }

    // El formulario de prueba ha sido eliminado

    // Manejar cierre de modales
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });

    // Cerrar modal al hacer clic fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// --- Funciones de Utilidad ---
function openModal(modalId) {
    console.log('Abriendo modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    } else {
        console.error('Modal no encontrado:', modalId);
    }
}

function closeModal(modalId) {
    console.log('Cerrando modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = ''; // Restaurar scroll del body
        // Limpiar mensajes de error específicos del modal
        const modalMessageAreaId = `${modalId.replace('Modal','')}MessageArea`;
        const modalMessageArea = document.getElementById(modalMessageAreaId);
        if (modalMessageArea) modalMessageArea.innerHTML = '';

        // Resetear formularios
        if (modalId === 'purchaseModal') {
            document.getElementById('purchaseForm')?.reset();
            const purchaseSizeSelect = document.getElementById('purchaseSizeSelect');
            if (purchaseSizeSelect) {
                purchaseSizeSelect.innerHTML = '<option value="">-- Selecciona un talle --</option>';
                purchaseSizeSelect.disabled = true;
            }
            document.getElementById('purchaseItemPrice').textContent = '--';
            document.getElementById('purchaseAvailableStock').textContent = '--';
            document.getElementById('purchaseTotal').textContent = '--';
            document.getElementById('partialPaymentContainer').classList.add('hidden');
            document.getElementById('partialPaymentAmount').value = '';
        } else if (modalId === 'paymentModal') {
            document.getElementById('paymentForm')?.reset();
        }
    }
}

// --- Funciones de Manejo de Clientes ---
function handleAddClient(event) {
    event.preventDefault();
    const clientNameInput = document.getElementById('clientName');
    const name = clientNameInput.value.trim();

    if (!name) {
        showMessage("El nombre de la clienta no puede estar vacío.", "error");
        clientNameInput.focus();
        return;
    }

    const clientsData = getClientsData();
    const existingClient = clientsData.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existingClient) {
        showMessage(`La clienta "${name}" ya existe.`, "error");
        return;
    }

    const newClient = {
        id: getNextClientId(),
        name: name,
        debt: 0,
        movements: []
    };
    clientsData.push(newClient);
    saveClientsData(clientsData);
    renderClientsTable();
    showMessage(`Clienta "${name}" agregada correctamente.`, "success");
    clientNameInput.value = '';
}

function handleDeleteClient(clientId) {
    console.log('Intentando eliminar cliente con ID:', clientId);
    
    // Obtener datos actuales
    const clients = getClientsData();
    const client = clients.find(c => c.id === clientId);
    
    if (!client) {
        showMessage('Error: No se encontró el cliente a eliminar', 'error');
        return;
    }

    // Confirmar eliminación
    if (!confirm(`¿Estás segura de que deseas eliminar a la clienta "${client.name}"? Esta acción no se puede deshacer.`)) {
        return;
    }

    // Verificar si la cliente tiene deuda pendiente
    if (client.debt > 0) {
        if (!confirm(`La clienta "${client.name}" tiene una deuda pendiente de ${formatCurrency(client.debt)}. ¿Estás segura de que deseas eliminarla?`)) {
            return;
        }
    }

    // Eliminar cliente
    const updatedClients = clients.filter(c => c.id !== clientId);
    saveClientsData(updatedClients);
    
    // Actualizar la tabla
    renderClientsTable();
    
    showMessage(`La clienta "${client.name}" ha sido eliminada correctamente.`, 'success');
}

// --- Funciones de Modal de Compra ---
function handleFullPayment() {
    const clientId = parseInt(document.getElementById('purchaseClientId').value, 10);
    const itemName = document.getElementById('purchaseItemSelect').value;
    const quantity = parseInt(document.getElementById('purchaseQuantity').value) || 1;
    const date = document.getElementById('purchaseDate').value;
    
    // Obtener el precio unitario del item seleccionado
    const selectedOption = document.getElementById('purchaseItemSelect').options[document.getElementById('purchaseItemSelect').selectedIndex];
    const unitPrice = parseFloat(selectedOption.dataset.price);
    const total = unitPrice * quantity;

    if (!clientId || !itemName || !date) {
        showMessage("Completa todos los campos requeridos.", "error", "purchaseMessageArea");
        return;
    }

    let stockData = getStockData();
    let clientsData = getClientsData();
    const itemIndex = stockData.findIndex(item => item.name === itemName);
    const clientIndex = clientsData.findIndex(c => c.id === clientId);

    if (itemIndex === -1 || clientIndex === -1) {
        showMessage("Error: No se encontró el producto o la clienta.", "error", "purchaseMessageArea");
        return;
    }

    const item = stockData[itemIndex];
    const currentStock = item.quantity || 0;

    // Verificar si esta compra viene de una prueba
    const isFromTrial = document.getElementById('isFromTrial')?.value === 'true';

    // Solo verificar stock si no viene de una prueba
    if (!isFromTrial && currentStock < quantity) {
        showMessage(`No hay suficiente stock disponible para ${itemName}.`, "error", "purchaseMessageArea");
        return;
    }

    // No necesitamos actualizar el stock si viene de una prueba, ya que ya fue descontado
    if (!isFromTrial) {
        stockData[itemIndex].quantity = currentStock - quantity;
        saveStockData(stockData);
    }

    // Actualizar Cliente
    const newMovement = {
        type: 'compra',
        date: date,
        item: itemName,
        quantity: quantity,
        price: total,
        payment: 'total',
        amount: total
    };
    if (!clientsData[clientIndex].movements) clientsData[clientIndex].movements = [];
    clientsData[clientIndex].movements.push(newMovement);
    // No sumamos deuda ya que es pago total
    saveClientsData(clientsData);

    closeModal('purchaseModal');
    renderClientsTable();
    showMessage(`Compra de ${itemName} registrada con pago total.`, "success");
}

function handlePartialPayment() {
    const partialPaymentContainer = document.getElementById('partialPaymentContainer');
    if (partialPaymentContainer.classList.contains('hidden')) {
        partialPaymentContainer.classList.remove('hidden');
        return;
    }

    const clientId = parseInt(document.getElementById('purchaseClientId').value, 10);
    const itemName = document.getElementById('purchaseItemSelect').value;
    const quantity = parseInt(document.getElementById('purchaseQuantity').value) || 1;
    const date = document.getElementById('purchaseDate').value;
    
    // Obtener el precio unitario del item seleccionado
    const selectedOption = document.getElementById('purchaseItemSelect').options[document.getElementById('purchaseItemSelect').selectedIndex];
    const unitPrice = parseFloat(selectedOption.dataset.price);
    const total = unitPrice * quantity;
    
    const partialAmount = parseFloat(document.getElementById('partialPaymentAmount').value);

    if (!clientId || !itemName || !date) {
        showMessage("Completa todos los campos requeridos.", "error", "purchaseMessageArea");
        return;
    }

    if (isNaN(partialAmount) || partialAmount <= 0) {
        showMessage("El monto del pago debe ser mayor a 0.", "error", "purchaseMessageArea");
        return;
    }

    if (partialAmount >= total) {
        showMessage(`El monto del pago parcial (${formatCurrency(partialAmount)}) debe ser menor al total (${formatCurrency(total)}).`, "error", "purchaseMessageArea");
        return;
    }

    let stockData = getStockData();
    let clientsData = getClientsData();
    const itemIndex = stockData.findIndex(item => item.name === itemName);
    const clientIndex = clientsData.findIndex(c => c.id === clientId);

    if (itemIndex === -1 || clientIndex === -1) {
        showMessage("Error: No se encontró el producto o la clienta.", "error", "purchaseMessageArea");
        return;
    }

    const item = stockData[itemIndex];
    const currentStock = item.quantity || 0;

    // Verificar si esta compra viene de una prueba
    const isFromTrial = document.getElementById('isFromTrial')?.value === 'true';

    // Solo verificar stock si no viene de una prueba
    if (!isFromTrial && currentStock < quantity) {
        showMessage(`No hay suficiente stock disponible para ${itemName}.`, "error", "purchaseMessageArea");
        return;
    }

    // No necesitamos actualizar el stock si viene de una prueba, ya que ya fue descontado
    if (!isFromTrial) {
        stockData[itemIndex].quantity = currentStock - quantity;
        saveStockData(stockData);
    }

    // Actualizar Cliente
    const newMovement = {
        type: 'compra',
        date: date,
        item: itemName,
        quantity: quantity,
        price: total,
        payment: 'partial',
        amount: partialAmount
    };
    if (!clientsData[clientIndex].movements) clientsData[clientIndex].movements = [];
    clientsData[clientIndex].movements.push(newMovement);
    clientsData[clientIndex].debt = (clientsData[clientIndex].debt || 0) + (total - partialAmount);
    saveClientsData(clientsData);

    closeModal('purchaseModal');
    renderClientsTable();
    showMessage(`Compra de ${itemName} registrada con pago parcial de ${formatCurrency(partialAmount)}. Deuda restante: ${formatCurrency(total - partialAmount)}`, "success");
}

function handleNoPayment() {
    const clientId = parseInt(document.getElementById('purchaseClientId').value, 10);
    const itemName = document.getElementById('purchaseItemSelect').value;
    const quantity = parseInt(document.getElementById('purchaseQuantity').value) || 1;
    const date = document.getElementById('purchaseDate').value;
    
    // Obtener el precio unitario del item seleccionado
    const selectedOption = document.getElementById('purchaseItemSelect').options[document.getElementById('purchaseItemSelect').selectedIndex];
    const unitPrice = parseFloat(selectedOption.dataset.price);
    const total = unitPrice * quantity;

    if (!clientId || !itemName || !date) {
        showMessage("Completa todos los campos requeridos.", "error", "purchaseMessageArea");
        return;
    }

    let stockData = getStockData();
    let clientsData = getClientsData();
    const itemIndex = stockData.findIndex(item => item.name === itemName);
    const clientIndex = clientsData.findIndex(c => c.id === clientId);

    if (itemIndex === -1 || clientIndex === -1) {
        showMessage("Error: No se encontró el producto o la clienta.", "error", "purchaseMessageArea");
        return;
    }

    const item = stockData[itemIndex];
    const currentStock = item.quantity || 0;

    // Verificar si esta compra viene de una prueba
    const isFromTrial = document.getElementById('isFromTrial')?.value === 'true';

    // Solo verificar stock si no viene de una prueba
    if (!isFromTrial && currentStock < quantity) {
        showMessage(`No hay suficiente stock disponible para ${itemName}.`, "error", "purchaseMessageArea");
        return;
    }

    // No necesitamos actualizar el stock si viene de una prueba, ya que ya fue descontado
    if (!isFromTrial) {
        stockData[itemIndex].quantity = currentStock - quantity;
        saveStockData(stockData);
    }

    // Actualizar Cliente
    const newMovement = {
        type: 'compra',
        date: date,
        item: itemName,
        quantity: quantity,
        price: total,
        payment: 'none',
        amount: 0
    };
    if (!clientsData[clientIndex].movements) clientsData[clientIndex].movements = [];
    clientsData[clientIndex].movements.push(newMovement);
    clientsData[clientIndex].debt = (clientsData[clientIndex].debt || 0) + total;
    saveClientsData(clientsData);

    closeModal('purchaseModal');
    renderClientsTable();
    showMessage(`Compra de ${itemName} registrada sin pago. Deuda total: ${formatCurrency(clientsData[clientIndex].debt)}`, "success");
}

function setupPurchaseModal(clientId) {
    console.log('Configurando modal de compra para cliente ID:', clientId);
    const modal = document.getElementById('purchaseModal');
    const itemSelect = document.getElementById('purchaseItemSelect');
    const dateInput = document.getElementById('purchaseDate');
    const clientNameDisplay = document.getElementById('purchaseClientName');
    
    // Obtener datos del cliente
    const clients = getClientsData();
    const client = clients.find(c => c.id === parseInt(clientId, 10));

    if (!client) {
        console.error('No se encontró el cliente con ID:', clientId);
        showMessage('No se encontró el cliente', 'error');
        return;
    }

    // Crear o actualizar el input hidden para el ID del cliente
    let clientIdInput = document.getElementById('purchaseClientId');
    if (!clientIdInput) {
        clientIdInput = document.createElement('input');
        clientIdInput.type = 'hidden';
        clientIdInput.id = 'purchaseClientId';
        document.getElementById('purchaseForm').appendChild(clientIdInput);
    }
    clientIdInput.value = clientId;

    // Establecer fecha actual
    const now = new Date();
    dateInput.value = now.toISOString().split('T')[0];
    
    // Mostrar nombre del cliente
    clientNameDisplay.textContent = client.name;

    // Limpiar y poblar select de prendas
    itemSelect.innerHTML = '<option value="">-- Selecciona un producto --</option>';
    const stockData = getStockData();
    stockData.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name;
        option.textContent = `${item.name} - ${formatCurrency(item.price)}`;
        option.dataset.price = item.price; // Guardamos el precio sin multiplicar por 1000
        itemSelect.appendChild(option);
    });

    // Evento para cuando se selecciona un producto
    itemSelect.addEventListener('change', () => {
        const selectedItem = stockData.find(item => item.name === itemSelect.value);
        
        if (selectedItem) {
            document.getElementById('purchaseItemPrice').textContent = formatCurrency(selectedItem.price);
            document.getElementById('purchaseAvailableStock').textContent = selectedItem.quantity || 0;
        } else {
            document.getElementById('purchaseItemPrice').textContent = '--';
            document.getElementById('purchaseAvailableStock').textContent = '--';
        }
        updatePurchaseTotal();
    });

    // Evento para cuando cambia la cantidad
    document.getElementById('purchaseQuantity').addEventListener('change', updatePurchaseTotal);

    // Evento para cuando cambia la cantidad
    document.getElementById('purchaseQuantity').addEventListener('change', updatePurchaseTotal);

    // Mostrar el modal
    openModal('purchaseModal');
}

function updatePurchaseTotal() {
    const itemSelect = document.getElementById('purchaseItemSelect');
    const quantityInput = document.getElementById('purchaseQuantity');
    const totalElement = document.getElementById('purchaseTotal');
    
    const selectedOption = itemSelect.options[itemSelect.selectedIndex];
    const price = selectedOption ? parseFloat(selectedOption.dataset.price) || 0 : 0;
    const quantity = parseInt(quantityInput.value) || 1;
    
    totalElement.textContent = formatCurrency(price * quantity);
}

function setupMovementsModal(clientId) {
    console.log('Configurando modal de movimientos para cliente ID:', clientId);
    const modal = document.getElementById('movementsModal');
    const clientNameDisplay = document.getElementById('movementsClientName');
    const currentDebtDisplay = document.getElementById('movementsCurrentDebt');
    const movementsList = document.getElementById('movementsList');

    // Obtener datos del cliente
    const clients = getClientsData();
    const client = clients.find(c => c.id === parseInt(clientId, 10));

    if (!client) {
        showMessage('No se encontró el cliente', 'error');
        return;
    }

    // Mostrar información del cliente
    clientNameDisplay.textContent = client.name;
    currentDebtDisplay.textContent = formatCurrency(client.debt || 0);

    // Limpiar y poblar la tabla de movimientos
    movementsList.innerHTML = '';
    if (client.movements && client.movements.length > 0) {
        client.movements.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(movement => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const formattedDate = new Date(movement.date).toLocaleDateString('es-AR');
            let paymentType = '';
            let amountDisplay = '';

            if (movement.type === 'compra') {
                paymentType = movement.payment === 'total' ? 'Total' : 
                            movement.payment === 'partial' ? 'Parcial' : 
                            'Sin pago';
                amountDisplay = movement.payment === 'total' ? formatCurrency(movement.price) :
                               movement.payment === 'partial' ? `${formatCurrency(movement.amount)} de ${formatCurrency(movement.price)}` :
                               `${formatCurrency(0)} de ${formatCurrency(movement.price)}`;
            } else if (movement.type === 'pago') {
                paymentType = 'Pago';
                amountDisplay = formatCurrency(movement.amount);
            } else if (movement.type === 'prueba') {
                paymentType = 'Prueba';
                amountDisplay = formatCurrency(movement.price);
            }
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formattedDate}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${movement.type.charAt(0).toUpperCase() + movement.type.slice(1)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${movement.item || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${movement.size || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${movement.quantity || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatCurrency(movement.price || 0)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${paymentType}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${
                    movement.type === 'compra' && movement.payment === 'none' ? 'text-red-600' : 
                    movement.type === 'compra' && movement.payment === 'partial' ? 'text-yellow-600' :
                    movement.type === 'pago' ? 'text-green-600' : 'text-gray-900'
                }">${amountDisplay}</td>
            `;
            movementsList.appendChild(row);
        });
    } else {
        movementsList.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-4 text-center text-sm text-gray-500">
                    No hay movimientos registrados
                </td>
            </tr>
        `;
    }

    // Configurar el botón de PDF
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    generatePdfBtn.onclick = () => generateClientPdf(client);

    openModal('movementsModal');
}

function generateClientPdf(client) {
    try {
        // Verificar que jsPDF esté disponible
        if (typeof window.jsPDF === 'undefined') {
            throw new Error('La biblioteca jsPDF no está cargada correctamente');
        }

        // Crear el documento PDF
        const doc = new window.jsPDF();
        
        // Configuración inicial con estilo moderno acorde a la página
        doc.setTextColor(0, 188, 212); // Color principal #00BCD4 (cian/turquesa)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        
        // Centrar el título principal
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.text('M&D Home', pageWidth / 2, 25, { align: 'center' });
        
        doc.setTextColor(13, 71, 161); // Color secundario #0D47A1 (azul oscuro)
        doc.setFontSize(18);
        doc.text('Historial de Movimientos', pageWidth / 2, 35, { align: 'center' });
        
        // Añadir decoración
        doc.setDrawColor(0, 188, 212); // Color principal #00BCD4 (cian/turquesa)
        doc.setLineWidth(0.5);
        doc.line(20, 40, pageWidth - 20, 40); // Línea decorativa debajo del título
        
        doc.setTextColor(0, 0, 0); // Color negro para el contenido
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Cliente: ${client.name || 'Sin nombre'}`, 20, 50);
        doc.text(`Deuda Actual: ${formatCurrency(client.debt || 0)}`, 20, 58);
    
        // Configurar la tabla
        const headers = ['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Precio', 'Pago', 'Monto'];
        const rows = (client.movements || []).sort((a, b) => {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return dateB - dateA;
        }).map(movement => {
            const formattedDate = movement.date ? new Date(movement.date).toLocaleDateString('es-AR') : 'Sin fecha';
            const paymentType = movement.payment === 'total' ? 'Total' : 
                              movement.payment === 'partial' ? 'Parcial' : 
                              movement.payment === 'none' ? 'Sin pago' : 'Pago';
            
            // Combinar item y size en una sola columna de Producto
            let producto = movement.item || 'Sin producto';
            
            return [
                formattedDate,
                movement.type || 'Sin tipo',
                producto,
                (movement.quantity || 0).toString(),
                formatCurrency(movement.price || 0),
                paymentType,
                formatCurrency(movement.amount || 0)
            ];
        });

        // Configurar el estilo de la tabla con un diseño moderno
        doc.autoTable({
            startY: 65,
            head: [headers],
            body: rows.length > 0 ? rows : [['No hay movimientos registrados']],
            theme: 'grid',
            headStyles: {
                fillColor: [0, 188, 212], // Color principal #00BCD4 (cian/turquesa)
                textColor: 255,
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: {
                fontSize: 9,
                cellPadding: 3,
                lineColor: [13, 71, 161], // Color secundario #0D47A1 (azul oscuro)
                lineWidth: 0.1
            },
            alternateRowStyles: {
                fillColor: [224, 242, 254] // Color azul claro para filas alternas
            },
            columnStyles: {
                0: { cellWidth: 25 }, // Fecha
                1: { cellWidth: 20 }, // Tipo
                2: { cellWidth: 50 }, // Producto (combinando prenda y talle)
                3: { cellWidth: 15 }, // Cantidad
                4: { cellWidth: 25 }, // Precio
                5: { cellWidth: 20 }, // Pago
                6: { cellWidth: 25 }  // Monto
            },
            didDrawPage: function(data) {
                // Añadir pie de página
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text('M&D Home - Documento generado el ' + new Date().toLocaleDateString('es-AR'), 20, doc.internal.pageSize.height - 10);
            }
        });

        // Guardar el PDF
        const fileName = `historial_${(client.name || 'cliente').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
    } catch (error) {
        console.error('Error al generar el PDF:', error);
        showMessage('Error al generar el PDF. Por favor, intente nuevamente.', 'error');
    }
}

// Asegurarse de que la función esté disponible globalmente
window.generateClientPdf = generateClientPdf;

function setupPaymentModal(clientId) {
    console.log('Configurando modal de pago para cliente ID:', clientId);
    const modal = document.getElementById('paymentModal');
    const clientNameDisplay = document.getElementById('paymentClientName');
    const currentDebtDisplay = document.getElementById('paymentCurrentDebt');
    const paymentForm = document.getElementById('paymentForm');
    const clientIdInput = document.getElementById('paymentClientId');
    const paymentDateInput = document.getElementById('paymentDate');

    // Obtener datos del cliente
    const clients = getClientsData();
    const client = clients.find(c => c.id === parseInt(clientId, 10));

    if (!client) {
        showMessage('No se encontró el cliente', 'error');
        return;
    }

    // Configurar el formulario
    clientIdInput.value = clientId;
    clientNameDisplay.textContent = client.name;
    currentDebtDisplay.textContent = formatCurrency(client.debt || 0);

    // Establecer la fecha actual como valor predeterminado
    const today = new Date().toISOString().split('T')[0];
    paymentDateInput.value = today;

    // Limpiar el formulario
    paymentForm.reset();
    paymentDateInput.value = today; // Restablecer la fecha después del reset

    // Mostrar el modal
    openModal('paymentModal');
}

function handlePaymentSubmit(event) {
    event.preventDefault();
    const clientId = parseInt(document.getElementById('paymentClientId').value, 10);
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value) || 0;
    const paymentDate = document.getElementById('paymentDate').value;
    const messageArea = document.getElementById('paymentMessageArea');

    if (!clientId) {
        showMessage('Error: No se encontró el ID del cliente', 'error', 'paymentMessageArea');
        return;
    }

    if (!paymentDate) {
        showMessage('Por favor seleccione una fecha', 'error', 'paymentMessageArea');
        return;
    }

    if (paymentAmount <= 0) {
        showMessage('El monto del pago debe ser mayor a 0', 'error', 'paymentMessageArea');
        return;
    }

    let clients = getClientsData();
    const clientIndex = clients.findIndex(c => c.id === clientId);

    if (clientIndex === -1) {
        showMessage('Error: No se encontró el cliente', 'error', 'paymentMessageArea');
        return;
    }

    const client = clients[clientIndex];
    const currentDebt = client.debt || 0;

    if (paymentAmount > currentDebt) {
        showMessage(`El monto del pago (${formatCurrency(paymentAmount)}) no puede ser mayor a la deuda actual (${formatCurrency(currentDebt)})`, 'error', 'paymentMessageArea');
        return;
    }

    // Actualizar la deuda del cliente
    clients[clientIndex].debt = currentDebt - paymentAmount;

    // Agregar el movimiento de pago
    const newMovement = {
        type: 'pago',
        date: paymentDate,
        amount: paymentAmount,
        payment: 'total'
    };

    if (!clients[clientIndex].movements) {
        clients[clientIndex].movements = [];
    }
    clients[clientIndex].movements.push(newMovement);

    // Guardar los cambios
    saveClientsData(clients);

    // Cerrar el modal y actualizar la tabla
    closeModal('paymentModal');
    renderClientsTable();
    showMessage(`Pago de ${formatCurrency(paymentAmount)} registrado correctamente`, 'success');
}

function handleTrialSubmit(event) {
    event.preventDefault();
    console.log('Manejando envío de prueba...');
    
    const clientId = parseInt(document.getElementById('trialClientId').value, 10);
    const trialDate = document.getElementById('trialDate').value;
    const itemName = document.getElementById('trialItemSelect').value;
    const size = document.getElementById('trialSizeSelect').value;
    const quantity = parseInt(document.getElementById('trialQuantity').value) || 1;
    const messageArea = document.getElementById('trialMessageArea');

    console.log('Datos del formulario:', { clientId, trialDate, itemName, size, quantity });

    if (!clientId || !trialDate || !itemName || !size) {
        showMessage('Por favor complete todos los campos requeridos', 'error', 'trialMessageArea');
        return;
    }

    let stockData = getStockData();
    let clients = getClientsData();
    const itemIndex = stockData.findIndex(item => item.name === itemName);
    const clientIndex = clients.findIndex(c => c.id === clientId);

    if (itemIndex === -1 || clientIndex === -1) {
        showMessage('Error: No se encontró la prenda o el cliente', 'error', 'trialMessageArea');
        return;
    }

    const item = stockData[itemIndex];
    const currentStock = item.sizes?.[size] || 0;

    if (currentStock < quantity) {
        showMessage(`No hay suficiente stock disponible para ${itemName} en talle ${size}`, 'error', 'trialMessageArea');
        return;
    }

    // Actualizar Stock
    stockData[itemIndex].sizes[size] = currentStock - quantity;
    saveStockData(stockData);

    // Agregar el movimiento de prueba
    const newMovement = {
        type: 'prueba',
        date: trialDate,
        item: itemName,
        size: size,
        quantity: quantity,
        price: item.price
    };

    if (!clients[clientIndex].movements) {
        clients[clientIndex].movements = [];
    }
    clients[clientIndex].movements.push(newMovement);

    // Guardar los cambios
    saveClientsData(clients);

    // Cerrar el modal y actualizar la tabla
    closeModal('trialModal');
    renderClientsTable();
    showMessage(`Prueba de ${itemName} (${size}) registrada correctamente`, 'success');
}

function setupTrialsModal(clientId) {
    console.log('Configurando modal de pruebas para cliente ID:', clientId);
    const modal = document.getElementById('trialsModal');
    const clientNameDisplay = document.getElementById('trialsClientName');
    const trialsList = document.getElementById('trialsList');

    // Obtener datos del cliente
    const clients = getClientsData();
    const client = clients.find(c => c.id === parseInt(clientId, 10));

    if (!client) {
        showMessage('No se encontró el cliente', 'error');
        return;
    }

    // Mostrar nombre del cliente
    clientNameDisplay.textContent = client.name;

    // Limpiar y poblar la lista de pruebas
    trialsList.innerHTML = '';
    if (client.movements && client.movements.length > 0) {
        const trials = client.movements.filter(movement => movement.type === 'prueba');
        
        if (trials.length === 0) {
            trialsList.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
                        No hay pruebas pendientes
                    </td>
                </tr>
            `;
        } else {
            trials.forEach((trial, index) => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${new Date(trial.date).toLocaleDateString('es-AR')}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${trial.item}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${trial.size}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${trial.quantity}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatCurrency(trial.price)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        <button class="bg-brand-fuchsia hover:bg-brand-fuchsia-dark text-white font-bold py-2 px-4 rounded-md transition duration-300 mx-1 purchase-trial-btn"
                                data-trial-index="${index}">
                            Compra
                        </button>
                        <button class="bg-brand-fuchsia hover:bg-brand-fuchsia-dark text-white font-bold py-2 px-4 rounded-md transition duration-300 mx-1 return-trial-btn"
                                data-trial-index="${index}">
                            Devuelve
                        </button>
                    </td>
                `;
                trialsList.appendChild(row);
            });
        }
    }

    // Agregar event listeners para los botones
    trialsList.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('purchase-trial-btn')) {
            const trialIndex = parseInt(target.dataset.trialIndex);
            handleTrialPurchase(client, trialIndex);
        } else if (target.classList.contains('return-trial-btn')) {
            const trialIndex = parseInt(target.dataset.trialIndex);
            handleTrialReturn(client, trialIndex);
        }
    });

    // Mostrar el modal
    openModal('trialsModal');
}

function handleTrialPurchase(client, trialIndex) {
    console.log('Intentando comprar prueba:', { clientId: client.id, trialIndex });
    
    // Obtener todas las pruebas del cliente
    const trials = client.movements.filter(movement => movement.type === 'prueba');
    
    // Verificar que el índice sea válido
    if (trialIndex < 0 || trialIndex >= trials.length) {
        console.error('Índice de prueba inválido:', { trialIndex, trialsLength: trials.length });
        showMessage('Error: No se encontró la prueba', 'error', 'trialsMessageArea');
        return;
    }

    const trial = trials[trialIndex];

    // Cerrar el modal de pruebas
    closeModal('trialsModal');

    // Configurar el modal de compra con los datos de la prueba
    const purchaseModal = document.getElementById('purchaseModal');
    const purchaseForm = document.getElementById('purchaseForm');
    const purchaseClientName = document.getElementById('purchaseClientName');
    const purchaseDate = document.getElementById('purchaseDate');
    const purchaseItemSelect = document.getElementById('purchaseItemSelect');
    const purchaseSizeSelect = document.getElementById('purchaseSizeSelect');
    const purchaseQuantity = document.getElementById('purchaseQuantity');

    // Crear o actualizar el input hidden para el ID del cliente
    let clientIdInput = document.getElementById('purchaseClientId');
    if (!clientIdInput) {
        clientIdInput = document.createElement('input');
        clientIdInput.type = 'hidden';
        clientIdInput.id = 'purchaseClientId';
        purchaseForm.appendChild(clientIdInput);
    }
    clientIdInput.value = client.id;

    // Crear o actualizar el input hidden para indicar que viene de una prueba
    let isFromTrialInput = document.getElementById('isFromTrial');
    if (!isFromTrialInput) {
        isFromTrialInput = document.createElement('input');
        isFromTrialInput.type = 'hidden';
        isFromTrialInput.id = 'isFromTrial';
        purchaseForm.appendChild(isFromTrialInput);
    }
    isFromTrialInput.value = 'true';

    // Establecer los valores del formulario
    purchaseClientName.textContent = client.name;
    purchaseDate.value = new Date().toISOString().split('T')[0];

    // Poblar y configurar el select de prendas
    purchaseItemSelect.innerHTML = '<option value="">-- Selecciona un producto --</option>';
    const stockData = getStockData();
    stockData.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name;
        option.textContent = `${item.name} - ${formatCurrency(item.price)}`;
        option.dataset.price = item.price;
        purchaseItemSelect.appendChild(option);
    });

    // Seleccionar la prenda de la prueba
    purchaseItemSelect.value = trial.item;

    // Habilitar y poblar el select de talles
    purchaseSizeSelect.disabled = false;
    purchaseSizeSelect.innerHTML = '<option value="">-- Selecciona un talle --</option>';
    const selectedItem = stockData.find(i => i.name === trial.item);
    if (selectedItem) {
        SIZES.forEach(size => {
            if (selectedItem.sizes[size] > 0 || size === trial.size) {
                const option = document.createElement('option');
                option.value = size;
                option.textContent = `${size} (${selectedItem.sizes[size]} disponibles)`;
                purchaseSizeSelect.appendChild(option);
            }
        });

        // Seleccionar el talle de la prueba
        purchaseSizeSelect.value = trial.size;
        
        // Actualizar cantidad y precios
        purchaseQuantity.value = trial.quantity;
        document.getElementById('purchaseItemPrice').textContent = formatCurrency(selectedItem.price);
        document.getElementById('purchaseAvailableStock').textContent = selectedItem.sizes[trial.size] || 0;
        document.getElementById('purchaseTotal').textContent = formatCurrency(selectedItem.price * trial.quantity);
    }

    // Mostrar el modal de compra
    openModal('purchaseModal');

    // Eliminar el movimiento de prueba original después de abrir el modal de compra
    const realIndex = client.movements.findIndex(movement => 
        movement.type === 'prueba' && 
        movement.item === trial.item && 
        movement.size === trial.size && 
        movement.quantity === trial.quantity
    );

    if (realIndex !== -1) {
        client.movements.splice(realIndex, 1);
        let clients = getClientsData();
        const clientIndex = clients.findIndex(c => c.id === client.id);
        if (clientIndex !== -1) {
            clients[clientIndex] = client;
            saveClientsData(clients);
        }
    }
}

function handleTrialReturn(client, trialIndex) {
    console.log('Intentando devolver prueba:', { clientId: client.id, trialIndex });
    
    // Obtener todas las pruebas del cliente
    const trials = client.movements.filter(movement => movement.type === 'prueba');
    
    // Verificar que el índice sea válido
    if (trialIndex < 0 || trialIndex >= trials.length) {
        console.error('Índice de prueba inválido:', { trialIndex, trialsLength: trials.length });
        showMessage('Error: No se encontró la prueba', 'error', 'trialsMessageArea');
        return;
    }

    const trial = trials[trialIndex];

    // Encontrar el índice real en el array de movimientos
    const realIndex = client.movements.findIndex(movement => 
        movement.type === 'prueba' && 
        movement.item === trial.item && 
        movement.size === trial.size && 
        movement.quantity === trial.quantity
    );

    if (realIndex === -1) {
        console.error('No se pudo encontrar el movimiento original');
        showMessage('Error: No se pudo procesar la devolución', 'error', 'trialsMessageArea');
        return;
    }

    // Devolver el stock
    let stockData = getStockData();
    const itemIndex = stockData.findIndex(item => item.name === trial.item);
    if (itemIndex !== -1) {
        stockData[itemIndex].sizes[trial.size] = (stockData[itemIndex].sizes[trial.size] || 0) + trial.quantity;
        saveStockData(stockData);
    }

    // Eliminar el movimiento de prueba
    client.movements.splice(realIndex, 1);

    // Actualizar los datos del cliente
    let clients = getClientsData();
    const clientIndex = clients.findIndex(c => c.id === client.id);
    if (clientIndex !== -1) {
        clients[clientIndex] = client;
        saveClientsData(clients);
    }

    // Cerrar el modal de pruebas
    closeModal('trialsModal');

    // Actualizar la vista
    renderClientsTable();
    showMessage(`Prueba devuelta: ${trial.item} (${trial.size})`, 'success');
}

// ==========================================================================
// --- INICIALIZADOR PRINCIPAL ---
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const pageId = document.body.id; // Obtener el ID del body para saber qué página es

    console.log(`DOM Loaded. Page ID: ${pageId}`);

    // Ejecutar la inicialización correspondiente a la página actual
    switch (pageId) {
        case 'page-stock':
            initStockPage();
            break;
        case 'page-clientes':
            initClientsPage();
            break;
        case 'page-ventas':
            initVentasPage();
            break;
        case 'page-index':
            // No hay JS específico para index.html por ahora
            console.log("Index page loaded.");
            break;
        default:
            console.warn("Page ID not recognized or not set on body tag.");
    }
});

function initVentasPage() {
    console.log('Inicializando página de ventas...');

    // Obtener elementos del DOM
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const applyFiltersBtn = document.getElementById('applyFilters');

    // Establecer fechas por defecto (último mes)
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    startDateInput.value = lastMonth.toISOString().split('T')[0];
    endDateInput.value = today.toISOString().split('T')[0];

    // Inicializar gráficos vacíos
    let prendasChart = null;
    let tallesChart = null;

    function actualizarEstadisticas(ventas) {
        console.log('Actualizando estadísticas con', ventas.length, 'ventas');
        
        // Obtener datos del stock actual
        const stockData = getStockData();
        const clientsData = getClientsData();
        
        console.log('Datos cargados:', { stockData: stockData.length, clientsData: clientsData.length });
        
        // 1. "Cantidad de ventas" - Cantidad de ventas en el período filtrado
        const cantidadVentas = ventas.length;
        console.log('Cantidad de ventas:', cantidadVentas);
        
        // 2. "Deuda" - Sumatoria de deuda de todos los clientes
        const totalDeudas = clientsData.reduce((sum, client) => sum + (client.debt || 0), 0);
        console.log('Total deudas:', totalDeudas);
        
        // 3. "Costo de ventas" - Sumatoria del costo de los productos vendidos
        let costoVentas = 0;
        ventas.forEach(venta => {
            // Buscar el costo del producto en el stock (si existe)
            const stockItem = stockData.find(item => item.name === venta.item);
            if (stockItem) {
                costoVentas += stockItem.costPrice * venta.quantity;
            } else {
                console.log('Producto no encontrado en stock:', venta.item);
                // Si no se encuentra en stock actual, usar un valor estimado
                costoVentas += (venta.price * 0.6) * venta.quantity; // Estimación del 60% del precio de venta
            }
        });
        console.log('Costo ventas:', costoVentas);
        
        // 4. "Neto ventas" - Sumatoria del valor de venta de los productos vendidos
        const netoVentas = ventas.reduce((sum, venta) => sum + venta.price, 0);
        console.log('Neto ventas:', netoVentas);
        
        // 5. "Ganancia ventas" - Resultado de la resta entre "Neto ventas" y "Costo de ventas"
        const gananciasVentas = netoVentas - costoVentas;
        console.log('Ganancias ventas:', gananciasVentas);
        
        // Función auxiliar para calcular totales del stock de manera segura
        function calcularTotalesStock(stockItems) {
            let invertido = 0;
            let proyectado = 0;
            
            console.log('Calculando totales con', stockItems.length, 'productos');
            
            // Verificar si hay datos
            if (!stockItems || stockItems.length === 0) {
                console.log('No hay productos en stock');
                return { invertido: 0, proyectado: 0 };
            }
            
            // Procesar cada producto
            for (let i = 0; i < stockItems.length; i++) {
                const item = stockItems[i];
                
                try {
                    // Verificar que el producto es válido
                    if (!item || !item.name) {
                        console.log('Producto inválido en índice', i);
                        continue;
                    }
                    
                    console.log(`Procesando producto: ${item.name}`);
                    
                    // Obtener precio de costo y venta
                    const costPrice = parseFloat(item.costPrice || 0);
                    const salePrice = parseFloat(item.price || 0);
                    
                    // Calcular cantidad total sumando todos los talles
                    let cantidad = 0;
                    
                    // Verificar si tiene talles
                    if (item.sizes && typeof item.sizes === 'object') {
                        // Sumar cantidades de todos los talles
                        for (const talle in item.sizes) {
                            const cantidadTalle = parseFloat(item.sizes[talle] || 0);
                            cantidad += cantidadTalle;
                        }
                    } else if (typeof item.quantity === 'number' || typeof item.quantity === 'string') {
                        // Si no tiene talles pero tiene cantidad
                        cantidad = parseFloat(item.quantity || 0);
                    }
                    
                    // Calcular valores
                    const valorCosto = cantidad * costPrice;
                    const valorVenta = cantidad * salePrice;
                    
                    console.log(`${item.name}: ${cantidad} unidades - Costo: $${valorCosto} - Venta: $${valorVenta}`);
                    
                    // Sumar a los totales
                    invertido += valorCosto;
                    proyectado += valorVenta;
                    
                } catch (error) {
                    console.error(`Error procesando producto ${i}:`, error);
                }
            }
            
            console.log('Totales calculados - Invertido:', invertido, '- Proyectado:', proyectado);
            return { invertido, proyectado };
        }
        
        // Calcular capital invertido y proyectado
        const { invertido: capitalInvertido, proyectado: capitalProyectado } = calcularTotalesStock(stockData);
        
        console.log('Capital invertido:', capitalInvertido);
        console.log('Capital proyectado:', capitalProyectado);
        
        // 8. "Ganancia total" - Resultado de la resta entre "Capital proyectado" y "Capital invertido"
        const gananciaTotal = capitalProyectado - capitalInvertido;
        console.log('Ganancia total:', gananciaTotal);

        try {
            // Verificar que todos los elementos existen antes de actualizar
            const elementosEstadisticas = [
                { id: 'cantidadVentas', valor: cantidadVentas },
                { id: 'totalDeudas', valor: formatCurrency(totalDeudas) },
                { id: 'costoVentas', valor: formatCurrency(costoVentas) },
                { id: 'netoVentas', valor: formatCurrency(netoVentas) },
                { id: 'gananciasVentas', valor: formatCurrency(gananciasVentas) },
                { id: 'capitalInvertido', valor: formatCurrency(capitalInvertido) },
                { id: 'capitalProyectado', valor: formatCurrency(capitalProyectado) },
                { id: 'gananciaTotal', valor: formatCurrency(gananciaTotal) }
            ];

            // Actualizar todos los indicadores en la interfaz
            elementosEstadisticas.forEach(elem => {
                const elemento = document.getElementById(elem.id);
                if (elemento) {
                    elemento.textContent = elem.valor;
                    console.log(`Actualizado ${elem.id} con valor ${elem.valor}`);
                } else {
                    console.error(`Elemento con ID ${elem.id} no encontrado en el DOM`);
                }
            });
        } catch (error) {
            console.error('Error al actualizar estadísticas:', error);
        }
    }

    function actualizarTablaVentas(ventas) {
        const tbody = document.getElementById('ventasTableBody');
        tbody.innerHTML = '';

        if (ventas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">
                        No hay ventas en el período seleccionado
                    </td>
                </tr>
            `;
            return;
        }

        ventas.forEach(venta => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const estadoPago = venta.payment === 'total' ? 'Pago total' :
                             venta.payment === 'partial' ? 'Pago parcial' :
                             'Sin pagar';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${new Date(venta.date).toLocaleDateString('es-AR')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${venta.clientName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${venta.item}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${venta.size}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${venta.quantity}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatCurrency(venta.price)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${
                    venta.payment === 'total' ? 'text-green-600' :
                    venta.payment === 'partial' ? 'text-yellow-600' :
                    'text-red-600'
                }">${estadoPago}</td>
            `;
            tbody.appendChild(row);
        });
    }

    function obtenerVentasEnPeriodo(startDate, endDate) {
        console.log('Obteniendo ventas entre:', startDate.toISOString(), 'y', endDate.toISOString());
        
        const clients = getClientsData();
        console.log('Clientes cargados:', clients.length);
        
        const ventas = [];
        let totalMovements = 0;
        let totalCompras = 0;
        let totalEnRango = 0;

        clients.forEach(client => {
            if (client.movements && Array.isArray(client.movements)) {
                totalMovements += client.movements.length;
                
                client.movements.forEach(movement => {
                    // Verificar que el movimiento sea válido
                    if (movement && movement.type === 'compra') {
                        totalCompras++;
                        
                        // Asegurarse que la fecha es válida
                        if (movement.date) {
                            const moveDate = new Date(movement.date);
                            
                            // Verificar que la fecha es válida y está en el rango
                            if (!isNaN(moveDate.getTime()) && moveDate >= startDate && moveDate <= endDate) {
                                totalEnRango++;
                                
                                // Añadir datos completos de la venta
                                ventas.push({
                                    ...movement,
                                    clientId: client.id,
                                    clientName: client.name,
                                    // Asegurar que todos los campos necesarios existan
                                    quantity: movement.quantity || 1,
                                    price: movement.price || 0,
                                    payment: movement.payment || 'none'
                                });
                            }
                        } else {
                            console.warn('Movimiento sin fecha:', movement);
                        }
                    }
                });
            } else {
                console.log('Cliente sin movimientos:', client.name);
            }
        });

        console.log('Estadísticas de ventas:', {
            totalClientes: clients.length,
            totalMovimientos: totalMovements,
            totalCompras: totalCompras,
            ventasEnRango: totalEnRango,
            ventasFiltradas: ventas.length
        });

        // Ordenar por fecha (más recientes primero)
        return ventas.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    function actualizarDatos() {
        console.log('Actualizando datos de ventas...');
        
        try {
            // Obtener fechas del filtro
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);
            endDate.setHours(23, 59, 59, 999); // Incluir todo el día final

            console.log('Fechas seleccionadas:', {
                inicio: startDateInput.value,
                fin: endDateInput.value,
                inicioObj: startDate.toISOString(),
                finObj: endDate.toISOString()
            });

            if (startDate > endDate) {
                showMessage('La fecha de inicio debe ser anterior a la fecha final', 'error');
                return;
            }

            // Obtener ventas en el período
            const ventas = obtenerVentasEnPeriodo(startDate, endDate);
            console.log('Ventas obtenidas:', ventas.length);
            
            if (ventas.length === 0) {
                console.log('No se encontraron ventas en el período seleccionado');
                showMessage('No se encontraron ventas en el período seleccionado', 'info');
            }
            
            // Actualizar estadísticas y tabla
            actualizarEstadisticas(ventas);
            actualizarTablaVentas(ventas);
            
            console.log('Datos actualizados correctamente');
        } catch (error) {
            console.error('Error al actualizar datos:', error);
            showMessage('Error al cargar los datos. Revisa la consola para más detalles.', 'error');
        }
    }

    // Event listeners
    applyFiltersBtn.addEventListener('click', actualizarDatos);

    // Cargar datos iniciales
    actualizarDatos();
}

