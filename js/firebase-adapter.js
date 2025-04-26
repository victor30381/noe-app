// firebase-adapter.js - Adaptador para conectar la aplicación existente con Firebase
// Este archivo proporciona funciones compatibles con la interfaz existente pero usando Firebase

import {
    saveStockItem,
    saveAllStock,
    getAllStock as getFirebaseStock,
    saveClient as saveFirebaseClient,
    saveAllClients,
    getAllClients as getFirebaseClients,
    saveSale,
    saveAllSales,
    getAllSales as getFirebaseSales,
    syncLocalDataWithFirebase
} from './firebase-config.js';

// Constantes para las claves de localStorage (duplicadas de app.js para compatibilidad)
const STOCK_STORAGE_KEY = 'bella_stock';
const CLIENTS_STORAGE_KEY = 'bella_clients';
const SALES_STORAGE_KEY = 'bella_sales';
const NEXT_CLIENT_ID_KEY = 'bella_nextClientId';

// --- Funciones adaptadoras para Stock ---

/**
 * Obtiene los datos de stock desde Firebase con fallback a localStorage
 * @returns {Promise<Array>} - Array con los items de stock
 */
export async function getStockData() {
    try {
        console.log("Obteniendo stock desde Firebase...");
        const stockArray = await getFirebaseStock();
        
        // Si hay datos en Firebase, los devolvemos
        if (stockArray && stockArray.length > 0) {
            console.log(`Stock obtenido desde Firebase: ${stockArray.length} items`);
            // También actualizamos localStorage como respaldo
            localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stockArray));
            return stockArray;
        }
        
        // Si no hay datos en Firebase, intentamos obtenerlos de localStorage
        console.log("No hay datos en Firebase, intentando localStorage...");
        const localData = localStorage.getItem(STOCK_STORAGE_KEY);
        if (localData) {
            const parsedData = JSON.parse(localData);
            console.log(`Stock obtenido desde localStorage: ${parsedData.length} items`);
            
            // Sincronizamos con Firebase para la próxima vez
            if (parsedData.length > 0) {
                saveAllStock(parsedData).catch(err => 
                    console.error("Error sincronizando stock con Firebase:", err)
                );
            }
            
            return parsedData;
        }
        
        // Si no hay datos en ningún lado, devolvemos array vacío
        return [];
    } catch (error) {
        console.error("Error obteniendo stock:", error);
        
        // En caso de error, intentamos obtener desde localStorage
        try {
            const localData = localStorage.getItem(STOCK_STORAGE_KEY);
            return localData ? JSON.parse(localData) : [];
        } catch (e) {
            console.error("Error obteniendo stock desde localStorage:", e);
            return [];
        }
    }
}

/**
 * Guarda los datos de stock en Firebase y localStorage
 * @param {Array} data - Array con los items de stock
 * @returns {Promise<boolean>} - Promesa que se resuelve con true si se guardó correctamente
 */
export async function saveStockData(data) {
    try {
        console.log("Guardando stock en Firebase...");
        await saveAllStock(data);
        
        // También guardamos en localStorage como respaldo
        localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(data));
        console.log("Stock guardado correctamente en Firebase y localStorage");
        return true;
    } catch (error) {
        console.error("Error guardando stock en Firebase:", error);
        
        // En caso de error, al menos intentamos guardar en localStorage
        try {
            localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(data));
            console.log("Stock guardado en localStorage (fallback)");
            return true;
        } catch (e) {
            console.error("Error guardando stock en localStorage:", e);
            return false;
        }
    }
}

// --- Funciones adaptadoras para Clientes ---

/**
 * Obtiene los datos de clientes desde Firebase con fallback a localStorage
 * @returns {Promise<Array>} - Array con los clientes
 */
export async function getClientsData() {
    try {
        console.log("Obteniendo clientes desde Firebase...");
        const clientsArray = await getFirebaseClients();
        
        // Si hay datos en Firebase, los devolvemos
        if (clientsArray && clientsArray.length > 0) {
            console.log(`Clientes obtenidos desde Firebase: ${clientsArray.length} clientes`);
            // También actualizamos localStorage como respaldo
            localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clientsArray));
            return clientsArray;
        }
        
        // Si no hay datos en Firebase, intentamos obtenerlos de localStorage
        console.log("No hay datos en Firebase, intentando localStorage...");
        const localData = localStorage.getItem(CLIENTS_STORAGE_KEY);
        if (localData) {
            const parsedData = JSON.parse(localData);
            console.log(`Clientes obtenidos desde localStorage: ${parsedData.length} clientes`);
            
            // Sincronizamos con Firebase para la próxima vez
            if (parsedData.length > 0) {
                saveAllClients(parsedData).catch(err => 
                    console.error("Error sincronizando clientes con Firebase:", err)
                );
            }
            
            return parsedData;
        }
        
        // Si no hay datos en ningún lado, devolvemos array vacío
        return [];
    } catch (error) {
        console.error("Error obteniendo clientes:", error);
        
        // En caso de error, intentamos obtener desde localStorage
        try {
            const localData = localStorage.getItem(CLIENTS_STORAGE_KEY);
            return localData ? JSON.parse(localData) : [];
        } catch (e) {
            console.error("Error obteniendo clientes desde localStorage:", e);
            return [];
        }
    }
}

/**
 * Guarda los datos de clientes en Firebase y localStorage
 * @param {Array} data - Array con los clientes
 * @returns {Promise<boolean>} - Promesa que se resuelve con true si se guardó correctamente
 */
export async function saveClientsData(data) {
    try {
        console.log("Guardando clientes en Firebase...");
        await saveAllClients(data);
        
        // También guardamos en localStorage como respaldo
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(data));
        console.log("Clientes guardados correctamente en Firebase y localStorage");
        return true;
    } catch (error) {
        console.error("Error guardando clientes en Firebase:", error);
        
        // En caso de error, al menos intentamos guardar en localStorage
        try {
            localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(data));
            console.log("Clientes guardados en localStorage (fallback)");
            return true;
        } catch (e) {
            console.error("Error guardando clientes en localStorage:", e);
            return false;
        }
    }
}

// --- Funciones adaptadoras para Ventas ---

/**
 * Obtiene los datos de ventas desde Firebase con fallback a localStorage
 * @returns {Promise<Array>} - Array con las ventas
 */
export async function getSalesData() {
    try {
        console.log("Obteniendo ventas desde Firebase...");
        const salesArray = await getFirebaseSales();
        
        // Si hay datos en Firebase, los devolvemos
        if (salesArray && salesArray.length > 0) {
            console.log(`Ventas obtenidas desde Firebase: ${salesArray.length} ventas`);
            // También actualizamos localStorage como respaldo
            localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(salesArray));
            return salesArray;
        }
        
        // Si no hay datos en Firebase, intentamos obtenerlos de localStorage
        console.log("No hay datos en Firebase, intentando localStorage...");
        const localData = localStorage.getItem(SALES_STORAGE_KEY);
        if (localData) {
            const parsedData = JSON.parse(localData);
            console.log(`Ventas obtenidas desde localStorage: ${parsedData.length} ventas`);
            
            // Sincronizamos con Firebase para la próxima vez
            if (parsedData.length > 0) {
                saveAllSales(parsedData).catch(err => 
                    console.error("Error sincronizando ventas con Firebase:", err)
                );
            }
            
            return parsedData;
        }
        
        // Si no hay datos en ningún lado, devolvemos array vacío
        return [];
    } catch (error) {
        console.error("Error obteniendo ventas:", error);
        
        // En caso de error, intentamos obtener desde localStorage
        try {
            const localData = localStorage.getItem(SALES_STORAGE_KEY);
            return localData ? JSON.parse(localData) : [];
        } catch (e) {
            console.error("Error obteniendo ventas desde localStorage:", e);
            return [];
        }
    }
}

/**
 * Guarda los datos de ventas en Firebase y localStorage
 * @param {Array} data - Array con las ventas
 * @returns {Promise<boolean>} - Promesa que se resuelve con true si se guardó correctamente
 */
export async function saveSalesData(data) {
    try {
        console.log("Guardando ventas en Firebase...");
        await saveAllSales(data);
        
        // También guardamos en localStorage como respaldo
        localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(data));
        console.log("Ventas guardadas correctamente en Firebase y localStorage");
        return true;
    } catch (error) {
        console.error("Error guardando ventas en Firebase:", error);
        
        // En caso de error, al menos intentamos guardar en localStorage
        try {
            localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(data));
            console.log("Ventas guardadas en localStorage (fallback)");
            return true;
        } catch (e) {
            console.error("Error guardando ventas en localStorage:", e);
            return false;
        }
    }
}

// --- Otras funciones auxiliares ---

/**
 * Obtiene el siguiente ID para un cliente
 * @returns {number} - El siguiente ID disponible
 */
export function getNextClientId() {
    let nextId = localStorage.getItem(NEXT_CLIENT_ID_KEY);
    if (!nextId) {
        nextId = 1;
    } else {
        nextId = parseInt(nextId);
        if (isNaN(nextId) || nextId < 1) {
            nextId = 1;
        }
    }
    localStorage.setItem(NEXT_CLIENT_ID_KEY, (nextId + 1).toString());
    return nextId;
}

// Función para sincronizar datos locales con Firebase
export async function syncAllDataWithFirebase() {
    try {
        console.log("Iniciando sincronización completa con Firebase...");
        
        // Sincronizar stock
        const localStock = localStorage.getItem(STOCK_STORAGE_KEY);
        if (localStock) {
            const stockData = JSON.parse(localStock);
            if (stockData && stockData.length > 0) {
                await saveAllStock(stockData);
                console.log("Stock sincronizado con Firebase");
            }
        }
        
        // Sincronizar clientes
        const localClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
        if (localClients) {
            const clientsData = JSON.parse(localClients);
            if (clientsData && clientsData.length > 0) {
                await saveAllClients(clientsData);
                console.log("Clientes sincronizados con Firebase");
            }
        }
        
        // Sincronizar ventas
        const localSales = localStorage.getItem(SALES_STORAGE_KEY);
        if (localSales) {
            const salesData = JSON.parse(localSales);
            if (salesData && salesData.length > 0) {
                await saveAllSales(salesData);
                console.log("Ventas sincronizadas con Firebase");
            }
        }
        
        console.log("Sincronización completa finalizada");
        return true;
    } catch (error) {
        console.error("Error en la sincronización completa:", error);
        return false;
    }
}

// Iniciar sincronización automática al cargar el script
document.addEventListener('DOMContentLoaded', function() {
    console.log("Iniciando sincronización automática con Firebase...");
    syncAllDataWithFirebase().then(success => {
        if (success) {
            console.log("Sincronización completada con éxito.");
        } else {
            console.warn("Sincronización completada con advertencias.");
        }
    }).catch(error => {
        console.error("Error en la sincronización:", error);
    });
});

// Exportamos las funciones para que puedan ser importadas por otros módulos
