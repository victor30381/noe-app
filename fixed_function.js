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
