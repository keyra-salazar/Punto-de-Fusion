/* ====================================================================
   ================== INICIALIZACIÓN Y EVENTOS GENERALES ==================
   ==================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    // 1. Inicializar la DB de usuarios (para el ejercicio)
    initUsersDB();
    
    // 2. Cargar el menú dinámico desde menu.json
    loadMenu(); 
    
    // 3. Cargar datos del carrito y actualizar la UI
    loadCartFromStorage();
    updateCartUI(); 

    // 4. Actualizar el botón de Login/Logout
    updateLoginButton();

    // 5. Configurar el Smooth Scroll para enlaces internos
    setupSmoothScroll();
    
    // 6. Configurar el buscador de productos
    setupProductSearch();
});

/* ===================== Smooth scroll ===================== */
function setupSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth' 
                });
            }
        });
    });
}

/* ====================================================================
   ================== CARGA DINÁMICA DE MENÚ (JSON) ===================
   ==================================================================== */

async function loadMenu() {
    try {
        const response = await fetch('menu.json');
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: No se pudo cargar menu.json`);
        }
        
        const menuData = await response.json();
        const menuContainer = document.getElementById('menu-container');

        if (!menuContainer) return;

        menuContainer.innerHTML = ''; 

        menuData.forEach(category => {
            const categoryArticle = document.createElement('article');
            categoryArticle.className = 'menu-category';

            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = category.nombre;
            categoryArticle.appendChild(categoryTitle);

            const productList = document.createElement('ul');

            category.productos.forEach(product => {
                const listItem = document.createElement('li');
                
                // Asegúrate de que los precios son números válidos antes de pasarlos
                const priceValue = Number(product.precio) || 0; 
                
                listItem.innerHTML = `
                    <span class="product-name">${product.nombre}</span> 
                    <span class="price">$${priceValue}</span>
                    <p class="description">${product.descripcion}</p>
                    <button class="add-cart" onclick="addToCart('${product.nombre.replace(/'/g, "\\'")}', ${priceValue})">Agregar</button>
                `;
                
                productList.appendChild(listItem);
            });

            categoryArticle.appendChild(productList);
            menuContainer.appendChild(categoryArticle);
        });

    } catch (error) {
        console.error('Error al cargar el menú dinámico:', error);
        const container = document.getElementById('menu-container');
        if (container) {
             container.innerHTML = '<p class="error-message">Error al cargar el menú. Por favor, revise el archivo "menu.json".</p>';
        }
    }
}


/* ====================================================================
   ====================== BUSCADOR DE PRODUCTOS =======================
   ==================================================================== */

function setupProductSearch() {
    const buscador = document.getElementById("buscador");
    const menuSection = document.getElementById("menu");

    if (!buscador || !menuSection) return; 

    buscador.addEventListener("keyup", function () {
        const texto = this.value.toLowerCase().trim();

        // Baja automáticamente al menú solo si el buscador tiene contenido
        if (texto.length > 0) {
            menuSection.scrollIntoView({ behavior: "smooth" });
        }

        // Selecciona TODOS los productos del menú (ahora cargados dinámicamente)
        const productos = document.querySelectorAll(".menu-category ul li");

        productos.forEach(prod => {
            // Se usa textContent para que coincida con la carga dinámica
            const nombre = prod.querySelector(".product-name").textContent.toLowerCase();
            const desc = prod.querySelector(".description").textContent.toLowerCase();

            if (nombre.includes(texto) || desc.includes(texto)) {
                prod.style.display = "block";
            } else {
                prod.style.display = "none";
            }
        });
    });
}

/* ====================================================================
   ====================== USUARIOS Y SESIÓN (LOCALSTORAGE) =======================
   ==================================================================== */

// Inicializar DB (SIN HASHING por simplicidad del ejercicio)
function initUsersDB() {
    if (!localStorage.getItem("usuariosDB")) {
        const initial = {
            usuarios: [
                { user: "admin", pass: "1234" },
                { user: "demo", pass: "password" }
            ]
        };
        localStorage.setItem("usuariosDB", JSON.stringify(initial));
    }
}

// Registro
function register() {
    const user = document.getElementById("regUser").value.trim();
    const pass = document.getElementById("regPass").value;
    const pass2 = document.getElementById("regPass2").value;

    if (!user || !pass) {
        alert("Completa todos los campos.");
        return;
    }
    if (pass !== pass2) {
        alert("Las contraseñas no coinciden.");
        return;
    }

    let db = JSON.parse(localStorage.getItem("usuariosDB") || '{"usuarios":[]}');

    if (db.usuarios.some(u => u.user.toLowerCase() === user.toLowerCase())) {
        alert("Ese usuario ya existe.");
        return;
    }

    db.usuarios.push({ user, pass });
    localStorage.setItem("usuariosDB", JSON.stringify(db));

    alert("Cuenta creada correctamente.");
    
    // Limpiar inputs
    document.getElementById("regUser").value = "";
    document.getElementById("regPass").value = "";
    document.getElementById("regPass2").value = "";

    switchModal('registerModal', 'loginModal');
}

// Login
function login() {
    const user = document.getElementById("loginUser").value.trim();
    const pass = document.getElementById("loginPass").value;

    if (!user || !pass) {
        alert("Completa todos los campos.");
        return;
    }

    let db = JSON.parse(localStorage.getItem("usuariosDB") || '{"usuarios":[]}');

    // Búsqueda insensible a mayúsculas/minúsculas para el usuario
    const found = db.usuarios.find(u => u.user.toLowerCase() === user.toLowerCase() && u.pass === pass);

    if (found) {
        localStorage.setItem("loggedUser", found.user);
        alert("Bienvenido " + found.user);
        closeModal('loginModal');
        
        // Limpiar inputs
        document.getElementById("loginUser").value = "";
        document.getElementById("loginPass").value = "";
        updateLoginButton();
    } else {
        alert("Usuario o contraseña incorrectos.");
    }
}

// Logout
function logout() {
    localStorage.removeItem("loggedUser");
    updateLoginButton();
    alert("Sesión cerrada.");
}

// Actualizar Botón Login/Logout
function updateLoginButton() {
    const btn = document.querySelector(".login-btn");
    const user = localStorage.getItem("loggedUser");

    if (!btn) return;

    if (user) {
        btn.innerText = "Cerrar sesión (" + user + ")";
        btn.onclick = logout;
    } else {
        btn.innerText = "Iniciar Sesión";
        btn.onclick = () => openModal('loginModal');
    }
}


/* ====================================================================
   ==================== MODALES (Login / Registro / Carrito) ====================
   ==================================================================== */

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "flex";
    // Si abrimos el carrito, aseguramos que la UI esté actualizada
    if (id === 'cartModal') {
        updateCartUI();
    }
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
}

function switchModal(closeId, openId) {
    closeModal(closeId);
    openModal(openId);
}

/* ====================================================================
   ======================= CARRITO DE COMPRAS (LOCALSTORAGE) ========================
   ==================================================================== */

let cart = []; // Variable global para el carrito

// Cargar carrito desde localStorage
function loadCartFromStorage() {
    cart = JSON.parse(localStorage.getItem("cartDB") || "[]");
}

// Guardar carrito
function saveCart() {
    localStorage.setItem("cartDB", JSON.stringify(cart));
}

// Añadir producto al carrito
function addToCart(name, price) {
    cart.push({ name, price: Number(price) }); // Aseguramos que price es número
    saveCart();
    updateCartUI();
    console.log(`"${name}" agregado al carrito`);
    // Opcional: openCart(); si quieres abrir el modal inmediatamente
}

// Quitar producto por índice
function removeFromCart(i) {
    if (i < 0 || i >= cart.length) return;
    cart.splice(i, 1);
    saveCart();
    updateCartUI();
}

// Vaciar carrito
function clearCart() {
    if (!confirm("¿Vaciar todo el carrito?")) return;
    cart = [];
    saveCart();
    updateCartUI();
}

// Calcular total
function calculateTotal() {
    // Usamos Number(item.price) para asegurar que la suma es numérica
    return cart.reduce((sum, item) => sum + Number(item.price || 0), 0);
}

// Actualizar contador, listado y total
function updateCartUI() {
    const countEl = document.getElementById("cartCount");
    const totalEl = document.getElementById("cartTotal");
    const container = document.getElementById("cartItems");

    // Actualizar el contador de la barra de navegación
    if (countEl) countEl.innerText = cart.length; 

    // Solo procede si estamos dentro del modal del carrito
    if (!container) return; 

    container.innerHTML = "";

    // Actualizar el total dentro del modal
    if (totalEl) totalEl.innerText = calculateTotal().toFixed(2); // Formato con 2 decimales

    if (cart.length === 0) {
        const empty = document.createElement("div");
        empty.className = "cart-empty";
        empty.innerText = "Tu carrito está vacío.";
        container.appendChild(empty);
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

// Abrir/Cerrar modal carrito (Ya está cubierta por openModal/closeModal)
function openCart() {
    openModal("cartModal");
}

function closeCart() {
    closeModal("cartModal");
}