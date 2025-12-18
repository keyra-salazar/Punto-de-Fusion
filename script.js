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
let usuarioLogueado = null; 

 usuarioLogueado = userRecord;
 localStorage.setItem('usuarioSesion', JSON.stringify(userRecord));
 actualizarInterfazLogin();

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
                usuarioLogueado = userRecord; 
                
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
// 5. GESTIÓN DEL MENÚ LATERAL Y NAVEGACIÓN
// ====================================================================

function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('menuOverlay'); 

    if (menu) {
        menu.classList.toggle('active');
    }
    
    if (overlay) {
        overlay.classList.toggle('active');
    }
}

function logout() {
    showToast("Sesión cerrada correctamente", "success");
    
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.style.display = 'block';
    }
    
    toggleMenu();
}

// ====================================================================
// CARGA Y RENDERIZADO DEL MENÚ (JSON)
// ====================================================================

async function loadMenu() {
    try {
        const response = await fetch('menu.json');
        if (!response.ok) throw new Error('Error al cargar menu.json');
        menuData = await response.json();
        renderMenu(menuData);
    } catch (error) {
        console.error('Error:', error);
        const container = document.getElementById('menu-container');
        if(container) {
            container.innerHTML = `<p style="text-align:center; color: #a89487;">Error al cargar el menú.</p>`;
        }
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

// ====================================================================
// SISTEMA DE FILTRO / BÚSQUEDA
// ====================================================================

function filterMenu() {
    if (!searchInput) return;

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

// ====================================================================
// 8. CARGA DINÁMICA DEL COMPONENTE DE CUENTA
// ====================================================================
 usuarioLogueado = JSON.parse(localStorage.getItem('usuarioSesion')) || null; 

async function cargarComponenteCuenta() {
    if (document.getElementById('cuentaModal')) return;
    try {
        const response = await fetch('cuenta.html');
        if (!response.ok) throw new Error("No se pudo encontrar cuenta.html");
        const html = await response.text();
        document.body.insertAdjacentHTML('beforeend', html);
        
        // Al terminar de cargar, verificamos si hay que ocultar el botón de login
        actualizarInterfazLogin();
    } catch (error) {
        console.error("Error cargando el modal de cuenta:", error);
    }
}

document.addEventListener("DOMContentLoaded", cargarComponenteCuenta);

// Función auxiliar para ocultar/mostrar botón de login según la sesión
function actualizarInterfazLogin() {
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.style.display = usuarioLogueado ? 'none' : 'block';
    }
}

async function abrirCuenta() {
    await cargarComponenteCuenta();
    const modal = document.getElementById('cuentaModal');
    const cuerpoModal = document.getElementById('modalContentBody');

    if (!modal || !cuerpoModal) return;

    if (!usuarioLogueado) {
        showToast("Debes iniciar sesión primero", 'error');
        // Asegúrate de que openModal esté definido para abrir tu modal de login
        if (typeof openModal === 'function') openModal('loginModal'); 
        if (document.getElementById('sideMenu')?.classList.contains('active')) toggleMenu();
        return; 
    }

    cuerpoModal.innerHTML = `
        <div class="user-info" style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
            <div class="user-avatar" style="font-size: 40px; background: #f4f1ea; padding: 10px; border-radius: 50%;">☕</div>
            <div class="user-details">
                <p style="margin: 0;"><strong>Usuario:</strong> ${usuarioLogueado.user}</p>
                <p style="margin: 0; color: #666;"><strong>Email:</strong> ${usuarioLogueado.email}</p>
            </div>
        </div>
        <div class="account-actions">
            <button class="btn-account" style="width:100%; text-align:left; padding:10px; margin-bottom:10px; border:1px solid #ddd; background:none; border-radius:4px; cursor:pointer;">Historial de Pedidos</button>
            <button class="btn-account" onclick="logout()" style="width:100%; text-align:left; padding:10px; border:1px solid #ddd; background:none; border-radius:4px; color: #d9534f; font-weight: bold; cursor:pointer;">Cerrar Sesión</button>
        </div>
    `;
    
    modal.style.display = "block";
    if (document.getElementById('sideMenu')?.classList.contains('active')) {
        toggleMenu();
    }
}

function logout() {
    usuarioLogueado = null; 
    localStorage.removeItem('usuarioSesion'); // Limpiamos la persistencia
    closeModal('cuentaModal');
    actualizarInterfazLogin();
    showToast("Has cerrado sesión.");
}

// 2. Mejora: Cerrar modal haciendo clic fuera de la caja blanca
window.addEventListener('click', (event) => {
    const modal = document.getElementById('cuentaModal');
    if (event.target === modal) {
        closeModal('cuentaModal');
    }
});

// 3. RECUERDA: En tu función login() original, añade esta línea tras el éxito:
 usuarioLogueado = userRecord;
 localStorage.setItem('usuarioSesion', JSON.stringify(userRecord));
 actualizarInterfazLogin();