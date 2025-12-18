// Modales generales
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function switchModal(oldId, newId) { closeModal(oldId); openModal(newId); }
function toggleMenu() { document.getElementById('sideMenu').classList.toggle('active'); }

// SEGURIDAD DE LA CUENTA
async function abrirCuenta() {
    if (!usuarioLogueado) {
        showToast("Inicia sesión para ver tu cuenta", 'error');
        openModal('loginModal');
        if (document.getElementById('sideMenu').classList.contains('active')) toggleMenu();
        return;
    }
    await cargarComponenteCuenta();
    const nameElem = document.getElementById('userName');
    const emailElem = document.getElementById('userEmail');
    if (nameElem) nameElem.innerText = usuarioLogueado.user;
    if (emailElem) emailElem.innerText = usuarioLogueado.email;
    openModal('cuentaModal');
    if (document.getElementById('sideMenu').classList.contains('active')) toggleMenu();
}

async function cargarComponenteCuenta() {
    if (document.getElementById('cuentaModal')) return;
    const res = await fetch('cuenta.html');
    const html = await res.text();
    document.body.insertAdjacentHTML('beforeend', html);
}

// Inicio
document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    actualizarInterfazLogin();
    document.getElementById('buscador')?.addEventListener('input', filterMenu);
});

// Toastify
function showToast(msj, type = 'success') {
    Toastify({
        text: msj,
        style: { background: type === 'success' ? "#6A453A" : "#d9534f" }
    }).showToast();
}

// Búsqueda responsiva
function toggleSearch() {
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('buscador');
    searchContainer.classList.toggle('active');
    if (searchContainer.classList.contains('active')) {
        searchInput.focus();
    } else {
        searchInput.value = '';
        filterMenu(); 
    }
}

// Función para abrir el carrito
function openCart() {
    openModal('cartModal');
}