document.addEventListener("DOMContentLoaded", () => {
    loadDashboardStats();
});

function loadDashboardStats() {
    const products = JSON.parse(localStorage.getItem("products")) || [];
    const orders = JSON.parse(localStorage.getItem("orders")) || [];

    document.getElementById("total-products").textContent = products.length;
    document.getElementById("total-orders").textContent = orders.length;

    // Low stock filter (less than 5 items)
    const lowStockItems = products.filter(p => p.stock < 5);
    document.getElementById("low-stock-count").textContent = lowStockItems.length;

    const alertContainer = document.getElementById("low-stock-alert-list");
    if (lowStockItems.length === 0) {
        alertContainer.innerHTML = "<p>All products have sufficient stock levels.</p>";
    } else {
        let html = "<ul>";
        lowStockItems.forEach(item => {
            html += `<li>⚠️ <strong>${item.name}</strong> is running low on stock! Remaining: ${item.stock}</li>`;
        });
        html += "</ul>";
        alertContainer.innerHTML = html;
    }
}