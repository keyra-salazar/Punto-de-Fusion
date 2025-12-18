let cart = [];

function addToCart(item) {
    cart.push(item);
    showToast(`✅ ${item.name} añadido`);
    updateCartUI();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    const count = document.getElementById("cartCount");
    const total = document.getElementById("cartTotal");
    const items = document.getElementById("cartItems");

    if (count) count.innerText = cart.length;

    if (items) {
        items.innerHTML = cart.length === 0 ? '<p class="cart-empty">Tu carrito está vacío</p>' : "";
        
        cart.forEach((p, i) => {
            // Estructura de "Tarjeta" con info a la izquierda y botón a la derecha
            items.innerHTML += `
                <div class="cart-item-card">
                    <div class="item-details">
                        <span class="item-name">${p.name}</span>
                        <span class="item-price">$${p.price}</span>
                    </div>
                    <button class="btn-quitar" onclick="removeFromCart(${i})">Quitar</button>
                </div>`;
        });
    }

    if (total) {
        const sum = cart.reduce((s, i) => s + Number(i.price), 0);
        total.innerText = sum.toFixed(2);
    }
}