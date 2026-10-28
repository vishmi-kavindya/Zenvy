document.addEventListener("DOMContentLoaded", () => {
    loadProducts();

    const form = document.getElementById("product-form");
    form.addEventListener("submit", handleFormSubmit);

    document.getElementById("cancel-btn").addEventListener("click", resetForm);
});

function getProducts() {
    return JSON.parse(localStorage.getItem("products")) || [];
}

function saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
}

function loadProducts() {
    const products = getProducts();
    const tbody = document.getElementById("product-table-body");
    tbody.innerHTML = "";

    products.forEach((product, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><img src="../${product.image}" alt="${product.name}"></td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>$${Number(product.price).toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>
                <button class="edit-btn" onclick="editProduct(${index})">Edit</button>
                <button class="delete-btn" onclick="deleteProduct(${index})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function handleFormSubmit(e) {
    e.preventDefault();
    const index = document.getElementById("product-id").value;
    const name = document.getElementById("product-name").value;
    const category = document.getElementById("product-category").value;
    const price = parseFloat(document.getElementById("product-price").value);
    const stock = parseInt(document.getElementById("product-stock").value);
    const image = document.getElementById("product-image").value;

    let products = getProducts();

    if (index === "") {
        // Add new product
        products.push({ id: Date.now(), name, category, price, stock, image });
    } else {
        // Edit existing product
        products[index] = { ...products[index], name, category, price, stock, image };
    }

    saveProducts(products);
    loadProducts();
    resetForm();
}

window.editProduct = function(index) {
    const products = getProducts();
    const p = products[index];

    document.getElementById("product-id").value = index;
    document.getElementById("product-name").value = p.name;
    document.getElementById("product-category").value = p.category;
    document.getElementById("product-price").value = p.price;
    document.getElementById("product-stock").value = p.stock;
    document.getElementById("product-image").value = p.image;

    document.getElementById("form-title").textContent = "Edit Product";
    document.getElementById("save-btn").textContent = "Update Product";
    document.getElementById("cancel-btn").style.display = "inline-block";
}

window.deleteProduct = function(index) {
    if (confirm("Are you sure you want to delete this product?")) {
        let products = getProducts();
        products.splice(index, 1);
        saveProducts(products);
        loadProducts();
    }
}

function resetForm() {
    document.getElementById("product-form").reset();
    document.getElementById("product-id").value = "";
    document.getElementById("form-title").textContent = "Add New Product";
    document.getElementById("save-btn").textContent = "Add Product";
    document.getElementById("cancel-btn").style.display = "none";
}