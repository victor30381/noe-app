// test_data.js - Script para generar datos de prueba

/**
 * Genera datos de prueba para la aplicación M&D Home
 * Incluye clientes con movimientos de compra para probar las estadísticas
 */
function generarDatosPrueba() {
    console.log('Generando datos de prueba...');
    
    // Limpiar datos existentes
    localStorage.removeItem('bella_stock');
    localStorage.removeItem('bella_clients');
    localStorage.removeItem('bella_sales');
    localStorage.removeItem('bella_nextClientId');
    
    // Crear productos de prueba
    const stockPrueba = [
        {
            name: "Remera Básica",
            description: "Remera de algodón básica",
            costPrice: 5000,
            price: 10000,
            sizes: {
                "S": 5,
                "M": 5,
                "L": 5
            }
        },
        {
            name: "Pantalón Jean",
            description: "Pantalón jean clásico",
            costPrice: 8000,
            price: 15000,
            sizes: {
                "38": 3,
                "40": 3,
                "42": 3
            }
        },
        {
            name: "Vestido Floral",
            description: "Vestido estampado floral",
            costPrice: 10000,
            price: 18000,
            sizes: {
                "S": 2,
                "M": 2,
                "L": 2
            }
        }
    ];
    
    // Guardar stock
    localStorage.setItem('bella_stock', JSON.stringify(stockPrueba));
    
    // Crear clientes con movimientos
    const fechaHoy = new Date();
    const fechaAyer = new Date();
    fechaAyer.setDate(fechaAyer.getDate() - 1);
    const fechaSemanaAnterior = new Date();
    fechaSemanaAnterior.setDate(fechaSemanaAnterior.getDate() - 7);
    
    const clientesPrueba = [
        {
            id: 1,
            name: "María López",
            phone: "1122334455",
            email: "maria@example.com",
            debt: 5000,
            movements: [
                {
                    type: 'compra',
                    date: fechaHoy.toISOString().split('T')[0],
                    item: "Remera Básica",
                    size: "M",
                    quantity: 1,
                    price: 10000,
                    payment: 'total',
                    amount: 10000
                },
                {
                    type: 'compra',
                    date: fechaSemanaAnterior.toISOString().split('T')[0],
                    item: "Pantalón Jean",
                    size: "40",
                    quantity: 1,
                    price: 15000,
                    payment: 'partial',
                    amount: 10000
                }
            ]
        },
        {
            id: 2,
            name: "Laura Gómez",
            phone: "5566778899",
            email: "laura@example.com",
            debt: 18000,
            movements: [
                {
                    type: 'compra',
                    date: fechaAyer.toISOString().split('T')[0],
                    item: "Vestido Floral",
                    size: "S",
                    quantity: 1,
                    price: 18000,
                    payment: 'none',
                    amount: 0
                }
            ]
        },
        {
            id: 3,
            name: "Ana Martínez",
            phone: "1155667788",
            email: "ana@example.com",
            debt: 0,
            movements: [
                {
                    type: 'compra',
                    date: fechaHoy.toISOString().split('T')[0],
                    item: "Remera Básica",
                    size: "L",
                    quantity: 2,
                    price: 20000,
                    payment: 'total',
                    amount: 20000
                }
            ]
        }
    ];
    
    // Guardar clientes
    localStorage.setItem('bella_clients', JSON.stringify(clientesPrueba));
    localStorage.setItem('bella_nextClientId', '4');
    
    console.log('Datos de prueba generados correctamente');
    alert('Datos de prueba generados correctamente. Recarga la página para ver los cambios.');
}

// Botón para generar datos de prueba
document.addEventListener('DOMContentLoaded', function() {
    const btnContainer = document.createElement('div');
    btnContainer.style.position = 'fixed';
    btnContainer.style.bottom = '20px';
    btnContainer.style.right = '20px';
    btnContainer.style.zIndex = '1000';
    
    const btn = document.createElement('button');
    btn.textContent = 'Generar Datos de Prueba';
    btn.className = 'bg-brand-fuchsia hover:bg-brand-fuchsia-dark text-white font-bold py-2 px-4 rounded-md transition duration-300';
    btn.onclick = generarDatosPrueba;
    
    btnContainer.appendChild(btn);
    document.body.appendChild(btnContainer);
});
