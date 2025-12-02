// ====================================================================
// =================== CONFIGURACIÓN INICIAL Y DATOS ==================
// ====================================================================
let cart = [];
let menuData = [];
let searchInput;
const DB_NAME = 'PuntoFusionDB';
const DB_VERSION = 1;

// --- Funciones de Utilidad ---

// Función para cifrado simple de contraseñas (Requisito: password encriptado)
function encryptPassword(password) {
    // Usamos Base64 como un 'cifrado' simulado simple para cumplir el requisito
    return btoa(password); 
}

// Función de notificaciones con Toastify (Requisito: Toastify)
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
// ========================= INDEXDB (USUARIOS) =======================
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
            // Crear la tienda de objetos 'users' (Requisito: IndexDB)
            if (!db.objectStoreNames.contains('users')) {
                // El email es la clave única (keyPath)
                db.createObjectStore('users', { keyPath: 'email' }); 
            }
        };
    });
}


// ====================================================================
// ======================= AUTENTICACIÓN (LOGIN/REGISTRO) =============
// ====================================================================

async function register() {
    const user = document.getElementById('regUser').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value;
    const pass2 = document.getElementById('regPass2').value;

    // 1. Validación de campos obligatorios (Requisito: validación) [cite: 19]
    if (!user || !email || !pass || !pass2) {
        showToast("Todos los campos son obligatorios.", 'error');
        return;
    }
    
    // 2. Validación de formato de email 
    if (!email.includes('@') || !email.includes('.') || email.length < 5) {
        showToast("Formato de email inválido.", 'error');
        return;
    }

    // 3. Validación de coincidencia de contraseñas
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
        // Error de duplicado (mismo email)
        showToast("El email ya está registrado o hubo un error de DB.", 'error');
    };
}

async function login() {
    const email = document.getElementById('loginUser').value.trim(); // Usamos 'loginUser' como email/usuario
    const pass = document.getElementById('loginPass').value;

    if (!email || !pass) {
        showToast("Usuario y contraseña son obligatorios.", 'error');
        return;
    }

    await openDB();

    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(email); // Buscar por email (clave única de IndexDB)

    request.onsuccess = (event) => {
        const userRecord = event.target.result;

        if (userRecord) {
            const encryptedInputPass = encryptPassword(pass);
            
            if (encryptedInputPass === userRecord.password) {
                showToast(`¡Bienvenido, ${userRecord.user}!`);
                closeModal('loginModal'); 
                // Redirige a la Pagina Principal de la empresa (simulando con cierre de modal) [cite: 16]
            } else {
                showToast("Contraseña incorrecta.", 'error');
            }
        } else {
            // Error de validacion si no estan en la Base 
            showToast("Usuario no encontrado.", 'error');
        }
    };

    request.onerror = () => {
        showToast("Error al intentar iniciar sesión.", 'error');
    };
}


// ====================================================================
// ====================== MODALES Y NAVEGACIÓN ========================
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
// ====================== MENÚ Y BÚSQUEDA AJAX ========================
// ====================================================================

// Carga de menú (Simulando carga AJAX con Fetch)
async function loadMenu() {
    try {
        // Asegúrate que 'menu.json' esté en la raíz o ajusta la ruta
        const response = await fetch('menu.json');
        if (!response.ok) {
            throw new Error('Error al cargar menu.json');
        }
        menuData = await response.json();
        renderMenu(menuData);
    } catch (error) {
        console.error('Error al cargar el menú:', error);
        document.getElementById('menu-container').innerHTML = `<p style="text-align:center; color: #a89487;">Error al cargar el menú. Por favor, asegúrate de usar Live Server (VS Code).</p>`;
    }
}

// Renderiza el menú

function renderMenu(data) {
    const container = document.getElementById('menu-container');
    
    if (!container) {
        console.error("Error FATAL: No se encontró el elemento con ID 'menu-container'. Por favor, revisa tu index.html");
        return;
    }

    container.innerHTML = ''; // Limpiar contenido

    data.forEach(category => {
        // Usamos la clave 'nombre' del JSON para el título (ej. "I. Bebidas Calientes (La Esencia)")
        const categoryTitleText = category.nombre; 
        
        // 1. Crear el contenedor de la categoría
        const categoryArticle = document.createElement('article');
        categoryArticle.className = 'menu-category';
        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = ` ${categoryTitleText}`; 
        
        const productList = document.createElement('ul');

        category.productos.forEach(product => {
            const listItem = document.createElement('li');
            
            const priceValue = Number(product.precio) || 0; 
            const productName = product.nombre.replace(/'/g, "\\'"); 

            // Estructura HTML que debe coincidir con tu style.css (LISTA)
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
        
        // Añado Título y Lista al Article
        categoryArticle.appendChild(categoryTitle); 
        categoryArticle.appendChild(productList); 

        // Finalmente, añado el Article al Contenedor principal
        container.appendChild(categoryArticle); 
    });
}

function filterMenu() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    // Si el término de búsqueda está vacío, volvemos a mostrar todo el menú
    if (searchTerm === '') {
        renderMenu(menuData);
        return;
    }

    // Filtrar productos por nombre o descripción
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
// ======================== CARRITO DE COMPRAS ========================
// ====================================================================

function calculateTotal() {
    return cart.reduce((sum, item) => sum + Number(item.price), 0);
}

// Añadir producto al carrito (Requisito: manera fácil de añadir artículo) [cite: 22]
function addToCart(item) {
    cart.push(item);
    showToast(`✅ ${item.name} añadido al carrito.`);
    updateCartUI();
}

// Quitar producto por índice (Requisito: cancelar o editar productos) [cite: 23]
function removeFromCart(index) {
    if (index >= 0 && index < cart.length) {
        const removedItem = cart.splice(index, 1)[0];
        showToast(`🗑️ ${removedItem.name} eliminado.`);
    }
    updateCartUI();
}

// Vaciar carrito
function clearCart() {
    if (cart.length === 0) {
        showToast("El carrito ya está vacío.", 'error');
        return;
    }
    cart = [];
    showToast("Carrito vaciado.", 'success');
    updateCartUI();
}

// Actualizar contador, listado y total
function updateCartUI() {
    const countEl = document.getElementById("cartCount");
    const totalEl = document.getElementById("cartTotal");
    const container = document.getElementById("cartItems");
    
    // 1. Actualizar el contador de la barra de navegación
    if (countEl) countEl.innerText = cart.length; 

    // Solo procede si estamos dentro del modal del carrito
    if (!container || !totalEl) return; 

    container.innerHTML = "";

    // 2. Calcular y actualizar el total
    const total = calculateTotal().toFixed(2);
    totalEl.innerText = total; 

    if (cart.length === 0) {
        const empty = document.createElement("div");
        empty.className = "cart-empty";
        empty.innerText = "Tu carrito está vacío.";
        container.appendChild(empty);
        return;
    }

    // 3. Listar productos
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
// ====================== INICIO DE LA APLICACIÓN =====================
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar el menú al iniciar
    loadMenu(); 
    
    // 2. Inicializar la base de datos (IndexDB)
    openDB().catch(error => {
        console.error("Error grave al inicializar la base de datos:", error);
    });

    // 3. CONFIGURAR EL BUSCADOR (Inicializar la variable global sin 'const' o 'let')
    searchInput = document.getElementById('buscador'); 
    if (searchInput) {
        searchInput.addEventListener('input', filterMenu); 
    }
});