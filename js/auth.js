// auth.js - Funciones para manejar la autenticación con Firebase

import { logOut, getCurrentUser, onAuthChange } from './firebase-config.js';

// Elementos del DOM
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const menuButton = document.querySelector('.mobile-menu-button');
const closeMenuButton = document.querySelector('.close-menu');
const menuOverlay = document.querySelector('.menu-overlay');
const sideMenu = document.querySelector('.side-menu');

// Inicializar la autenticación
function initAuth() {
    console.log('Inicializando autenticación...');
    
    // Configurar event listeners para cerrar sesión
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Observar cambios en el estado de autenticación
    onAuthChange(handleAuthChange);
    
    // Configurar eventos del menú
    setupMenuEvents();
}

// Manejar el inicio de sesión con Google
async function handleLogin() {
    try {
        await signInWithGoogle();
        // La UI se actualizará automáticamente a través del observador de autenticación
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alert('Error al iniciar sesión. Inténtalo de nuevo.');
    }
}

// Manejar el cierre de sesión
async function handleLogout() {
    try {
        await logOut();
        // La UI se actualizará automáticamente a través del observador de autenticación
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión. Inténtalo de nuevo.');
    }
}

// Manejar cambios en el estado de autenticación
function handleAuthChange(user) {
    if (user) {
        // Usuario autenticado
        console.log('Usuario autenticado:', user.displayName);
        
        // Mostrar información del usuario en el menú
        if (userAvatar) userAvatar.src = user.photoURL || 'assets/default-avatar.png';
        if (userName) userName.textContent = user.displayName || 'Usuario';
        if (userEmail) userEmail.textContent = user.email || '';
    } else {
        // Usuario no autenticado, redirigir a la página de login
        console.log('Usuario no autenticado, redirigiendo a login.html');
        
        // No redirigir si ya estamos en la página de login
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
}

// Configurar eventos del menú
function setupMenuEvents() {
    // Abrir menú
    if (menuButton) {
        menuButton.addEventListener('click', openMenu);
    }
    
    // Cerrar menú
    if (closeMenuButton) {
        closeMenuButton.addEventListener('click', closeMenu);
    }
    
    // Cerrar menú al hacer clic en el overlay
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }
}

// Función para abrir el menú
function openMenu() {
    if (sideMenu) sideMenu.classList.add('open');
    if (sideMenu) sideMenu.classList.remove('translate-x-full');
    if (menuOverlay) menuOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevenir scroll del body
}

// Función para cerrar el menú
function closeMenu() {
    if (sideMenu) sideMenu.classList.remove('open');
    if (sideMenu) sideMenu.classList.add('translate-x-full');
    if (menuOverlay) menuOverlay.classList.add('hidden');
    document.body.style.overflow = ''; // Restaurar scroll del body
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', initAuth);

// Exportar funciones para uso en otros archivos
export { initAuth, handleLogin, handleLogout };
