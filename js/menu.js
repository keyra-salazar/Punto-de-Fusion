let menuData = [];

async function loadMenu() {
    try {
        const response = await fetch('menu.json');
        menuData = await response.json();
        renderMenu(menuData);
    } catch (e) {
        console.error("Error cargando menú", e);
    }
}

function renderMenu(data) {
    const container = document.getElementById('menu-container');
    if (!container) return;
    container.innerHTML = '';

    data.forEach(category => {
        const section = document.createElement('article');
        section.className = 'menu-category';
        section.innerHTML = `<h3>${category.nombre}</h3><ul></ul>`;
        const list = section.querySelector('ul');

        category.productos.forEach(p => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="product-name">${p.nombre}</span>
                <span class="price">$${Number(p.precio).toFixed(2)}</span>
                <p class="description">${p.descripcion}</p>
                <button class="add-cart" onclick="addToCart({name: '${p.nombre}', price: ${p.precio}})">Agregar 🛒</button>
            `;
            list.appendChild(li);
        });
        container.appendChild(section);
    });
}

function filterMenu() {
    const term = document.getElementById('buscador').value.toLowerCase();
    const filtered = menuData.map(cat => ({
        ...cat,
        productos: cat.productos.filter(p => p.nombre.toLowerCase().includes(term))
    })).filter(cat => cat.productos.length > 0);
    renderMenu(filtered);
}