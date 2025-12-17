// ====================================================================
// 1. CONFIGURACIÓN INICIAL Y VARIABLES GLOBALES
// ====================================================================
let cart = [];
let menuData = [];
let searchInput;
const DB_NAME = 'PuntoFusionDB';
const DB_VERSION = 1;

// --- Funciones de Utilidad ---

// Cifrado Base64 para contraseñas
function encryptPassword(password) {
    return btoa(password); 
}

// Sistema de notificaciones (Toastify)
function showToast(message, type = 'success') {
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top", 
        position: "right", 
        stopOnFocus: true,
        style: {
            background: type === 'success' ? "linear-gradient(to right, #6A453A, #8c7a70)" : "linear-gradient(to right, #d9534f, #c9302c)",
        },
    }).showToast();
}

// ====================================================================
// 2. GESTIÓN DE BASE DE DATOS (INDEXDB)
// ====================================================================
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("Error al abrir IndexDB:", event.target.errorCode);
            reject("Error de base de datos.");
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve();
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains('users')) {
                db.createObjectStore('users', { keyPath: 'email' }); 
            }
        };
    });
}

// ====================================================================
// 3. AUTENTICACIÓN (REGISTRO Y LOGIN)
// ====================================================================

async function register() {
    const user = document.getElementById('regUser').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value;
    const pass2 = document.getElementById('regPass2').value;

    if (!user || !email || !pass || !pass2) {
        showToast("Todos los campos son obligatorios.", 'error');
        return;
    }
    
    if (!email.includes('@') || !email.includes('.') || email.length < 5) {
        showToast("Formato de email inválido.", 'error');
        return;
    }

    if (pass !== pass2) {
        showToast("Las contraseñas no coinciden.", 'error');
        return;
    }

    await openDB();

    const encryptedPass = encryptPassword(pass); 
    const newUser = { user, email, password: encryptedPass };

    const transaction = db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    const request = store.add(newUser);

    request.onsuccess = () => {
        showToast("¡Registro exitoso!");
        switchModal('registerModal', 'loginModal'); 
    };

    request.onerror = () => {
        showToast("El email ya está registrado.", 'error');
    };
}

async function login() {
    const email = document.getElementById('loginUser').value.trim(); 
    const pass = document.getElementById('loginPass').value;

    if (!email || !pass) {
        showToast("Usuario y contraseña son obligatorios.", 'error');
        return;
    }

    await openDB();

    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(email); 

    request.onsuccess = (event) => {
        const userRecord = event.target.result;

        if (userRecord) {
            const encryptedInputPass = encryptPassword(pass);
            
            if (encryptedInputPass === userRecord.password) {
                showToast(`¡Bienvenido, ${userRecord.user}!`);
                closeModal('loginModal'); 
                const loginBtn = document.querySelector('.login-btn');
                if (loginBtn) {
                    loginBtn.style.display = 'none';
                }
            } else {
                showToast("Contraseña incorrecta.", 'error');
            }
        } else {
            showToast("Usuario no encontrado.", 'error');
        }
    };

    request.onerror = () => {
        showToast("Error al intentar iniciar sesión.", 'error');
    };
}

// ====================================================================
// 4. CONTROL DE INTERFAZ (MODALES)
// ====================================================================

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

function openCart() {
    updateCartUI();
    openModal('cartModal');
}

function switchModal(oldId, newId) {
    closeModal(oldId);
    openModal(newId);
}

// ====================================================================
// 5. MENÚ DINÁMICO Y BÚSQUEDA (AJAX/FETCH)
// ====================================================================

async function loadMenu() {
    try {
        const response = await fetch('menu.json');
        if (!response.ok) throw new Error('Error al cargar menu.json');
        menuData = await response.json();
        renderMenu(menuData);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('menu-container').innerHTML = `<p style="text-align:center; color: #a89487;">Error al cargar el menú.</p>`;
    }
}

function renderMenu(data) {
    const container = document.getElementById('menu-container');
    if (!container) return;

    container.innerHTML = ''; 

    data.forEach(category => {
        const categoryArticle = document.createElement('article');
        categoryArticle.className = 'menu-category';
        
        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = ` ${category.nombre}`; 
        
        const productList = document.createElement('ul');

        category.productos.forEach(product => {
            const listItem = document.createElement('li');
            const priceValue = Number(product.precio) || 0; 
            const productName = product.nombre.replace(/'/g, "\\'"); 

            listItem.innerHTML = `
                <span class="product-name">${product.nombre}</span> 
                <span class="price">$${priceValue.toFixed(2)}</span>
                <p class="description">${product.descripcion}</p>
                <div class="product-actions">
                    <button class="add-cart" onclick="addToCart({name: '${productName}', price: ${priceValue}})">
                        Agregar 🛒
                    </button>
                </div>
            `;
            productList.appendChild(listItem);
        });
        
        categoryArticle.appendChild(categoryTitle); 
        categoryArticle.appendChild(productList); 
        container.appendChild(categoryArticle); 
    });
}

function filterMenu() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        renderMenu(menuData);
        return;
    }

    const filteredData = menuData.map(category => {
        const filteredProducts = category.productos.filter(product => 
            product.nombre.toLowerCase().includes(searchTerm) || 
            product.descripcion.toLowerCase().includes(searchTerm)
        );
        return { ...category, productos: filteredProducts };
    }).filter(category => category.productos.length > 0);

    renderMenu(filteredData);
}

// ====================================================================
// 6. LÓGICA DEL CARRITO DE COMPRAS
// ====================================================================

function calculateTotal() {
    return cart.reduce((sum, item) => sum + Number(item.price), 0);
}

function addToCart(item) {
    cart.push(item);
    showToast(`✅ ${item.name} añadido al carrito.`);
    updateCartUI();
}

function removeFromCart(index) {
    if (index >= 0 && index < cart.length) {
        const removedItem = cart.splice(index, 1)[0];
        showToast(`🗑️ ${removedItem.name} eliminado.`);
    }
    updateCartUI();
}

function clearCart() {
    if (cart.length === 0) {
        showToast("El carrito ya está vacío.", 'error');
        return;
    }
    cart = [];
    showToast("Carrito vaciado.", 'success');
    updateCartUI();
}

function updateCartUI() {
    const countEl = document.getElementById("cartCount");
    const totalEl = document.getElementById("cartTotal");
    const container = document.getElementById("cartItems");
    
    if (countEl) countEl.innerText = cart.length; 
    if (!container || !totalEl) return; 

    container.innerHTML = "";
    const total = calculateTotal().toFixed(2);
    totalEl.innerText = total; 

    if (cart.length === 0) {
        container.innerHTML = `<div class="cart-empty">Tu carrito está vacío.</div>`;
        return;
    }

    cart.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <div>
                <strong>${item.name}</strong>
                <div style="font-size:0.9rem;color:#555;">$${Number(item.price).toFixed(2)}</div>
            </div>
            <div>
                <button onclick="removeFromCart(${index})">Quitar</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// ====================================================================
// 7. INICIALIZACIÓN (DOM READY)
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadMenu(); 
    
    openDB().catch(error => {
        console.error("Error al inicializar la base de datos:", error);
    });

    searchInput = document.getElementById('buscador'); 
    if (searchInput) {
        searchInput.addEventListener('input', filterMenu); 
    }
});