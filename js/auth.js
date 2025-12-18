// Variable única de sesión
let usuarioLogueado = JSON.parse(localStorage.getItem('usuarioSesion')) || null;

const DB_NAME = 'PuntoFusionDB';
const DB_VERSION = 1;
let db;

// Abrir Base de Datos
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject("Error de DB");
        request.onsuccess = (e) => { db = e.target.result; resolve(); };
        request.onupgradeneeded = (e) => {
            let dbStore = e.target.result;
            if (!dbStore.objectStoreNames.contains('users')) {
                dbStore.createObjectStore('users', { keyPath: 'email' });
            }
        };
    });
}

// Registro
async function register() {
    const user = document.getElementById('regUser').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value;
    const pass2 = document.getElementById('regPass2').value;

    if (!user || !email || !pass || pass !== pass2) {
        showToast("Verifica los datos y las contraseñas", 'error');
        return;
    }

    await openDB();
    const newUser = { user, email, password: btoa(pass) };
    const transaction = db.transaction(['users'], 'readwrite');
    const request = transaction.objectStore('users').add(newUser);

    request.onsuccess = () => {
        showToast("¡Registro exitoso!");
        switchModal('registerModal', 'loginModal');
    };
    request.onerror = () => showToast("El email ya existe", 'error');
}

// Login
async function login() {
    const email = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;

    await openDB();
    const transaction = db.transaction(['users'], 'readonly');
    const request = transaction.objectStore('users').get(email);

    request.onsuccess = (e) => {
        const user = e.target.result;
        if (user && btoa(pass) === user.password) {
            usuarioLogueado = user;
            localStorage.setItem('usuarioSesion', JSON.stringify(user));
            showToast(`Bienvenido ${user.user}`);
            closeModal('loginModal');
            actualizarInterfazLogin();
        } else {
            showToast("Credenciales incorrectas", 'error');
        }
    };
}

function logout() {
    usuarioLogueado = null;
    localStorage.removeItem('usuarioSesion');
    closeModal('cuentaModal');
    actualizarInterfazLogin();
    showToast("Sesión cerrada");
}

function actualizarInterfazLogin() {
    const btn = document.querySelector('.login-btn');
    if (btn) btn.style.display = usuarioLogueado ? 'none' : 'block';
}