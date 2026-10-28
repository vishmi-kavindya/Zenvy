const ORDER_STORAGE_KEYS = ["zenvy_orders", "orders"];
const ORDER_STATUSES = [
    "Confirmed & In Preparation",
    "Order Received & Verified",
    "Signature Luxury Packaging",
    "Dispatched with Courier",
    "Out for Doorstep Delivery",
    "Delivered & Signed",
    "Cancelled"
];

document.addEventListener("DOMContentLoaded", loadOrders);

function getOrderBuckets() {
    const keys = new Set(ORDER_STORAGE_KEYS);
    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key?.startsWith("zenvy_orders:user:")) keys.add(key);
    }

    return [...keys].flatMap(key => {
        const raw = localStorage.getItem(key);
        if (raw === null) return [];

        const orders = JSON.parse(raw);
        if (!Array.isArray(orders)) {
            throw new TypeError(`Saved order data in "${key}" must be a list.`);
        }
        return [{ key, orders }];
    });
}

function getOrderRecords() {
    return getOrderBuckets().flatMap(bucket => bucket.orders.map((order, index) => ({
        key: bucket.key,
        index,
        order
    }))).sort((a, b) => Number(b.order.timestamp || 0) - Number(a.order.timestamp || 0));
}

function formatOrderCurrency(amount) {
    return `Rs. ${Number(amount).toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function orderTotal(order) {
    const total = Number(order.grandTotal ?? order.total ?? 0);
    return Number.isFinite(total) ? total : 0;
}

function orderItemCount(order) {
    if (Number.isInteger(order.itemsCount) && order.itemsCount >= 0) return order.itemsCount;
    if (!Array.isArray(order.items)) return 0;
    return order.items.reduce((sum, item) => {
        const quantity = Number(item.quantity);
        return sum + (Number.isInteger(quantity) && quantity > 0 ? quantity : 1);
    }, 0);
}

function customerName(order) {
    return order.customer?.fullName || order.customerName || order.customer?.name ||
        order.customer?.email || "Guest customer";
}

function displayOrderId(order, index) {
    return order.orderId || order.id || `Order ${index + 1}`;
}

function showOrderMessage(message, isError = false) {
    const status = document.getElementById("orders-status-message");
    status.textContent = message;
    status.classList.toggle("is-error", isError);
}

function loadOrders() {
    const tbody = document.getElementById("orders-table-body");
    const emptyState = document.getElementById("orders-empty-state");
    tbody.replaceChildren();

    try {
        const records = getOrderRecords();
        const revenue = records.reduce((sum, record) => {
            const cancelled = String(record.order.status || "").toLowerCase().includes("cancel");
            return cancelled ? sum : sum + orderTotal(record.order);
        }, 0);

        document.getElementById("total-order-count").textContent = records.length;
        document.getElementById("total-revenue").textContent = formatOrderCurrency(revenue);
        document.getElementById("orders-count").textContent =
            `${records.length} ${records.length === 1 ? "order" : "orders"}`;
        emptyState.hidden = records.length > 0;

        records.forEach((record, rowIndex) => {
            const order = record.order;
            const row = document.createElement("tr");
            const idCell = document.createElement("td");
            const id = document.createElement("strong");
            const customerCell = document.createElement("td");
            const itemsCell = document.createElement("td");
            const totalCell = document.createElement("td");
            const statusCell = document.createElement("td");
            const actionCell = document.createElement("td");
            const statusSelect = document.createElement("select");
            const deleteButton = document.createElement("button");
            const currentStatus = order.status || ORDER_STATUSES[0];
            const statuses = ORDER_STATUSES.includes(currentStatus)
                ? ORDER_STATUSES
                : [currentStatus, ...ORDER_STATUSES];

            id.textContent = `#${displayOrderId(order, rowIndex)}`;
            idCell.appendChild(id);
            customerCell.textContent = customerName(order);
            itemsCell.textContent = `${orderItemCount(order)} ${orderItemCount(order) === 1 ? "item" : "items"}`;
            totalCell.textContent = formatOrderCurrency(orderTotal(order));
            statusSelect.setAttribute("aria-label", `Status for order ${displayOrderId(order, rowIndex)}`);
            statuses.forEach(status => {
                const option = document.createElement("option");
                option.value = status;
                option.textContent = status;
                option.selected = status === currentStatus;
                statusSelect.appendChild(option);
            });
            statusSelect.addEventListener("change", () => updateOrderStatus(record, statusSelect.value));
            statusCell.appendChild(statusSelect);
            deleteButton.type = "button";
            deleteButton.className = "delete-btn";
            deleteButton.textContent = "Remove";
            deleteButton.setAttribute("aria-label", `Remove order ${displayOrderId(order, rowIndex)}`);
            deleteButton.addEventListener("click", () => deleteOrder(record));
            actionCell.appendChild(deleteButton);
            row.append(idCell, customerCell, itemsCell, totalCell, statusCell, actionCell);
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Could not load customer orders:", error);
        document.getElementById("total-order-count").textContent = "—";
        document.getElementById("total-revenue").textContent = "Unavailable";
        document.getElementById("orders-count").textContent = "Unavailable";
        emptyState.hidden = false;
        emptyState.textContent = "Orders could not be loaded. Check browser storage and try again.";
        showOrderMessage("Could not load customer orders.", true);
    }
}

function updateOrderStatus(record, newStatus) {
    try {
        const orders = JSON.parse(localStorage.getItem(record.key) || "[]");
        if (!Array.isArray(orders) || !orders[record.index]) {
            throw new Error("The selected order is no longer available.");
        }

        orders[record.index] = { ...orders[record.index], status: newStatus };
        localStorage.setItem(record.key, JSON.stringify(orders));
        showOrderMessage(`Order status updated to "${newStatus}".`);
        loadOrders();
    } catch (error) {
        console.error("Could not update order status:", error);
        showOrderMessage("Could not update order status. Check browser storage and try again.", true);
        loadOrders();
    }
}

function deleteOrder(record) {
    const orderId = displayOrderId(record.order, record.index);
    if (!window.confirm(`Remove order ${orderId}?`)) return;

    try {
        const orders = JSON.parse(localStorage.getItem(record.key) || "[]");
        if (!Array.isArray(orders) || !orders[record.index]) {
            throw new Error("The selected order is no longer available.");
        }

        orders.splice(record.index, 1);
        localStorage.setItem(record.key, JSON.stringify(orders));
        showOrderMessage(`Order ${orderId} removed.`);
        loadOrders();
    } catch (error) {
        console.error("Could not remove order:", error);
        showOrderMessage("Could not remove order. Check browser storage and try again.", true);
        loadOrders();
    }
}
