document.addEventListener("DOMContentLoaded", loadDashboardStats);

function readCollection(primaryKey, fallbackKey, label) {
    const raw = localStorage.getItem(primaryKey) ?? localStorage.getItem(fallbackKey);
    if (raw === null) return [];

    try {
        const collection = JSON.parse(raw);
        if (Array.isArray(collection)) return collection;
        throw new TypeError(`Saved ${label} data must be a list.`);
    } catch (error) {
        console.error(`Could not read ${label} data:`, error);
        return null;
    }
}

function loadDashboardStats() {
    const products = readCollection("products", "zenvy_products", "product");
    const orders = readCollection("orders", "zenvy_orders", "order");

    document.getElementById("total-products").textContent = products?.length ?? "—";
    document.getElementById("total-orders").textContent = orders?.length ?? "—";

    const alertContainer = document.getElementById("low-stock-alert-list");
    if (!products) {
        document.getElementById("low-stock-count").textContent = "—";
        alertContainer.replaceChildren(createEmptyState("Inventory data could not be loaded. Check the browser console for details."));
        return;
    }

    const lowStockItems = products.filter(product => {
        const stock = Number(product.stockCount ?? product.stock);
        return Number.isFinite(stock) && stock <= 5;
    });

    document.getElementById("low-stock-count").textContent = lowStockItems.length;
    alertContainer.replaceChildren();

    if (lowStockItems.length === 0) {
        alertContainer.appendChild(createEmptyState("All products have sufficient stock."));
        return;
    }

    const list = document.createElement("ul");
    list.className = "alert-list";
    lowStockItems.forEach(product => {
        const stock = Number(product.stockCount ?? product.stock);
        const row = document.createElement("li");
        const name = document.createElement("span");
        const quantity = document.createElement("span");

        name.className = "alert-product";
        name.textContent = product.name || "Unnamed product";
        quantity.className = "alert-stock";
        quantity.textContent = `${stock} ${stock === 1 ? "unit" : "units"} left`;
        row.append(name, quantity);
        list.appendChild(row);
    });

    alertContainer.appendChild(list);
}

function createEmptyState(message) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = message;
    return emptyState;
}
