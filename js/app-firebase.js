// app-firebase.js - Punto de entrada para la aplicación con soporte para Firebase
// Este archivo reemplaza a app.js y expone las funciones del adaptador globalmente

import {
    getStockData,
    saveStockData,
    getClientsData,
    saveClientsData,
    getSalesData,
    saveSalesData,
    getNextClientId,
    syncAllDataWithFirebase
} from './firebase-adapter.js';

// Constantes para las claves de localStorage (duplicadas para compatibilidad)
const STOCK_STORAGE_KEY = 'bella_stock';
const CLIENTS_STORAGE_KEY = 'bella_clients';
const SALES_STORAGE_KEY = 'bella_sales';
const NEXT_CLIENT_ID_KEY = 'bella_nextClientId';

// --- Funciones de Utilidad Comunes ---

/**
 * Reemplaza un nodo por otro de manera segura, verificando que el nodo padre exista.
 * @param {HTMLElement} oldNode - El nodo a reemplazar
 * @param {HTMLElement} newNode - El nuevo nodo
 * @returns {boolean} - true si el reemplazo fue exitoso, false en caso contrario
 */
function safeReplaceNode(oldNode, newNode) {
    if (!oldNode) {
        console.warn('No se puede reemplazar un nodo nulo');
        return false;
    }
    
    if (!newNode) {
        console.warn('No se puede reemplazar con un nodo nulo');
        return false;
    }
    
    if (!oldNode.parentNode) {
        console.warn('No se puede reemplazar el nodo: el nodo padre no existe');
        return false;
    }
    
    try {
        oldNode.parentNode.replaceChild(newNode, oldNode);
        return true;
    } catch (error) {
        console.error('Error al reemplazar el nodo:', error);
        return false;
    }
}

/**
 * Muestra un mensaje de feedback al usuario en un área designada.
 * @param {string} text - El texto del mensaje.
 * @param {string} type - 'success', 'error' o 'info'.
 * @param {string} areaId - El ID del elemento contenedor del mensaje (default: 'messageArea').
 */
window.showMessage = function(text, type = 'success', areaId = 'messageArea') {
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
};

/**
 * Formatea un número como moneda (ARS - Peso Argentino).
 * @param {number | string} number - El número a formatear.
 * @returns {string} - El número formateado como moneda.
 */
window.formatCurrency = function(number) {
    const num = Number(number);
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
};

/**
 * Formatea una fecha ISO string a un formato legible (DD/MM/AAAA HH:MM).
 * @param {string} isoString - La fecha en formato ISO.
 * @returns {string} - La fecha formateada o 'Fecha inválida'.
 */
window.formatDate = function(isoString) {
    if (!isoString) return 'Fecha inválida';
    
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
        console.error('Error formateando fecha:', e);
        return 'Fecha inválida';
    }
};

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

// --- Funciones de Utilidad ---
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.add('opacity-100');
        }, 10);
    }
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('opacity-100');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
};

// Inicialización de páginas
document.addEventListener('DOMContentLoaded', async function() {
    console.log("Inicializando la aplicación con Firebase...");
    
    try {
        // Sincronizar datos con Firebase
        await syncAllDataWithFirebase();
        
        // Detectar qué página estamos viendo e inicializar
        if (document.getElementById('stockTableBody')) {
            console.log("Inicializando página de stock...");
            initStockPage();
        } else if (document.getElementById('clientsTableBody')) {
            console.log("Inicializando página de clientes...");
            initClientsPage();
            
            // Agregar manejadores de eventos directos para los botones del modal
            document.querySelectorAll('.modal').forEach(modal => {
                if (modal.id === 'registerOptionsModal') {
                    const registerPurchaseBtn = modal.querySelector('#registerPurchaseBtn');
                    const registerPaymentBtn = modal.querySelector('#registerPaymentBtn');
                    
                    if (registerPurchaseBtn) {
                        registerPurchaseBtn.addEventListener('click', function() {
                            const clientId = this.dataset.clientId;
                            console.log(`Click directo en botón de compra para cliente ID: ${clientId}`);
                            closeModal('registerOptionsModal');
                            setupPurchaseModal(clientId);
                        });
                        console.log('Configurado evento directo para botón de compra');
                    }
                    
                    if (registerPaymentBtn) {
                        registerPaymentBtn.addEventListener('click', function() {
                            const clientId = this.dataset.clientId;
                            console.log(`Click directo en botón de pago para cliente ID: ${clientId}`);
                            closeModal('registerOptionsModal');
                            setupPaymentModal(clientId);
                        });
                        console.log('Configurado evento directo para botón de pago');
                    }
                }
            });
        } else if (document.getElementById('ventasPage')) {
            console.log("Inicializando página de ventas...");
            initVentasPage();
        }
    } catch (error) {
        console.error("Error inicializando la aplicación:", error);
    }
});

// ==========================================================================
// --- LÓGICA ESPECÍFICA DE LA PÁGINA DE STOCK (stock.html) ---
// ==========================================================================

async function initStockPage() {
    console.log("Initializing Stock Page...");
    const addItemForm = document.getElementById('addItemForm');
    const stockTableBody = document.getElementById('stockTableBody');

    if (!addItemForm || !stockTableBody) {
        console.error("Stock page elements not found!");
        return;
    }

    /** Renderiza la tabla de stock completa. */
    async function renderStockTable() {
        const stockTableBody = document.getElementById('stockTableBody');
        stockTableBody.innerHTML = '';

        try {
            const stockData = await getStockData();
            if (!stockData || stockData.length === 0) {
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
        } catch (error) {
            console.error("Error al renderizar la tabla de stock:", error);
            stockTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-red-500" role="alert">
                        Error al cargar los datos. Por favor, recarga la página.
                    </td>
                </tr>
            `;
        }
    }

    /** Maneja el envío del formulario para agregar un nuevo producto. */
    async function handleAddItem(event) {
        event.preventDefault();
        const itemNameInput = document.getElementById('itemName');
        const itemCostPriceInput = document.getElementById('itemCostPrice');
        const itemPriceInput = document.getElementById('itemPrice');
        const itemQuantityInput = document.getElementById('itemQuantity');
        const name = itemNameInput.value.trim();
        const costPrice = parseFloat(itemCostPriceInput.value);
        const price = parseFloat(itemPriceInput.value);
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

        try {
            const stockData = await getStockData();
            const existingItem = stockData.find(item => item.name.toLowerCase() === name.toLowerCase());
            if (existingItem) {
                showMessage(`El producto "${name}" ya existe en el stock.`, "error"); return;
            }

            // Generar un color aleatorio en formato HSL para asegurar colores distintos y agradables
            const hue = Math.floor(Math.random() * 360); // Tono aleatorio
            const color = `hsl(${hue}, 70%, 65%)`; // Saturación y luminosidad fijas para colores agradables

            // Crear nuevo item con color
            const newItem = {
                id: Date.now().toString(), // Usar timestamp como ID único
                name: name,
                costPrice: costPrice,
                price: price,
                color: color,
                quantity: quantity
            };

            stockData.push(newItem);
            await saveStockData(stockData);

            itemNameInput.value = '';
            itemCostPriceInput.value = '';
            itemPriceInput.value = '';
            itemQuantityInput.value = '';
            await renderStockTable();
            showMessage(`Producto "${name}" agregado correctamente.`, "success");
            itemNameInput.focus();
        } catch (error) {
            console.error("Error al agregar producto:", error);
            showMessage("Error al agregar el producto. Inténtalo de nuevo.", "error");
        }
    }

    /** Abre el modal de edición de stock y carga los datos del item seleccionado. */
    async function setupEditStockModal(itemName) {
        try {
            const stockData = await getStockData();
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
        } catch (error) {
            console.error("Error al configurar el modal de edición:", error);
            showMessage("Error al cargar los datos del producto.", "error");
        }
    }
    
    /** Maneja el envío del formulario de edición de stock. */
    async function handleEditStockSubmit(event) {
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
        
        try {
            // Actualizar datos en el almacenamiento
            const stockData = await getStockData();
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
            await saveStockData(stockData);
            
            // Cerrar el modal y actualizar la tabla
            closeModal('editStockModal');
            await renderStockTable();
            
            showMessage(`Producto "${itemName}" actualizado correctamente.`, "success");
        } catch (error) {
            console.error("Error al editar producto:", error);
            showMessage("Error al actualizar el producto. Inténtalo de nuevo.", "error");
        }
    }

    /** Maneja el clic en un botón de eliminar prenda. */
    async function handleDeleteItem(itemName) {
        if (!itemName) {
            console.error('No se proporcionó un nombre de prenda para eliminar');
            return;
        }

        if (confirm(`¿Estás seguro de que quieres eliminar la prenda "${itemName}"? Esta acción no se puede deshacer.`)) {
            try {
                let stockData = await getStockData();
                stockData = stockData.filter(item => item.name !== itemName);
                await saveStockData(stockData);
                await renderStockTable();
                showMessage(`Prenda "${itemName}" eliminada correctamente.`, "success");
            } catch (error) {
                console.error("Error al eliminar producto:", error);
                showMessage("Error al eliminar el producto. Inténtalo de nuevo.", "error");
            }
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

    // Renderizar tabla inicial
    await renderStockTable();
}

// Exponer las funciones necesarias globalmente
window.initStockPage = initStockPage;

// ==========================================================================
// --- LÓGICA ESPECÍFICA DE LA PÁGINA DE CLIENTES (clientes.html) ---
// ==========================================================================

/** Renderiza la tabla de clientes. */
async function renderClientsTable() {
    const clientsTableBody = document.getElementById('clientsTableBody');
    if (!clientsTableBody) {
        console.error('No se encontró el elemento clientsTableBody');
        return;
    }

    try {
        const clients = await getClientsData();
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
    } catch (error) {
        console.error("Error al renderizar la tabla de clientes:", error);
        clientsTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4 text-red-500" role="alert">
                    Error al cargar los datos. Por favor, recarga la página.
                </td>
            </tr>
        `;
    }
}

// Exponer las funciones necesarias globalmente
window.renderClientsTable = renderClientsTable;

/**
 * Inicializa la página de clientes.
 */
async function initClientsPage() {
    console.log('Inicializando página de clientes...');
    
    try {
        // Limpiar cualquier mensaje de error anterior
        const messageArea = document.getElementById('messageArea');
        if (messageArea) {
            messageArea.innerHTML = '';
        }

        const clientsTableBody = document.getElementById('clientsTableBody');
        if (!clientsTableBody) {
            console.error('No se encontró el elemento clientsTableBody');
            showMessage('Error: No se encontró la tabla de clientes', 'error');
            return;
        }

        console.log('Cargando datos de clientes...');
        // Cargar datos de clientes desde Firebase
        try {
            window.clientsData = await getClientsData();
            console.log('Datos de clientes cargados:', window.clientsData);
        } catch (dataError) {
            console.error('Error al cargar datos de clientes:', dataError);
            showMessage('Error al cargar datos de clientes desde Firebase. Usando datos locales si están disponibles.', 'error');
        }

        // Renderizar tabla inicial
        await renderClientsTable();
        console.log('Tabla de clientes renderizada');

        // Agregar cliente
        const addClientForm = document.getElementById('addClientForm');
        if (addClientForm) {
            console.log('Configurando formulario de agregar cliente');
            // Eliminar event listeners previos para evitar duplicados
            const newAddClientForm = addClientForm.cloneNode(true);
            if (!safeReplaceNode(addClientForm, newAddClientForm)) {
                return; // Salir de la función si no podemos continuar
            }
            newAddClientForm.addEventListener('submit', function(event) {
                console.log('Formulario de agregar cliente enviado');
                handleAddClient(event);
            });
        } else {
            console.error('No se encontró el formulario de agregar cliente');
        }

        // Manejar acciones de clientes
        if (clientsTableBody) {
            console.log('Configurando eventos de la tabla de clientes');
            // Eliminar event listeners previos para evitar duplicados
            const newClientsTableBody = clientsTableBody.cloneNode(true);
            if (!safeReplaceNode(clientsTableBody, newClientsTableBody)) {
                return; // Salir de la función si no podemos continuar
            }
            
            newClientsTableBody.addEventListener('click', (event) => {
                const button = event.target.closest('.action-btn');
                if (!button) return;

                console.log('Botón de acción clickeado:', button);
                const clientId = button.dataset.clientId;
                const action = button.dataset.action;
                console.log(`Acción: ${action}, Cliente ID: ${clientId}`);

                switch (action) {
                    case 'purchase':
                        const clientName = button.closest('tr').querySelector('td:first-child').textContent;
                        console.log(`Configurando opciones para cliente: ${clientName}`);
                        
                        // Configurar el modal de opciones de registro
                        const registerClientNameEl = document.getElementById('registerClientName');
                        if (registerClientNameEl) {
                            registerClientNameEl.textContent = clientName;
                            console.log(`Nombre del cliente establecido en modal de opciones: ${clientName}`);
                        }
                        
                        // Configurar los botones con el ID del cliente
                        const registerPurchaseBtnEl = document.getElementById('registerPurchaseBtn');
                        const registerPaymentBtnEl = document.getElementById('registerPaymentBtn');
                        
                        if (registerPurchaseBtnEl) {
                            // Eliminar event listeners previos
                            const newPurchaseBtn = registerPurchaseBtnEl.cloneNode(true);
                            safeReplaceNode(registerPurchaseBtnEl, newPurchaseBtn);
                            
                            // Configurar el nuevo botón
                            newPurchaseBtn.setAttribute('data-client-id', clientId);
                            newPurchaseBtn.onclick = function() {
                                console.log(`Botón de compra clickeado para cliente ID: ${clientId}`);
                                closeModal('registerOptionsModal');
                                setupPurchaseModal(clientId);
                            };
                            console.log(`Botón de compra configurado con ID: ${clientId}`);
                        }
                        
                        if (registerPaymentBtnEl) {
                            // Eliminar event listeners previos
                            const newPaymentBtn = registerPaymentBtnEl.cloneNode(true);
                            safeReplaceNode(registerPaymentBtnEl, newPaymentBtn);
                            
                            // Configurar el nuevo botón
                            newPaymentBtn.setAttribute('data-client-id', clientId);
                            newPaymentBtn.onclick = function() {
                                console.log(`Botón de pago clickeado para cliente ID: ${clientId}`);
                                closeModal('registerOptionsModal');
                                setupPaymentModal(clientId);
                            };
                            console.log(`Botón de pago configurado con ID: ${clientId}`);
                        }
                        
                        // Abrir el modal de opciones
                        openModal('registerOptionsModal');
                        break;
                    case 'movements':
                        console.log(`Mostrando movimientos para cliente ID: ${clientId}`);
                        setupMovementsModal(clientId);
                        break;
                    case 'trials':
                        console.log(`Mostrando pruebas para cliente ID: ${clientId}`);
                        setupTrialsModal(clientId);
                        break;
                    case 'delete':
                        console.log(`Eliminando cliente ID: ${clientId}`);
                        handleDeleteClient(clientId);
                        break;
                }
            });
        }

        // Asegurarse de que todos los modales estén ocultos inicialmente
        document.querySelectorAll('.modal').forEach(modal => {
            if (!modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
            }
            if (modal.classList.contains('flex')) {
                modal.classList.remove('flex');
            }
        });

        // Configurar botones de modales
        console.log('Configurando botones de modales');
        configureModalButtons();
        
        console.log('Página de clientes inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la página de clientes:', error);
        showMessage('Error al cargar la página de clientes. Por favor, recarga la página.', 'error');
    }
}

/**
 * Configura los botones de los modales y sus event listeners
 */
function configureModalButtons() {
    console.log('Configurando botones de modales...');
    
    // Manejar botones del modal de compra
    const fullPaymentBtn = document.getElementById('fullPaymentBtn');
    const partialPaymentBtn = document.getElementById('partialPaymentBtn');
    const noPaymentBtn = document.getElementById('noPaymentBtn');
    const registerPartialPaymentBtn = document.getElementById('registerPartialPaymentBtn');

    // Eliminar event listeners previos para evitar duplicados
    if (fullPaymentBtn) {
        const newBtn = fullPaymentBtn.cloneNode(true);
        safeReplaceNode(fullPaymentBtn, newBtn);
        newBtn.addEventListener('click', handleFullPayment);
        console.log('Configurado botón de pago completo');
    }
    
    if (partialPaymentBtn) {
        const newBtn = partialPaymentBtn.cloneNode(true);
        safeReplaceNode(partialPaymentBtn, newBtn);
        newBtn.addEventListener('click', handlePartialPayment);
        console.log('Configurado botón de pago parcial');
    }
    
    if (noPaymentBtn) {
        const newBtn = noPaymentBtn.cloneNode(true);
        safeReplaceNode(noPaymentBtn, newBtn);
        newBtn.addEventListener('click', handleNoPayment);
        console.log('Configurado botón de sin pago');
    }
    
    if (registerPartialPaymentBtn) {
        const newBtn = registerPartialPaymentBtn.cloneNode(true);
        safeReplaceNode(registerPartialPaymentBtn, newBtn);
        newBtn.addEventListener('click', handlePartialPayment);
        console.log('Configurado botón de registrar pago parcial');
    }

    // Manejar formulario de pago
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        const newForm = paymentForm.cloneNode(true);
        safeReplaceNode(paymentForm, newForm);
        newForm.addEventListener('submit', handlePaymentSubmit);
        console.log('Configurado formulario de pago');
    }

    // Manejar botones de registro
    const registerPurchaseBtn = document.getElementById('registerPurchaseBtn');
    const registerPaymentBtn = document.getElementById('registerPaymentBtn');

    if (registerPurchaseBtn) {
        console.log('Encontrado botón de registrar compra');
        // Eliminar todos los event listeners anteriores
        const newBtn = registerPurchaseBtn.cloneNode(true);
        safeReplaceNode(registerPurchaseBtn, newBtn);
        
        // Agregar el nuevo event listener
        newBtn.addEventListener('click', function() {
            const clientId = this.dataset.clientId;
            console.log(`Configurando modal de compra para cliente ID: ${clientId}`);
            closeModal('registerOptionsModal');
            setupPurchaseModal(clientId);
        });
        console.log('Configurado botón de registrar compra');
    } else {
        console.error('No se encontró el botón de registrar compra');
    }
    
    if (registerPaymentBtn) {
        console.log('Encontrado botón de registrar pago');
        // Eliminar todos los event listeners anteriores
        const newBtn = registerPaymentBtn.cloneNode(true);
        safeReplaceNode(registerPaymentBtn, newBtn);
        
        // Agregar el nuevo event listener
        newBtn.addEventListener('click', function() {
            const clientId = this.dataset.clientId;
            console.log(`Configurando modal de pago para cliente ID: ${clientId}`);
            closeModal('registerOptionsModal');
            setupPaymentModal(clientId);
        });
        console.log('Configurado botón de registrar pago');
    } else {
        console.error('No se encontró el botón de registrar pago');
    }

    // Configurar TODOS los botones de cierre de modales
    console.log('Configurando botones de cierre de modales...');
    const closeButtons = document.querySelectorAll('.modal-close-btn');
    console.log(`Encontrados ${closeButtons.length} botones de cierre`);
    
    closeButtons.forEach((btn, index) => {
        // Crear un nuevo botón para evitar duplicar event listeners
        const newBtn = btn.cloneNode(true);
        safeReplaceNode(btn, newBtn);
        
        // Agregar el event listener al nuevo botón
        newBtn.addEventListener('click', () => {
            const modal = newBtn.closest('.modal');
            if (modal) {
                console.log(`Cerrando modal: ${modal.id}`);
                closeModal(modal.id);
            } else {
                console.error('No se pudo encontrar el modal padre');
            }
        });
        console.log(`Configurado botón de cierre ${index + 1}`);
    });

    // Cerrar modal al hacer clic fuera
    const modals = document.querySelectorAll('.modal');
    console.log(`Encontrados ${modals.length} modales`);
    
    modals.forEach((modal, index) => {
        // Crear un nuevo modal para evitar duplicar event listeners
        const newModal = modal.cloneNode(true);
        safeReplaceNode(modal, newModal);
        
        // Configurar el nuevo modal para cerrarse al hacer clic fuera
        newModal.addEventListener('click', (e) => {
            if (e.target === newModal) {
                console.log(`Cerrando modal por clic fuera: ${newModal.id}`);
                closeModal(newModal.id);
            }
        });
        
        // Volver a configurar los botones de cierre dentro del nuevo modal
        const innerCloseBtn = newModal.querySelector('.modal-close-btn');
        if (innerCloseBtn) {
            innerCloseBtn.addEventListener('click', () => {
                console.log(`Cerrando modal desde botón interno: ${newModal.id}`);
                closeModal(newModal.id);
            });
        }
        
        console.log(`Configurado modal ${index + 1}: ${newModal.id}`);
    });
    
    console.log('Configuración de botones de modales completada');
}

/**
 * Maneja el envío del formulario para agregar un nuevo cliente.
 */
async function handleAddClient(event) {
    event.preventDefault();
    const clientNameInput = document.getElementById('clientName');
    const name = clientNameInput.value.trim();

    if (!name) {
        showMessage("El nombre de la clienta no puede estar vacío.", "error");
        clientNameInput.focus();
        return;
    }

    try {
        // Obtener datos actuales de clientes
        const clientsData = await getClientsData();
        
        // Verificar si ya existe un cliente con el mismo nombre
        const existingClient = clientsData.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (existingClient) {
            showMessage(`La clienta "${name}" ya existe.`, "error");
            return;
        }

        // Crear nuevo cliente
        const newClient = {
            id: getNextClientId().toString(), // Convertir a string para compatibilidad con Firebase
            name: name,
            debt: 0,
            movements: []
        };

        // Agregar a la lista y guardar
        clientsData.push(newClient);
        await saveClientsData(clientsData);
        
        // Actualizar la tabla y mostrar mensaje
        await renderClientsTable();
        showMessage(`Clienta "${name}" agregada correctamente.`, "success");
        clientNameInput.value = '';
    } catch (error) {
        console.error("Error al agregar cliente:", error);
        showMessage("Error al guardar el cliente. Inténtalo de nuevo.", "error");
    }
}

/**
 * Maneja la eliminación de un cliente.
 */
async function handleDeleteClient(clientId) {
    console.log('Intentando eliminar cliente con ID:', clientId);
    
    try {
        // Obtener datos actuales
        const clients = await getClientsData();
        
        // Convertir clientId a string para comparación consistente
        const clientIdStr = String(clientId);
        
        // Buscar el cliente, asegurándonos de que la comparación sea consistente
        const client = clients.find(c => String(c.id) === clientIdStr);
        
        console.log('Clientes disponibles:', clients.map(c => ({ id: c.id, name: c.name })));
        console.log('Buscando cliente con ID:', clientIdStr, 'Tipo:', typeof clientIdStr);
        console.log('Cliente encontrado:', client);
        
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
        const updatedClients = clients.filter(c => String(c.id) !== clientIdStr);
        console.log('Clientes antes de eliminar:', clients.length, 'Clientes después de eliminar:', updatedClients.length);
        await saveClientsData(updatedClients);
        
        // Actualizar la tabla
        await renderClientsTable();
        
        showMessage(`La clienta "${client.name}" ha sido eliminada correctamente.`, 'success');
    } catch (error) {
        console.error("Error al eliminar cliente:", error);
        showMessage("Error al eliminar el cliente. Inténtalo de nuevo.", "error");
    }
}

/**
 * Configura el modal de movimientos para un cliente específico.
 * @param {string} clientId - ID del cliente
 */
async function setupMovementsModal(clientId) {
    console.log(`Configurando modal de movimientos para cliente ID: ${clientId}`);
    try {
        // Obtener datos del cliente
        const clients = await getClientsData();
        const client = clients.find(c => c.id === clientId);
        
        if (!client) {
            showMessage('Error: No se encontró el cliente', 'error');
            return;
        }
        
        // Actualizar título del modal
        const modalTitle = document.getElementById('movementsModalTitle');
        if (modalTitle) {
            modalTitle.textContent = `Movimientos de ${client.name}`;
        }
        
        // Obtener la tabla de movimientos
        const movementsList = document.getElementById('movementsList');
        if (!movementsList) {
            console.error('No se encontró la tabla de movimientos');
            return;
        }
        
        // Limpiar la tabla
        movementsList.innerHTML = '';
        
        // Verificar si hay movimientos
        if (!client.movements || client.movements.length === 0) {
            movementsList.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-gray-500">
                        No hay movimientos registrados para esta clienta
                    </td>
                </tr>
            `;
        } else {
            // Ordenar movimientos por fecha (más recientes primero)
            const sortedMovements = [...client.movements].sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });
            
            // Renderizar cada movimiento
            sortedMovements.forEach(movement => {
                const row = document.createElement('tr');
                
                // Determinar clase de fila según el tipo de movimiento
                let rowClass = '';
                let typeLabel = '';
                let amountClass = '';
                
                switch(movement.type) {
                    case 'compra':
                        rowClass = 'bg-red-50';
                        typeLabel = 'Compra';
                        amountClass = 'text-red-600';
                        break;
                    case 'pago':
                        rowClass = 'bg-green-50';
                        typeLabel = 'Pago';
                        amountClass = 'text-green-600';
                        break;
                    case 'prueba':
                        rowClass = 'bg-yellow-50';
                        typeLabel = 'Prueba';
                        amountClass = 'text-yellow-600';
                        break;
                }
                
                row.className = rowClass;
                
                // Formatear fecha
                const date = new Date(movement.date);
                const formattedDate = date.toLocaleDateString('es-AR');
                
                row.innerHTML = `
                    <td class="px-4 py-2">${formattedDate}</td>
                    <td class="px-4 py-2">${typeLabel}</td>
                    <td class="px-4 py-2">${movement.item || '-'}</td>
                    <td class="px-4 py-2">${movement.quantity || 1}</td>
                    <td class="px-4 py-2 ${amountClass} font-semibold">${formatCurrency(movement.amount)}</td>
                `;
                
                movementsList.appendChild(row);
            });
        }
        
        // Mostrar deuda actual
        const movementsCurrentDebt = document.getElementById('movementsCurrentDebt');
        if (movementsCurrentDebt) {
            movementsCurrentDebt.textContent = formatCurrency(client.debt || 0);
        }
        
        // Configurar evento para el botón de generar PDF
        const generatePdfBtn = document.getElementById('generatePdfBtn');
        if (generatePdfBtn) {
            // Eliminar event listeners previos para evitar duplicados
            const newBtn = generatePdfBtn.cloneNode(true);
            safeReplaceNode(generatePdfBtn, newBtn);
            
            // Agregar nuevo event listener
            newBtn.addEventListener('click', function() {
                generateMovementsPdf(client);
            });
            console.log('Event listener agregado al botón de generar PDF');
        } else {
            console.error('No se encontró el botón de generar PDF');
        }
        
        // Mostrar el modal
        openModal('movementsModal');
        
    } catch (error) {
        console.error('Error al configurar modal de movimientos:', error);
        showMessage('Error al cargar los movimientos. Inténtalo de nuevo.', 'error');
    }
}

/**
 * Genera un PDF con el historial de movimientos del cliente.
 * @param {Object} client - Objeto del cliente con sus datos y movimientos.
 */
async function generateMovementsPdf(client) {
    console.log('Generando PDF para cliente:', client.name);
    try {
        // Verificar si hay movimientos
        if (!client.movements || client.movements.length === 0) {
            showMessage('No hay movimientos para generar el PDF', 'error', 'movementsMessageArea');
            return;
        }
        
        // Crear un nuevo documento PDF
        const doc = new window.jsPDF();
        
        // Configurar el título y encabezado
        doc.setFontSize(22);
        doc.setTextColor(0, 168, 196); // Color turquesa similar al de la imagen
        doc.text('M&D Home', doc.internal.pageSize.width / 2, 20, { align: 'center' });
        
        doc.setFontSize(16);
        doc.text('Historial de Movimientos', doc.internal.pageSize.width / 2, 30, { align: 'center' });
        
        // Agregar línea divisoria
        doc.setDrawColor(0, 168, 196);
        doc.setLineWidth(0.5);
        doc.line(20, 35, doc.internal.pageSize.width - 20, 35);
        
        // Información del cliente
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Cliente: ${client.name}`, 20, 45);
        doc.text(`Deuda Actual: ${formatCurrency(client.debt || 0)}`, 20, 52);
        
        // Ordenar movimientos por fecha (más recientes primero)
        const sortedMovements = [...client.movements].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        // Preparar datos para la tabla
        const tableData = [];
        
        sortedMovements.forEach(movement => {
            // Formatear fecha
            const date = new Date(movement.date);
            const formattedDate = date.toLocaleDateString('es-AR');
            
            // Determinar tipo de movimiento
            let typeLabel = '';
            switch(movement.type) {
                case 'compra':
                    typeLabel = 'compra';
                    break;
                case 'pago':
                    typeLabel = 'pago';
                    break;
                case 'prueba':
                    typeLabel = 'prueba';
                    break;
            }
            
            // Agregar fila a la tabla
            tableData.push([
                formattedDate,
                typeLabel,
                movement.item || 'Sin producto',
                movement.quantity || 0,
                movement.price ? formatCurrency(movement.price) : '$0',
                movement.payment || 'Total',
                formatCurrency(movement.amount)
            ]);
        });
        
        // Crear la tabla con autoTable
        doc.autoTable({
            startY: 60,
            head: [['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Precio', 'Pago', 'Monto']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [0, 168, 196],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            },
            // Estilos específicos para filas según el tipo de movimiento
            didParseCell: function(data) {
                if (data.section === 'body') {
                    // Si es una fila de tipo 'compra', fondo rojo claro
                    if (data.row.raw[1] === 'compra') {
                        data.cell.styles.fillColor = [255, 240, 240];
                        if (data.column.index === 6) { // Columna de monto
                            data.cell.styles.textColor = [220, 53, 69]; // Rojo
                        }
                    }
                    // Si es una fila de tipo 'pago', fondo verde claro
                    else if (data.row.raw[1] === 'pago') {
                        data.cell.styles.fillColor = [240, 255, 240];
                        if (data.column.index === 6) { // Columna de monto
                            data.cell.styles.textColor = [40, 167, 69]; // Verde
                        }
                    }
                }
            }
        });
        
        // Guardar el PDF
        doc.save(`Movimientos_${client.name.replace(/\s+/g, '_')}.pdf`);
        
        showMessage('PDF generado correctamente', 'success', 'movementsMessageArea');
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        showMessage('Error al generar el PDF. Inténtalo de nuevo.', 'error', 'movementsMessageArea');
    }
}

/**
 * Configura el modal de pruebas para un cliente específico.
 * @param {string} clientId - ID del cliente
 */
async function setupTrialsModal(clientId) {
    console.log(`Configurando modal de pruebas para cliente ID: ${clientId}`);
    try {
        // Obtener datos del cliente
        const clients = await getClientsData();
        const client = clients.find(c => c.id === clientId);
        
        if (!client) {
            showMessage('Error: No se encontró el cliente', 'error');
            return;
        }
        
        // Actualizar título del modal
        const modalTitle = document.getElementById('trialsModalTitle');
        if (modalTitle) {
            modalTitle.textContent = `Pruebas de ${client.name}`;
        }
        
        // Obtener la tabla de pruebas
        const trialsList = document.getElementById('trialsList');
        if (!trialsList) {
            console.error('No se encontró la tabla de pruebas');
            return;
        }
        
        // Limpiar la tabla
        trialsList.innerHTML = '';
        
        // Filtrar solo los movimientos de tipo 'prueba'
        const trials = client.movements ? client.movements.filter(m => m.type === 'prueba') : [];
        
        // Verificar si hay pruebas
        if (trials.length === 0) {
            trialsList.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4 text-gray-500">
                        No hay pruebas registradas para esta clienta
                    </td>
                </tr>
            `;
        } else {
            // Ordenar pruebas por fecha (más recientes primero)
            const sortedTrials = [...trials].sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });
            
            // Renderizar cada prueba
            sortedTrials.forEach(trial => {
                const row = document.createElement('tr');
                row.className = 'bg-yellow-50';
                
                // Formatear fecha
                const date = new Date(trial.date);
                const formattedDate = date.toLocaleDateString('es-AR');
                
                row.innerHTML = `
                    <td class="px-4 py-2">${formattedDate}</td>
                    <td class="px-4 py-2">${trial.item || '-'}</td>
                    <td class="px-4 py-2">${trial.quantity || 1}</td>
                    <td class="px-4 py-2 text-yellow-600 font-semibold">${formatCurrency(trial.price)}</td>
                `;
                
                trialsList.appendChild(row);
            });
        }
        
        // Mostrar el modal
        openModal('trialsModal');
        
    } catch (error) {
        console.error('Error al configurar modal de pruebas:', error);
        showMessage('Error al cargar las pruebas. Inténtalo de nuevo.', 'error');
    }
}

/**
 * Configura el modal de compra para un cliente específico.
 * @param {string} clientId - ID del cliente
 */
async function setupPurchaseModal(clientId) {
    console.log(`Configurando modal de compra para cliente ID: ${clientId}`);
    try {
        // Obtener datos del cliente
        const clients = await getClientsData();
        const client = clients.find(c => c.id === clientId);
        
        if (!client) {
            showMessage('Error: No se encontró el cliente', 'error');
            return;
        }
        
        // Actualizar título del modal y establecer ID del cliente
        const purchaseClientName = document.getElementById('purchaseClientName');
        const purchaseClientId = document.getElementById('purchaseClientId');
        
        if (purchaseClientName) {
            purchaseClientName.textContent = client.name;
            console.log(`Nombre del cliente establecido: ${client.name}`);
        } else {
            console.error('No se encontró el elemento purchaseClientName');
        }
        
        if (purchaseClientId) {
            purchaseClientId.value = clientId;
            console.log(`ID del cliente establecido: ${clientId}`);
        } else {
            console.error('No se encontró el elemento purchaseClientId');
        }
        
        // Cargar productos en el selector
        const purchaseItemSelect = document.getElementById('purchaseItemSelect');
        if (purchaseItemSelect) {
            // Limpiar opciones actuales
            purchaseItemSelect.innerHTML = '<option value="">-- Selecciona un producto --</option>';
            
            // Obtener productos del stock
            const stockData = await getStockData();
            
            // Ordenar productos por nombre
            const sortedStock = [...stockData].sort((a, b) => a.name.localeCompare(b.name));
            
            // Agregar opciones al selector
            sortedStock.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                option.dataset.price = item.price;
                option.dataset.stock = item.quantity || 0;
                purchaseItemSelect.appendChild(option);
            });
            
            // Configurar evento de cambio para actualizar precio y stock
            purchaseItemSelect.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                const priceDisplay = document.getElementById('purchaseItemPrice');
                const stockDisplay = document.getElementById('purchaseAvailableStock');
                
                if (selectedOption && selectedOption.value) {
                    const price = selectedOption.dataset.price;
                    const stock = selectedOption.dataset.stock;
                    
                    if (priceDisplay) {
                        priceDisplay.textContent = formatCurrency(price);
                    }
                    
                    if (stockDisplay) {
                        stockDisplay.textContent = stock;
                    }
                    
                    // Actualizar total
                    updatePurchaseTotal();
                } else {
                    if (priceDisplay) priceDisplay.textContent = '--';
                    if (stockDisplay) stockDisplay.textContent = '--';
                }
            });
        }
        
        // Configurar evento de cambio para cantidad
        const purchaseQuantity = document.getElementById('purchaseQuantity');
        if (purchaseQuantity) {
            purchaseQuantity.value = '1';
            purchaseQuantity.addEventListener('input', updatePurchaseTotal);
        }
        
        // Configurar fecha actual
        const purchaseDate = document.getElementById('purchaseDate');
        if (purchaseDate) {
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
            purchaseDate.value = formattedDate;
        }
        
        // Configurar event listeners para los botones de pago
        const fullPaymentBtn = document.getElementById('fullPaymentBtn');
        const partialPaymentBtn = document.getElementById('partialPaymentBtn');
        const noPaymentBtn = document.getElementById('noPaymentBtn');
        
        if (fullPaymentBtn) {
            // Eliminar event listeners previos
            const newBtn = fullPaymentBtn.cloneNode(true);
            safeReplaceNode(fullPaymentBtn, newBtn);
            
            // Agregar nuevo event listener
            newBtn.addEventListener('click', handleFullPayment);
            console.log('Event listener agregado al botón de pago total');
        } else {
            console.error('No se encontró el botón de pago total');
        }
        
        if (partialPaymentBtn) {
            // Eliminar event listeners previos
            const newBtn = partialPaymentBtn.cloneNode(true);
            safeReplaceNode(partialPaymentBtn, newBtn);
            
            // Agregar nuevo event listener
            newBtn.addEventListener('click', handlePartialPayment);
            console.log('Event listener agregado al botón de pago parcial');
        } else {
            console.error('No se encontró el botón de pago parcial');
        }
        
        if (noPaymentBtn) {
            // Eliminar event listeners previos
            const newBtn = noPaymentBtn.cloneNode(true);
            safeReplaceNode(noPaymentBtn, newBtn);
            
            // Agregar nuevo event listener
            newBtn.addEventListener('click', handleNoPayment);
            console.log('Event listener agregado al botón de no pago');
        } else {
            console.error('No se encontró el botón de no pago');
        }
        
        // Mostrar el modal
        openModal('purchaseModal');
        
    } catch (error) {
        console.error('Error al configurar modal de compra:', error);
        showMessage('Error al cargar el formulario de compra. Inténtalo de nuevo.', 'error');
    }
}

/**
 * Actualiza el total de la compra en el modal de compra.
 */
function updatePurchaseTotal() {
    const purchaseItemSelect = document.getElementById('purchaseItemSelect');
    const purchaseQuantity = document.getElementById('purchaseQuantity');
    const purchaseTotal = document.getElementById('purchaseTotal');
    
    if (purchaseItemSelect && purchaseQuantity && purchaseTotal) {
        const selectedOption = purchaseItemSelect.options[purchaseItemSelect.selectedIndex];
        
        if (selectedOption && selectedOption.value) {
            const price = parseFloat(selectedOption.dataset.price) || 0;
            const quantity = parseInt(purchaseQuantity.value) || 1;
            const total = price * quantity;
            
            purchaseTotal.textContent = formatCurrency(total);
        } else {
            purchaseTotal.textContent = '--';
        }
    }
}

/**
 * Configura el modal de pago para un cliente específico.
 * @param {string} clientId - ID del cliente
 */
async function setupPaymentModal(clientId) {
    console.log(`Configurando modal de pago para cliente ID: ${clientId}`);
    try {
        // Obtener datos del cliente
        const clients = await getClientsData();
        const client = clients.find(c => c.id === clientId);
        
        if (!client) {
            showMessage('Error: No se encontró el cliente', 'error');
            return;
        }
        
        // Actualizar el nombre del cliente
        const paymentClientName = document.getElementById('paymentClientName');
        if (paymentClientName) {
            paymentClientName.textContent = client.name;
            console.log(`Nombre del cliente establecido: ${client.name}`);
        } else {
            console.error('No se encontró el elemento paymentClientName');
        }
        
        // Establecer ID del cliente en el campo oculto
        const paymentClientId = document.getElementById('paymentClientId');
        if (paymentClientId) {
            paymentClientId.value = clientId;
        }
        
        // Mostrar la deuda actual del cliente
        const paymentCurrentDebt = document.getElementById('paymentCurrentDebt');
        if (paymentCurrentDebt) {
            paymentCurrentDebt.textContent = formatCurrency(client.debt || 0);
            console.log(`Deuda actual establecida: ${formatCurrency(client.debt || 0)}`);
        } else {
            console.error('No se encontró el elemento paymentCurrentDebt');
        }
        
        // Limpiar el campo de monto de pago (no autocompletar)
        const paymentAmount = document.getElementById('paymentAmount');
        if (paymentAmount) {
            paymentAmount.value = '';
            console.log('Campo de monto de pago limpiado');
        }
        
        // Configurar fecha actual
        const paymentDate = document.getElementById('paymentDate');
        if (paymentDate) {
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
            paymentDate.value = formattedDate;
        }
        
        // Configurar el evento de envío del formulario de pago
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            // Eliminar event listeners previos para evitar duplicados
            const newForm = paymentForm.cloneNode(true);
            safeReplaceNode(paymentForm, newForm);
            
            // Agregar nuevo event listener
            newForm.addEventListener('submit', handlePaymentSubmit);
            console.log('Event listener agregado al formulario de pago');
        } else {
            console.error('No se encontró el formulario de pago');
        }
        
        // Mostrar el modal
        openModal('paymentModal');
        
    } catch (error) {
        console.error('Error al configurar modal de pago:', error);
        showMessage('Error al cargar el formulario de pago. Inténtalo de nuevo.', 'error');
    }
}

/**
 * Maneja el pago completo de una compra.
 */
async function handleFullPayment() {
    console.log('Procesando pago completo');
    try {
        const clientId = document.getElementById('purchaseClientId').value;
        const itemName = document.getElementById('purchaseItemSelect').value;
        const quantity = parseInt(document.getElementById('purchaseQuantity').value) || 1;
        const date = document.getElementById('purchaseDate').value;
        
        if (!clientId || !itemName || !date) {
            showMessage("Completa todos los campos requeridos.", "error", "purchaseMessageArea");
            return;
        }
        
        // Obtener el precio unitario del item seleccionado
        const selectedOption = document.getElementById('purchaseItemSelect').options[
            document.getElementById('purchaseItemSelect').selectedIndex
        ];
        const unitPrice = parseFloat(selectedOption.dataset.price);
        const total = unitPrice * quantity;
        
        // Verificar stock disponible
        const availableStock = parseInt(selectedOption.dataset.stock) || 0;
        if (availableStock < quantity) {
            showMessage(`No hay suficiente stock disponible para ${itemName}.`, "error", "purchaseMessageArea");
            return;
        }
        
        // Actualizar stock
        const stockData = await getStockData();
        const itemIndex = stockData.findIndex(item => item.name === itemName);
        
        if (itemIndex === -1) {
            showMessage("Error: No se encontró el producto en el stock.", "error", "purchaseMessageArea");
            return;
        }
        
        stockData[itemIndex].quantity = (stockData[itemIndex].quantity || 0) - quantity;
        await saveStockData(stockData);
        
        // Actualizar cliente
        const clientsData = await getClientsData();
        const clientIndex = clientsData.findIndex(c => c.id === clientId);
        
        if (clientIndex === -1) {
            showMessage("Error: No se encontró la clienta.", "error", "purchaseMessageArea");
            return;
        }
        
        // Crear nuevo movimiento
        const newMovement = {
            type: 'compra',
            date: date,
            item: itemName,
            quantity: quantity,
            price: unitPrice,
            payment: 'total',
            amount: total
        };
        
        // Agregar movimiento al cliente
        if (!clientsData[clientIndex].movements) {
            clientsData[clientIndex].movements = [];
        }
        
        clientsData[clientIndex].movements.push(newMovement);
        
        // Guardar cambios
        await saveClientsData(clientsData);
        
        // Cerrar modal y mostrar mensaje
        closeModal('purchaseModal');
        showMessage(`Compra registrada correctamente para ${clientsData[clientIndex].name}.`, "success");
        
    } catch (error) {
        console.error('Error al procesar pago completo:', error);
        showMessage('Error al registrar la compra. Inténtalo de nuevo.', 'error', 'purchaseMessageArea');
    }
}

/**
 * Maneja el pago parcial de una compra.
 */
async function handlePartialPayment() {
    console.log('Procesando pago parcial');
    
    try {
        // Mostrar el contenedor de pago parcial
        const partialPaymentContainer = document.getElementById('partialPaymentContainer');
        if (partialPaymentContainer) {
            partialPaymentContainer.classList.remove('hidden');
            
            // Configurar el botón de registrar pago parcial
            const registerPartialPaymentBtn = document.getElementById('registerPartialPaymentBtn');
            if (registerPartialPaymentBtn) {
                // Eliminar event listeners previos
                const newBtn = registerPartialPaymentBtn.cloneNode(true);
                safeReplaceNode(registerPartialPaymentBtn, newBtn);
                
                // Agregar nuevo event listener
                newBtn.addEventListener('click', async function() {
                    await processPartialPayment();
                });
            }
        } else {
            console.error('No se encontró el contenedor de pago parcial');
            showMessage('Error al procesar pago parcial. Inténtalo de nuevo.', 'error', 'purchaseMessageArea');
        }
    } catch (error) {
        console.error('Error al procesar pago parcial:', error);
        showMessage('Error al procesar pago parcial. Inténtalo de nuevo.', 'error', 'purchaseMessageArea');
    }
}

/**
 * Procesa el pago parcial de una compra.
 */
async function processPartialPayment() {
    console.log('Procesando pago parcial');
    try {
        const clientId = document.getElementById('purchaseClientId').value;
        const itemName = document.getElementById('purchaseItemSelect').value;
        const quantity = parseInt(document.getElementById('purchaseQuantity').value) || 1;
        const date = document.getElementById('purchaseDate').value;
        const partialAmount = parseFloat(document.getElementById('partialPaymentAmount').value) || 0;
        
        if (!clientId || !itemName || !date) {
            showMessage("Completa todos los campos requeridos.", "error", "purchaseMessageArea");
            return;
        }
        
        // Obtener el precio unitario del item seleccionado
        const selectedOption = document.getElementById('purchaseItemSelect').options[
            document.getElementById('purchaseItemSelect').selectedIndex
        ];
        const unitPrice = parseFloat(selectedOption.dataset.price);
        const total = unitPrice * quantity;
        
        // Verificar que el monto parcial no sea mayor al total
        if (partialAmount > total) {
            showMessage(`El monto abonado (${formatCurrency(partialAmount)}) no puede ser mayor al total de la compra (${formatCurrency(total)})`, "error", "purchaseMessageArea");
            return;
        }
        
        // Verificar que el monto parcial sea mayor a cero
        if (partialAmount <= 0) {
            showMessage("El monto abonado debe ser mayor a cero.", "error", "purchaseMessageArea");
            return;
        }
        
        // Verificar stock disponible
        const availableStock = parseInt(selectedOption.dataset.stock) || 0;
        if (availableStock < quantity) {
            showMessage(`No hay suficiente stock disponible para ${itemName}.`, "error", "purchaseMessageArea");
            return;
        }
        
        // Actualizar stock
        const stockData = await getStockData();
        const itemIndex = stockData.findIndex(item => item.name === itemName);
        
        if (itemIndex === -1) {
            showMessage("Error: No se encontró el producto en el stock.", "error", "purchaseMessageArea");
            return;
        }
        
        stockData[itemIndex].quantity = (stockData[itemIndex].quantity || 0) - quantity;
        await saveStockData(stockData);
        
        // Actualizar cliente
        const clientsData = await getClientsData();
        const clientIndex = clientsData.findIndex(c => c.id === clientId);
        
        if (clientIndex === -1) {
            showMessage("Error: No se encontró la clienta.", "error", "purchaseMessageArea");
            return;
        }
        
        // Calcular deuda
        const debtAmount = total - partialAmount;
        
        // Actualizar deuda del cliente
        clientsData[clientIndex].debt = (clientsData[clientIndex].debt || 0) + debtAmount;
        
        // Crear nuevo movimiento
        const newMovement = {
            type: 'compra',
            date: date,
            item: itemName,
            quantity: quantity,
            price: unitPrice,
            payment: 'parcial',
            amountPaid: partialAmount,
            amountDebt: debtAmount,
            amount: total
        };
        
        // Agregar movimiento al cliente
        if (!clientsData[clientIndex].movements) {
            clientsData[clientIndex].movements = [];
        }
        
        clientsData[clientIndex].movements.push(newMovement);
        
        // Guardar cambios
        await saveClientsData(clientsData);
        
        // Cerrar modal y mostrar mensaje
        closeModal('purchaseModal');
        showMessage(`Compra con pago parcial registrada correctamente para ${clientsData[clientIndex].name}. Deuda: ${formatCurrency(debtAmount)}`, "success");
        
        // Actualizar la tabla de clientes
        await renderClientsTable();
        
    } catch (error) {
        console.error('Error al procesar pago parcial:', error);
        showMessage('Error al registrar la compra con pago parcial. Inténtalo de nuevo.', 'error', 'purchaseMessageArea');
    }
}

/**
 * Maneja la compra sin pago (a cuenta).
 */
async function handleNoPayment() {
    console.log('Procesando compra sin pago');
    
    try {
        const clientId = document.getElementById('purchaseClientId').value;
        const itemName = document.getElementById('purchaseItemSelect').value;
        const quantity = parseInt(document.getElementById('purchaseQuantity').value) || 1;
        const date = document.getElementById('purchaseDate').value;
        
        if (!clientId || !itemName || !date) {
            showMessage("Completa todos los campos requeridos.", "error", "purchaseMessageArea");
            return;
        }
        
        // Obtener el precio unitario del item seleccionado
        const selectedOption = document.getElementById('purchaseItemSelect').options[
            document.getElementById('purchaseItemSelect').selectedIndex
        ];
        const unitPrice = parseFloat(selectedOption.dataset.price);
        const total = unitPrice * quantity;
        
        // Verificar stock disponible
        const availableStock = parseInt(selectedOption.dataset.stock) || 0;
        if (availableStock < quantity) {
            showMessage(`No hay suficiente stock disponible para ${itemName}.`, "error", "purchaseMessageArea");
            return;
        }
        
        // Actualizar stock
        const stockData = await getStockData();
        const itemIndex = stockData.findIndex(item => item.name === itemName);
        
        if (itemIndex === -1) {
            showMessage("Error: No se encontró el producto en el stock.", "error", "purchaseMessageArea");
            return;
        }
        
        stockData[itemIndex].quantity = (stockData[itemIndex].quantity || 0) - quantity;
        await saveStockData(stockData);
        
        // Actualizar cliente
        const clientsData = await getClientsData();
        const clientIndex = clientsData.findIndex(c => c.id === clientId);
        
        if (clientIndex === -1) {
            showMessage("Error: No se encontró la clienta.", "error", "purchaseMessageArea");
            return;
        }
        
        // Actualizar deuda del cliente
        clientsData[clientIndex].debt = (clientsData[clientIndex].debt || 0) + total;
        
        // Crear nuevo movimiento
        const newMovement = {
            type: 'compra',
            date: date,
            item: itemName,
            quantity: quantity,
            price: unitPrice,
            payment: 'sin pago',
            amountDebt: total,
            amount: total
        };
        
        // Agregar movimiento al cliente
        if (!clientsData[clientIndex].movements) {
            clientsData[clientIndex].movements = [];
        }
        
        clientsData[clientIndex].movements.push(newMovement);
        
        // Guardar cambios
        await saveClientsData(clientsData);
        
        // Cerrar modal y mostrar mensaje
        closeModal('purchaseModal');
        showMessage(`Compra sin pago registrada correctamente para ${clientsData[clientIndex].name}. Deuda: ${formatCurrency(total)}`, "success");
        
        // Actualizar la tabla de clientes
        await renderClientsTable();
        
    } catch (error) {
        console.error('Error al procesar compra sin pago:', error);
        showMessage('Error al registrar la compra sin pago. Inténtalo de nuevo.', 'error', 'purchaseMessageArea');
    }
}

/**
 * Maneja el envío del formulario de pago.
 */
async function handlePaymentSubmit(event) {
    event.preventDefault();
    console.log('Procesando formulario de pago');
    
    try {
        const clientId = document.getElementById('paymentClientId').value;
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const date = document.getElementById('paymentDate').value;
        // El campo paymentNotes no existe en el HTML, por lo que no intentamos acceder a él
        const notes = '';
        
        if (!clientId || isNaN(amount) || amount <= 0 || !date) {
            showMessage("Completa todos los campos requeridos correctamente.", "error", "paymentMessageArea");
            return;
        }
        
        // Actualizar cliente
        const clientsData = await getClientsData();
        const clientIndex = clientsData.findIndex(c => c.id === clientId);
        
        if (clientIndex === -1) {
            showMessage("Error: No se encontró la clienta.", "error", "paymentMessageArea");
            return;
        }
        
        // Verificar que el monto no sea mayor a la deuda
        const currentDebt = clientsData[clientIndex].debt || 0;
        if (amount > currentDebt) {
            showMessage(`El monto del pago (${formatCurrency(amount)}) no puede ser mayor a la deuda actual (${formatCurrency(currentDebt)})`, "error", "paymentMessageArea");
            return;
        }
        
        // Crear nuevo movimiento
        const newMovement = {
            type: 'pago',
            date: date,
            amount: amount,
            notes: notes
        };
        
        // Actualizar deuda del cliente
        clientsData[clientIndex].debt = currentDebt - amount;
        
        // Agregar movimiento al cliente
        if (!clientsData[clientIndex].movements) {
            clientsData[clientIndex].movements = [];
        }
        
        clientsData[clientIndex].movements.push(newMovement);
        
        // Guardar cambios
        await saveClientsData(clientsData);
        
        // Cerrar modal y mostrar mensaje
        closeModal('paymentModal');
        showMessage(`Pago de ${formatCurrency(amount)} registrado correctamente para ${clientsData[clientIndex].name}.`, "success");
        
        // Actualizar la tabla de clientes
        await renderClientsTable();
        
    } catch (error) {
        console.error('Error al procesar pago:', error);
        showMessage('Error al registrar el pago. Inténtalo de nuevo.', 'error', 'paymentMessageArea');
    }
}

/**
 * Muestra un mensaje en el área de mensajes.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} type - El tipo de mensaje ('success', 'error', 'info').
 * @param {string} [areaId='messageArea'] - El ID del área de mensajes.
 */
function showMessage(message, type = 'info', areaId = 'messageArea') {
    const messageArea = document.getElementById(areaId);
    if (!messageArea) {
        console.error(`Área de mensajes no encontrada: ${areaId}`);
        alert(message); // Fallback a alert si no se encuentra el área de mensajes
        return;
    }

    // Limpiar mensajes anteriores
    messageArea.innerHTML = '';

    // Crear el nuevo mensaje
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `message-${type}`);
    messageElement.textContent = message;

    // Agregar clases de estilo según el tipo
    if (type === 'success') {
        messageElement.classList.add('bg-green-100', 'border-green-400', 'text-green-700');
    } else if (type === 'error') {
        messageElement.classList.add('bg-red-100', 'border-red-400', 'text-red-700');
    } else {
        messageElement.classList.add('bg-blue-100', 'border-blue-400', 'text-blue-700');
    }

    // Agregar clases comunes
    messageElement.classList.add('border', 'px-4', 'py-3', 'rounded', 'relative', 'mb-4');

    // Agregar el mensaje al área
    messageArea.appendChild(messageElement);

    // Auto-eliminar después de 5 segundos si es success
    if (type === 'success') {
        setTimeout(() => {
            messageElement.remove();
        }, 5000);
    }
}

/**
 * Abre un modal.
 * @param {string} modalId - El ID del modal a abrir.
 */
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

/**
 * Cierra un modal.
 * @param {string} modalId - El ID del modal a cerrar.
 */
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

/**
 * Formatea un valor numérico como moneda.
 * @param {number} value - El valor a formatear.
 * @returns {string} El valor formateado como moneda.
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Exponer las funciones necesarias globalmente
// Hacerlo de esta manera para asegurar que las funciones estén disponibles
// incluso cuando se importa el módulo con import
Object.assign(window, {
    // Funciones principales
    initClientsPage,
    renderClientsTable,
    initVentasPage,
    
    // Funciones de manejo de clientes
    handleAddClient,
    handleDeleteClient,
    
    // Funciones de modales
    setupMovementsModal,
    setupTrialsModal,
    setupPurchaseModal,
    setupPaymentModal,
    
    // Funciones de compras y pagos
    handleFullPayment,
    handlePartialPayment,
    handleNoPayment,
    handlePaymentSubmit,
    updatePurchaseTotal,
    
    // Funciones de estadísticas
    loadVentasStats,
    setupCharts,
    
    // Funciones de utilidad
    openModal,
    closeModal,
    showMessage,
    formatCurrency,
    getNextClientId,
    configureModalButtons
});

// La función configureModalButtons ya está definida anteriormente en este archivo
// No necesitamos redefinirla aquí

/**
 * Inicializa la página de ventas y muestra las estadísticas.
 */
async function initVentasPage() {
    console.log('Inicializando página de ventas...');
    
    try {
        // Configurar los filtros de fecha
        setupDateFilters();
        
        // Cargar datos y calcular estadísticas
        await loadVentasStats();
        
        // Configurar gráficos
        setupCharts();
        
        console.log('Página de ventas inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la página de ventas:', error);
        showMessage('Error al cargar las estadísticas. Inténtalo de nuevo.', 'error');
    }
}

/**
 * Configura los filtros de fecha y sus event listeners.
 */
function setupDateFilters() {
    console.log('Configurando filtros de fecha...');
    
    // Establecer fechas por defecto (mes actual)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const applyFiltersBtn = document.getElementById('applyFilters');
    
    if (startDateInput) {
        startDateInput.valueAsDate = firstDayOfMonth;
    }
    
    if (endDateInput) {
        endDateInput.valueAsDate = today;
    }
    
    // Configurar event listener para el botón de aplicar filtros
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', async function() {
            await loadVentasStats();
            setupCharts();
        });
    }
}

/**
 * Carga los datos y calcula las estadísticas de ventas.
 */
async function loadVentasStats() {
    console.log('Cargando estadísticas de ventas...');
    
    try {
        // Obtener fechas de los filtros
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        console.log(`Calculando estadísticas desde ${startDate} hasta ${endDate}`);
        
        // Cargar datos
        const stockData = await getStockData();
        const clientsData = await getClientsData();
        
        // Extraer datos de ventas de los movimientos de los clientes
        const salesData = [];
        
        clientsData.forEach(client => {
            if (client.movements && Array.isArray(client.movements)) {
                client.movements.forEach(movement => {
                    // Solo considerar movimientos de tipo 'compra'
                    if (movement.type === 'compra') {
                        salesData.push({
                            date: movement.date,
                            clientId: client.id,
                            clientName: client.name,
                            product: movement.item || 'Sin especificar',
                            quantity: movement.quantity || 1,
                            price: movement.price || 0,
                            total: movement.amount || 0,
                            payment: movement.payment || 'total'
                        });
                    }
                });
            }
        });
        
        console.log(`Total de ventas encontradas: ${salesData.length}`);
        
        // Filtrar datos por fecha si hay fechas seleccionadas
        let filteredSales = salesData;
        if (startDate && endDate) {
            const startTimestamp = new Date(startDate).getTime();
            const endTimestamp = new Date(endDate).setHours(23, 59, 59, 999); // Final del día
            
            filteredSales = salesData.filter(sale => {
                const saleDate = new Date(sale.date).getTime();
                return saleDate >= startTimestamp && saleDate <= endTimestamp;
            });
        }
        
        // Calcular estadísticas
        const stats = calculateStats(filteredSales, clientsData, stockData);
        
        // Actualizar la UI con las estadísticas
        updateStatsUI(stats);
        
        return stats;
    } catch (error) {
        console.error('Error al cargar las estadísticas:', error);
        showMessage('Error al cargar las estadísticas. Inténtalo de nuevo.', 'error');
        throw error;
    }
}

/**
 * Calcula las estadísticas basadas en los datos filtrados.
 */
function calculateStats(salesData, clientsData, stockData) {
    console.log('Calculando estadísticas...');
    
    // Inicializar objeto de estadísticas
    const stats = {
        cantidadVentas: salesData.length,  // Cantidad de ventas en el período filtrado
        totalDeudas: 0,                    // Sumatoria de deuda de todos los clientes
        costoVentas: 0,                    // Sumatoria del costo de los productos ya vendidos
        netoVentas: 0,                     // Sumatoria del valor de ventas de los productos vendidos
        gananciaVentas: 0,                 // Resultado de la resta entre netoVentas y costoVentas
        capitalInvertido: 0,               // Suma del valor de costo de todos los productos en stock
        capitalProyectado: 0,              // Suma del valor de venta de todos los productos en stock
        gananciaTotal: 0,                  // Resultado de la resta entre capitalProyectado y capitalInvertido
        productosVendidos: 0,              // Cantidad total de productos vendidos
        ventasPorProducto: {},             // Datos para el gráfico de ventas por producto
        ventasPorDia: {},                  // Datos para el gráfico de ventas por día
        clientesConDeuda: 0                // Cantidad de clientes con deuda pendiente
    };
    
    // 1. Calcular ventas y productos vendidos en el período filtrado
    salesData.forEach(sale => {
        // Neto ventas: suma del valor de venta de productos vendidos
        stats.netoVentas += sale.total || 0;
        
        // Costo ventas: suma del costo de productos vendidos
        // Si el producto tiene costo registrado, usarlo; si no, estimar como 60% del precio de venta
        const costPerUnit = sale.costPrice || (sale.price ? sale.price * 0.6 : 0);
        stats.costoVentas += costPerUnit * (sale.quantity || 1);
        
        // Cantidad de productos vendidos
        stats.productosVendidos += sale.quantity || 1;
        
        // Ventas por producto (para gráfico)
        const productName = sale.product || 'Sin especificar';
        if (!stats.ventasPorProducto[productName]) {
            stats.ventasPorProducto[productName] = {
                cantidad: 0,
                total: 0
            };
        }
        stats.ventasPorProducto[productName].cantidad += sale.quantity || 1;
        stats.ventasPorProducto[productName].total += sale.total || 0;
        
        // Ventas por día (para gráfico)
        const saleDate = new Date(sale.date).toISOString().split('T')[0];
        if (!stats.ventasPorDia[saleDate]) {
            stats.ventasPorDia[saleDate] = 0;
        }
        stats.ventasPorDia[saleDate] += sale.total || 0;
    });
    
    // 2. Calcular total de deudas y clientes con deuda (independiente del período)
    clientsData.forEach(client => {
        // Sumar todas las deudas de clientes
        const deuda = client.debt || 0;
        stats.totalDeudas += deuda;
        
        // Contar clientes con deuda pendiente
        if (deuda > 0) {
            stats.clientesConDeuda++;
        }
    });
    
    // 3. Calcular capital invertido y proyectado (basado en stock actual)
    stockData.forEach(item => {
        const quantity = item.quantity || 0;
        
        // Si no hay cantidad en stock, no sumamos nada
        if (quantity <= 0) return;
        
        // Capital invertido: suma del valor de costo de todos los productos en stock
        const costPrice = item.costPrice || 0;
        stats.capitalInvertido += costPrice * quantity;
        
        // Capital proyectado: suma del valor de venta de todos los productos en stock
        const sellPrice = item.price || 0;
        stats.capitalProyectado += sellPrice * quantity;
    });
    
    // 4. Calcular ganancias
    // Ganancia ventas: resultado de la resta entre netoVentas y costoVentas
    stats.gananciaVentas = stats.netoVentas - stats.costoVentas;
    
    // Ganancia total: resultado de la resta entre capitalProyectado y capitalInvertido
    stats.gananciaTotal = stats.capitalProyectado - stats.capitalInvertido;
    
    console.log('Estadísticas calculadas:', stats);
    return stats;
}

/**
 * Actualiza la interfaz de usuario con las estadísticas calculadas.
 */
function updateStatsUI(stats) {
    console.log('Actualizando UI con estadísticas...');
    
    // Actualizar contadores principales
    updateElementText('cantidadVentas', stats.cantidadVentas);
    updateElementText('totalDeudas', formatCurrency(stats.totalDeudas));
    updateElementText('costoVentas', formatCurrency(stats.costoVentas));
    updateElementText('netoVentas', formatCurrency(stats.netoVentas));
    updateElementText('gananciaVentas', formatCurrency(stats.gananciaVentas));
    
    // Actualizar estadísticas de capital
    updateElementText('capitalInvertido', formatCurrency(stats.capitalInvertido));
    updateElementText('capitalProyectado', formatCurrency(stats.capitalProyectado));
    updateElementText('gananciaTotal', formatCurrency(stats.gananciaTotal));
    
    // Actualizar contadores adicionales
    updateElementText('productosVendidos', stats.productosVendidos);
    updateElementText('clientesConDeuda', stats.clientesConDeuda);
}

/**
 * Actualiza el texto de un elemento si existe.
 */
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Configura los gráficos de la página de ventas.
 */
async function setupCharts() {
    console.log('Configurando gráficos...');
    
    try {
        // Obtener datos para los gráficos
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        // Cargar datos
        const stockData = await getStockData();
        const clientsData = await getClientsData();
        const salesData = await getSalesData();
        
        // Filtrar datos por fecha si hay fechas seleccionadas
        let filteredSales = salesData;
        if (startDate && endDate) {
            const startTimestamp = new Date(startDate).getTime();
            const endTimestamp = new Date(endDate).setHours(23, 59, 59, 999); // Final del día
            
            filteredSales = salesData.filter(sale => {
                const saleDate = new Date(sale.date).getTime();
                return saleDate >= startTimestamp && saleDate <= endTimestamp;
            });
        }
        
        // Crear gráfico de ventas por día
        createSalesByDayChart(filteredSales);
        
        // Crear gráfico de ventas por producto
        createSalesByProductChart(filteredSales);
        
    } catch (error) {
        console.error('Error al configurar los gráficos:', error);
    }
}

/**
 * Crea un gráfico de ventas por día.
 */
function createSalesByDayChart(salesData) {
    console.log('Creando gráfico de ventas por día...');
    
    const chartCanvas = document.getElementById('salesByDayChart');
    if (!chartCanvas) {
        console.error('No se encontró el canvas para el gráfico de ventas por día');
        return;
    }
    
    // Agrupar ventas por día
    const salesByDay = {};
    salesData.forEach(sale => {
        const saleDate = new Date(sale.date).toISOString().split('T')[0];
        if (!salesByDay[saleDate]) {
            salesByDay[saleDate] = 0;
        }
        salesByDay[saleDate] += sale.total || 0;
    });
    
    // Ordenar fechas
    const sortedDates = Object.keys(salesByDay).sort();
    
    // Preparar datos para el gráfico
    const chartData = {
        labels: sortedDates.map(date => formatDate(date)),
        datasets: [{
            label: 'Ventas por día',
            data: sortedDates.map(date => salesByDay[date]),
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
        }]
    };
    
    // Destruir gráfico existente si hay uno
    if (window.salesByDayChart) {
        window.salesByDayChart.destroy();
    }
    
    // Crear nuevo gráfico
    window.salesByDayChart = new Chart(chartCanvas, {
        type: 'bar',
        data: chartData,
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Crea un gráfico de ventas por producto.
 */
function createSalesByProductChart(salesData) {
    console.log('Creando gráfico de ventas por producto...');
    
    const chartCanvas = document.getElementById('salesByProductChart');
    if (!chartCanvas) {
        console.error('No se encontró el canvas para el gráfico de ventas por producto');
        return;
    }
    
    // Agrupar ventas por producto
    const salesByProduct = {};
    salesData.forEach(sale => {
        const productName = sale.product || 'Sin especificar';
        if (!salesByProduct[productName]) {
            salesByProduct[productName] = 0;
        }
        salesByProduct[productName] += sale.total || 0;
    });
    
    // Ordenar productos por total de ventas (de mayor a menor)
    const sortedProducts = Object.keys(salesByProduct).sort((a, b) => salesByProduct[b] - salesByProduct[a]);
    
    // Limitar a los 10 productos más vendidos
    const topProducts = sortedProducts.slice(0, 10);
    
    // Colores para el gráfico
    const backgroundColors = [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        'rgba(199, 199, 199, 0.2)',
        'rgba(83, 102, 255, 0.2)',
        'rgba(40, 159, 64, 0.2)',
        'rgba(210, 199, 199, 0.2)'
    ];
    
    const borderColors = [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(199, 199, 199, 1)',
        'rgba(83, 102, 255, 1)',
        'rgba(40, 159, 64, 1)',
        'rgba(210, 199, 199, 1)'
    ];
    
    // Preparar datos para el gráfico
    const chartData = {
        labels: topProducts,
        datasets: [{
            label: 'Ventas por producto',
            data: topProducts.map(product => salesByProduct[product]),
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1
        }]
    };
    
    // Destruir gráfico existente si hay uno
    if (window.salesByProductChart) {
        window.salesByProductChart.destroy();
    }
    
    // Crear nuevo gráfico
    window.salesByProductChart = new Chart(chartCanvas, {
        type: 'pie',
        data: chartData,
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            }
        }
    });
}

// Formatear fecha para mostrar en gráficos
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, verificando página actual...');
    
    // Detectar la página actual y ejecutar la inicialización correspondiente
    if (document.getElementById('page-clientes')) {
        console.log('Página de clientes detectada, inicializando...');
        setTimeout(() => {
            if (typeof window.initClientsPage === 'function') {
                window.initClientsPage();
            } else {
                console.error('La función initClientsPage no está disponible');
            }
        }, 100);
    } else if (document.getElementById('page-stock')) {
        console.log('Página de stock detectada');
        // Agregar inicialización de stock cuando sea necesario
    } else if (document.getElementById('page-ventas')) {
        console.log('Página de ventas detectada');
        setTimeout(() => {
            if (typeof window.initVentasPage === 'function') {
                window.initVentasPage();
            } else {
                console.error('La función initVentasPage no está disponible');
            }
        }, 100);
    }
});
console.log("Firebase integrado correctamente con la aplicación");
