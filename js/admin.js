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
    const products = readCollection("zenvy_products", "products", "product");
    const orders = readDashboardOrders();

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

function readDashboardOrders() {
    const keys = new Set(["orders", "zenvy_orders"]);
    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key?.startsWith("zenvy_orders:user:")) keys.add(key);
    }

    const orders = [];
    for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (raw === null) continue;

        try {
            const collection = JSON.parse(raw);
            if (!Array.isArray(collection)) {
                throw new TypeError(`Saved order data in "${key}" must be a list.`);
            }
            orders.push(...collection);
        } catch (error) {
            console.error("Could not read order data:", error);
            return null;
        }
    }

    return orders;
}

function createEmptyState(message) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = message;
    return emptyState;
}
