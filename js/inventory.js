const PRODUCT_STORAGE_KEY = "zenvy_products";
const LEGACY_PRODUCT_STORAGE_KEY = "products";

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("product-form").addEventListener("submit", handleProductSubmit);
    document.getElementById("cancel-btn").addEventListener("click", resetProductForm);
    loadProducts();
});

function getProducts() {
    const stored = localStorage.getItem(PRODUCT_STORAGE_KEY);
    if (stored !== null) {
        const products = JSON.parse(stored);
        if (!Array.isArray(products)) throw new TypeError("Saved product data must be a list.");
        return products;
    }

    const legacy = localStorage.getItem(LEGACY_PRODUCT_STORAGE_KEY);
    const source = legacy === null
        ? (typeof PRODUCTS_DATA !== "undefined" ? PRODUCTS_DATA : [])
        : JSON.parse(legacy);
    if (!Array.isArray(source)) throw new TypeError("Saved product data must be a list.");

    const products = source.map(normalizeProduct);
    saveProducts(products);
    return products;
}

function normalizeProduct(product) {
    const stock = Number(product.stockCount ?? product.stock ?? 0);
    return {
        ...product,
        id: product.id ?? `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        categoryName: product.categoryName || product.category || "Product",
        stockCount: Number.isInteger(stock) && stock >= 0 ? stock : 0,
        inStock: Number.isInteger(stock) && stock > 0
    };
}

function saveProducts(products) {
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));
}

function formatProductPrice(price) {
    return `Rs. ${Number(price).toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function setProductStatus(message, isError = false) {
    const status = document.getElementById("product-form-status");
    status.textContent = message;
    status.classList.toggle("is-error", isError);
}

function loadProducts() {
    const tbody = document.getElementById("product-table-body");
    const emptyState = document.getElementById("product-empty-state");
    tbody.replaceChildren();

    try {
        const products = getProducts();
        document.getElementById("product-count").textContent =
            `${products.length} ${products.length === 1 ? "product" : "products"}`;
        emptyState.hidden = products.length > 0;

        products.forEach(product => {
            const row = document.createElement("tr");
            const imageCell = document.createElement("td");
            const image = document.createElement("img");
            const name = document.createElement("span");
            const categoryCell = document.createElement("td");
            const priceCell = document.createElement("td");
            const stockCell = document.createElement("td");
            const actionCell = document.createElement("td");
            const actions = document.createElement("div");
            const editButton = document.createElement("button");
            const deleteButton = document.createElement("button");

            image.className = "product-thumbnail";
            image.src = product.image || "images/LOGO.png";
            image.alt = "";
            image.loading = "lazy";
            name.className = "product-name-cell";
            name.textContent = product.name || "Unnamed product";
            imageCell.className = "product-cell";
            imageCell.append(image, name);
            categoryCell.textContent = product.categoryName || product.category || "—";
            priceCell.textContent = formatProductPrice(product.price);
            stockCell.className = Number(product.stockCount) <= 5 ? "stock-cell is-low" : "stock-cell";
            stockCell.textContent = `${Number(product.stockCount) || 0} in stock`;
            actions.className = "table-actions";
            editButton.type = "button";
            editButton.className = "edit-btn";
            editButton.textContent = "Edit";
            editButton.setAttribute("aria-label", `Edit ${product.name || "product"}`);
            editButton.addEventListener("click", () => editProduct(product.id));
            deleteButton.type = "button";
            deleteButton.className = "delete-btn";
            deleteButton.textContent = "Delete";
            deleteButton.setAttribute("aria-label", `Delete ${product.name || "product"}`);
            deleteButton.addEventListener("click", () => deleteProduct(product.id));
            actions.append(editButton, deleteButton);
            actionCell.appendChild(actions);
            row.append(imageCell, categoryCell, priceCell, stockCell, actionCell);
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Could not load product inventory:", error);
        emptyState.hidden = false;
        emptyState.textContent = "Product inventory could not be loaded. Check browser storage and try again.";
        document.getElementById("product-count").textContent = "Unavailable";
        setProductStatus("Could not load product inventory.", true);
    }
}

function handleProductSubmit(event) {
    event.preventDefault();

    const productId = document.getElementById("product-id").value;
    const name = document.getElementById("product-name").value.trim();
    const category = document.getElementById("product-category").value;
    const price = Number(document.getElementById("product-price").value);
    const stockCount = Number(document.getElementById("product-stock").value);
    const image = document.getElementById("product-image").value.trim();

    if (!name || !image || !Number.isFinite(price) || price < 0 ||
        !Number.isInteger(stockCount) || stockCount < 0) {
        setProductStatus("Enter a product name, image path, valid price, and whole-number stock quantity.", true);
        return;
    }

    try {
        const products = getProducts();
        const existingIndex = productId === ""
            ? -1
            : products.findIndex(product => String(product.id) === productId);
        const product = existingIndex < 0
            ? {
                id: `product-${Date.now()}`,
                rating: 0,
                reviewsCount: 0,
                popularity: 0,
                badge: "",
                badgeType: "",
                description: "",
                specs: []
            }
            : products[existingIndex];

        Object.assign(product, {
            name,
            category,
            categoryName: category.charAt(0).toUpperCase() + category.slice(1),
            price,
            image,
            stockCount,
            inStock: stockCount > 0
        });

        if (existingIndex < 0) products.push(product);
        else products[existingIndex] = product;

        saveProducts(products);
        resetProductForm();
        setProductStatus(existingIndex < 0 ? "Product added." : "Product updated.");
        loadProducts();
    } catch (error) {
        console.error("Could not save product:", error);
        setProductStatus("Could not save product. Check browser storage and try again.", true);
    }
}

function editProduct(productId) {
    try {
        const product = getProducts().find(item => String(item.id) === String(productId));
        if (!product) {
            setProductStatus("This product could not be found. Refresh the list and try again.", true);
            return;
        }

        document.getElementById("product-id").value = product.id;
        document.getElementById("product-name").value = product.name || "";
        document.getElementById("product-category").value = product.category || "food";
        document.getElementById("product-price").value = product.price ?? "";
        document.getElementById("product-stock").value = product.stockCount ?? product.stock ?? 0;
        document.getElementById("product-image").value = product.image || "";
        document.getElementById("form-title").textContent = "Edit product";
        document.getElementById("save-btn").textContent = "Save changes";
        document.getElementById("cancel-btn").hidden = false;
        setProductStatus(`Editing ${product.name || "product"}.`);
        document.getElementById("product-form").scrollIntoView({ behavior: "smooth", block: "start" });
        document.getElementById("product-name").focus({ preventScroll: true });
    } catch (error) {
        console.error("Could not open product for editing:", error);
        setProductStatus("Could not open this product for editing.", true);
    }
}

function deleteProduct(productId) {
    try {
        const products = getProducts();
        const index = products.findIndex(product => String(product.id) === String(productId));
        if (index < 0) {
            setProductStatus("This product could not be found. Refresh the list and try again.", true);
            return;
        }
        if (!window.confirm(`Delete "${products[index].name || "this product"}"?`)) return;

        products.splice(index, 1);
        saveProducts(products);
        if (document.getElementById("product-id").value === String(productId)) resetProductForm();
        setProductStatus("Product deleted.");
        loadProducts();
    } catch (error) {
        console.error("Could not delete product:", error);
        setProductStatus("Could not delete product. Check browser storage and try again.", true);
    }
}

function resetProductForm() {
    document.getElementById("product-form").reset();
    document.getElementById("product-id").value = "";
    document.getElementById("form-title").textContent = "Add a product";
    document.getElementById("save-btn").textContent = "Add product";
    document.getElementById("cancel-btn").hidden = true;
}
