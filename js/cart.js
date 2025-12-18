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
    items.innerHTML += `
        <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee;">
            <div class="item-details">
                <div class="item-name" style="font-weight: bold; font-size: 1.1rem;">${p.name}</div>
                <div class="item-price" style="color: #666;">$${p.price}</div>
            </div>
            <button class="btn-quitar" onclick="removeFromCart(${i})" 
                style="background-color: #d9534f !important; color: white !important; border: none !important; padding: 8px 15px !important; border-radius: 5px !important; cursor: pointer; font-weight: bold;">
                Quitar
            </button>
        </div>`;
});
    }

    if (total) {
        const sum = cart.reduce((s, i) => s + Number(i.price), 0);
        total.innerText = sum.toFixed(2);
    }
}