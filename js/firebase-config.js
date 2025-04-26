// firebase-config.js - Configuración y funciones para Firebase Realtime Database

// Importar funciones de Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, get, child, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBGx11FHPK4Xs5XE5Mc0n8VAeCyFxMFhgU",
  authDomain: "noe-app-66de9.firebaseapp.com",
  projectId: "noe-app-66de9",
  storageBucket: "noe-app-66de9.firebasestorage.app",
  messagingSenderId: "913071177875",
  appId: "1:913071177875:web:5f348b9255e9725cfccd66",
  databaseURL: "https://noe-app-66de9-default-rtdb.firebaseio.com/"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const dbRef = ref(database);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

console.log("Firebase inicializado correctamente");

// --- Funciones para Autenticación ---

/**
 * Inicia sesión con Google.
 * @returns {Promise} - Promesa que se resuelve cuando se completa la operación.
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log('Usuario autenticado:', user.displayName);
    return user;
  } catch (error) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  }
}

/**
 * Cierra la sesión actual.
 * @returns {Promise} - Promesa que se resuelve cuando se completa la operación.
 */
export async function logOut() {
  try {
    await signOut(auth);
    console.log('Sesión cerrada correctamente');
    return true;
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    throw error;
  }
}

/**
 * Obtiene el usuario actualmente autenticado.
 * @returns {Object|null} - El usuario autenticado o null si no hay sesión.
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Registra un observador para cambios en el estado de autenticación.
 * @param {Function} callback - Función a llamar cuando cambie el estado.
 * @returns {Function} - Función para dejar de observar.
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// --- Funciones para Stock ---

/**
 * Guarda o actualiza un item en el stock.
 * @param {string} itemId - El ID único del item.
 * @param {object} itemData - Los datos del item.
 * @returns {Promise} - Promesa que se resuelve cuando se completa la operación.
 */
export async function saveStockItem(itemId, itemData) {
  try {
    await set(ref(database, 'stock/' + itemId), itemData);
    console.log(`Item ${itemId} guardado/actualizado en Firebase.`);
    return true;
  } catch (error) {
    console.error("Error guardando item en Firebase: ", error);
    return false;
  }
}

/**
 * Guarda todo el stock en Firebase.
 * @param {Array} stockData - Array con todos los items del stock.
 * @returns {Promise} - Promesa que se resuelve cuando se completa la operación.
 */
export async function saveAllStock(stockData) {
  try {
    // Convertir el array a un objeto con IDs como claves para Firebase
    const stockObj = {};
    for (const item of stockData) {
      if (item && item.id) {
        stockObj[item.id] = { ...item };
      }
    }
    
    // Guardar en Firebase
    await set(ref(database, 'stock'), stockObj);
    console.log('Stock completo guardado en Firebase');
    return true;
  } catch (error) {
    console.error('Error al guardar stock en Firebase:', error);
    return false;
  }
}

/**
 * Obtiene todos los items del stock.
 * @returns {Promise<Array>} - Promesa que se resuelve con un array de items.
 */
export async function getAllStock() {
  try {
    const snapshot = await get(child(dbRef, 'stock'));
    if (snapshot.exists()) {
      // Convertir el objeto de Firebase a un array
      const stockObj = snapshot.val();
      const stockArray = Object.keys(stockObj).map(key => ({
        id: key,
        ...stockObj[key]
      }));
      console.log('Stock obtenido desde Firebase:', stockArray.length, 'items');
      return stockArray;
    } else {
      console.log('No hay datos de stock en Firebase');
      return [];
    }
  } catch (error) {
    console.error('Error al obtener stock desde Firebase:', error);
    return [];
  }
}

// --- Funciones para Clientes ---

/**
 * Guarda o actualiza un cliente.
 * @param {string} clientId - El ID único del cliente.
 * @param {object} clientData - Los datos del cliente.
 * @returns {Promise} - Promesa que se resuelve cuando se completa la operación.
 */
export async function saveClient(clientId, clientData) {
  try {
    await set(ref(database, 'clientes/' + clientId), clientData);
    console.log(`Cliente ${clientId} guardado/actualizado en Firebase.`);
    return true;
  } catch (error) {
    console.error("Error guardando cliente en Firebase: ", error);
    return false;
  }
}

/**
 * Guarda todos los clientes en Firebase.
 * @param {Array} clientsData - Array con todos los clientes.
 * @returns {Promise} - Promesa que se resuelve cuando se completa la operación.
 */
export async function saveAllClients(clientsData) {
  try {
    // Convertir el array a un objeto con IDs como claves para Firebase
    const clientsObj = {};
    for (const client of clientsData) {
      if (client && client.id) {
        clientsObj[client.id] = { ...client };
      }
    }
    
    // Guardar en Firebase
    await set(ref(database, 'clientes'), clientsObj);
    console.log('Clientes guardados en Firebase');
    return true;
  } catch (error) {
    console.error('Error al guardar clientes en Firebase:', error);
    return false;
  }
}

/**
 * Obtiene todos los clientes.
 * @returns {Promise<Array>} - Promesa que se resuelve con un array de clientes.
 */
export async function getAllClients() {
  try {
    const snapshot = await get(child(dbRef, 'clientes'));
    if (snapshot.exists()) {
      // Convertir el objeto de Firebase a un array
      const clientsObj = snapshot.val();
      const clientsArray = Object.keys(clientsObj).map(key => ({
        id: key,
        ...clientsObj[key]
      }));
      console.log('Clientes obtenidos desde Firebase:', clientsArray.length, 'clientes');
      return clientsArray;
    } else {
      console.log('No hay datos de clientes en Firebase');
      return [];
    }
  } catch (error) {
    console.error('Error al obtener clientes desde Firebase:', error);
    return [];
  }
}

// --- Funciones para Ventas ---

/**
 * Guarda o actualiza una venta.
 * @param {string} saleId - El ID único de la venta.
 * @param {object} saleData - Los datos de la venta.
 * @returns {Promise} - Promesa que se resuelve cuando se completa la operación.
 */
export async function saveSale(saleId, saleData) {
  try {
    await set(ref(database, 'ventas/' + saleId), saleData);
    console.log(`Venta ${saleId} guardada/actualizada en Firebase.`);
    return true;
  } catch (error) {
    console.error("Error guardando venta en Firebase: ", error);
    return false;
  }
}

/**
 * Guarda todas las ventas en Firebase.
 * @param {Array} salesData - Array con todas las ventas.
 * @returns {Promise} - Promesa que se resuelve cuando se completa la operación.
 */
export async function saveAllSales(salesData) {
  try {
    // Convertir el array a un objeto con IDs como claves para Firebase
    const salesObj = {};
    for (const sale of salesData) {
      if (sale && sale.id) {
        salesObj[sale.id] = { ...sale };
      }
    }
    
    // Guardar en Firebase
    await set(ref(database, 'ventas'), salesObj);
    console.log('Ventas guardadas en Firebase');
    return true;
  } catch (error) {
    console.error('Error al guardar ventas en Firebase:', error);
    return false;
  }
}

/**
 * Obtiene todas las ventas.
 * @returns {Promise<Array>} - Promesa que se resuelve con un array de ventas.
 */
export async function getAllSales() {
  try {
    const snapshot = await get(child(dbRef, 'ventas'));
    if (snapshot.exists()) {
      // Convertir el objeto de Firebase a un array
      const salesObj = snapshot.val();
      const salesArray = Object.keys(salesObj).map(key => ({
        id: key,
        ...salesObj[key]
      }));
      console.log('Ventas obtenidas desde Firebase:', salesArray.length, 'ventas');
      return salesArray;
    } else {
      console.log('No hay datos de ventas en Firebase');
      return [];
    }
  } catch (error) {
    console.error('Error al obtener ventas desde Firebase:', error);
    return [];
  }
}

// Función para sincronizar datos locales con Firebase
export async function syncLocalDataWithFirebase() {
  try {
    console.log("Iniciando sincronización con Firebase...");
    
    // Obtener datos de localStorage
    const localStock = JSON.parse(localStorage.getItem('stockData') || '[]');
    const localClients = JSON.parse(localStorage.getItem('clientsData') || '[]');
    const localSales = JSON.parse(localStorage.getItem('salesData') || '[]');
    
    // Guardar en Firebase
    if (localStock.length > 0) {
      await saveAllStock(localStock);
    }
    
    if (localClients.length > 0) {
      await saveAllClients(localClients);
    }
    
    if (localSales.length > 0) {
      await saveAllSales(localSales);
    }
    
    console.log("Sincronización con Firebase completada");
    return true;
  } catch (error) {
    console.error("Error en la sincronización con Firebase:", error);
    return false;
  }
}

// Exportar la instancia de Firebase y otras funciones útiles
export { app, database, dbRef };
