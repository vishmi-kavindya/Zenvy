document.addEventListener("DOMContentLoaded", () => {
    loadOrders();
});

function getOrders() {
    return JSON.parse(localStorage.getItem("orders")) || [];
}

function saveOrders(orders) {
    localStorage.setItem("orders", JSON.stringify(orders));
}

function loadOrders() {
    const orders = getOrders();
    const tbody = document.getElementById("orders-table-body");
    tbody.innerHTML = "";

    let totalRevenue = 0;

    orders.forEach((order, index) => {
        totalRevenue += parseFloat(order.total || 0);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>#${order.id || (index + 1)}</td>
            <td>${order.customerName || "Guest User"}</td>
            <td>${order.itemsCount || order.items?.length || 1} items</td>
            <td>$${parseFloat(order.total || 0).toFixed(2)}</td>
            <td>
                <select onchange="updateOrderStatus(${index}, this.value)">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td><button class="delete-btn" onclick="deleteOrder(${index})">Remove</button></td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("total-revenue").textContent = `$${totalRevenue.toFixed(2)}`;
}

window.updateOrderStatus = function(index, newStatus) {
    let orders = getOrders();
    if(orders[index]) {
        orders[index].status = newStatus;
        saveOrders(orders);
    }
}

window.deleteOrder = function(index) {
    if(confirm("Are you sure you want to remove this order record?")) {
        let orders = getOrders();
        orders.splice(index, 1);
        saveOrders(orders);
        loadOrders();
    }
}