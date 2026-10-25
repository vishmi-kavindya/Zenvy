/**
 * Zenvy - Shopping Cart & Order Processing Engine
 * Member 02 Feature Implementation
 *
 * Technologies:
 * - HTML5 & Semantic Web Structure
 * - CSS3 (VÉLORA Luxury Warm Palette, WCAG AAA High Contrast, Font Scaling)
 * - JavaScript (ES6+ modular logic, events, DOM manipulation)
 * - localStorage persistence for:
 *   1. 'zenvy_cart': active cart items with quantities
 *   2. 'zenvy_products': catalog stock counts & inventory tracking
 *   3. 'zenvy_orders': completed order invoices & history
 *   4. 'zenvy_promo': active discount voucher code
 *   5. 'zenvy_shipping': selected delivery speed
 */

// Storage Keys
const CART_STORAGE_KEY = "zenvy_cart";
const LEGACY_CART_KEY = "auramart_cart";
const PRODUCTS_STORAGE_KEY = "zenvy_products";
const ORDERS_STORAGE_KEY = "zenvy_orders";
const PROMO_STORAGE_KEY = "zenvy_promo";
const SHIPPING_STORAGE_KEY = "zenvy_shipping";

// Shipping Rates Configuration
const SHIPPING_OPTIONS = {
  standard: {
    id: "standard",
    name: "Standard Luxury Delivery",
    estimate: "3-5 Business Days",
    price: 9.99,
    freeThreshold: 100.00
  },
  express: {
    id: "express",
    name: "Priority Air Courier",
    estimate: "1-2 Business Days",
    price: 14.99,
    freeThreshold: null
  },
  overnight: {
    id: "overnight",
    name: "White-Glove VIP Delivery",
    estimate: "Next Day Guaranteed",
    price: 24.99,
    freeThreshold: null
  }
};

// Available Promo Vouchers
const PROMO_VOUCHERS = {
  "ZENVY10": { code: "ZENVY10", type: "percent", value: 10, description: "10% Off Entire Order" },
  "AURA20":  { code: "AURA20",  type: "percent", value: 20, description: "20% Off Luxury VIP Voucher" },
  "WELCOME": { code: "WELCOME", type: "fixed",   value: 15, minSpend: 50, description: "$15 Off Orders Over $50" },
  "FREESHIP":{ code: "FREESHIP",type: "shipping",value: 100, description: "Free Complimentary Shipping" }
};

/* ==========================================================================
   1. LOCALSTORAGE PRODUCT & INVENTORY MANAGEMENT
   ========================================================================== */

/**
 * Initialize products in localStorage if not already present
 * @returns {Array} List of product objects with up-to-date stock
 */
function getStoredProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Error reading stored products:", e);
  }

  // Seed default PRODUCTS_DATA if available
  if (typeof PRODUCTS_DATA !== "undefined" && Array.isArray(PRODUCTS_DATA)) {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(PRODUCTS_DATA));
    } catch (e) {
      console.warn("Error seeding products to localStorage:", e);
    }
    return PRODUCTS_DATA;
  }
  return [];
}

/**
 * Save updated products catalog into localStorage
 * @param {Array} products 
 */
function saveStoredProducts(products) {
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.error("Failed to save products to localStorage:", e);
  }
}

/**
 * Get product by ID from stored catalog (falls back to PRODUCTS_DATA)
 * @param {string} productId 
 * @returns {Object|null}
 */
function getProductDataById(productId) {
  const catalog = getStoredProducts();
  const found = catalog.find(p => p.id === productId);
  if (found) return found;
  if (typeof PRODUCTS_DATA !== "undefined") {
    return PRODUCTS_DATA.find(p => p.id === productId) || null;
  }
  return null;
}

/**
 * Deduct purchased stock from localStorage products inventory
 * @param {Array} orderItems Array of { id, quantity }
 */
function deductInventoryStock(orderItems) {
  const catalog = getStoredProducts().map(item => ({ ...item }));
  let modified = false;

  orderItems.forEach(cartItem => {
    const prod = catalog.find(p => p.id === cartItem.id);
    if (prod) {
      const newStock = Math.max(0, (prod.stockCount || 0) - cartItem.quantity);
      prod.stockCount = newStock;
      prod.inStock = newStock > 0;
      modified = true;
    }
  });

  if (modified) {
    saveStoredProducts(catalog);
  }
}

/* ==========================================================================
   2. CART LOCALSTORAGE CRUD OPERATIONS
   ========================================================================== */

/**
 * Retrieve cart items array from localStorage
 * @returns {Array<{id: string, quantity: number, addedAt: number}>}
 */
function getCart() {
  try {
    let raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      // Check legacy key
      raw = localStorage.getItem(LEGACY_CART_KEY);
    }
    if (raw) {
      const items = JSON.parse(raw);
      if (Array.isArray(items)) {
        return items.filter(item => item && item.id && item.quantity > 0);
      }
    }
  } catch (e) {
    console.error("Failed to parse cart from localStorage:", e);
  }
  return [];
}

/**
 * Save cart items to localStorage and synchronize UI badges
 * @param {Array} cart 
 */
function saveCart(cart) {
  try {
    const cleanCart = cart.filter(item => item && item.id && item.quantity > 0);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cleanCart));
    localStorage.setItem(LEGACY_CART_KEY, JSON.stringify(cleanCart));
  } catch (e) {
    console.error("Failed to save cart to localStorage:", e);
  }
  updateCartBadges();
}

/**
 * Add product to cart with optional quantity
 * @param {string} productId 
 * @param {number} quantity 
 * @param {Event} [event] 
 */
function addToCart(productId, quantity = 1, event = null) {
  if (event) {
    event.stopPropagation();
  }

  const product = getProductDataById(productId);
  if (!product) {
    showToast("Product not found", "error");
    return;
  }

  if (!product.inStock || product.stockCount <= 0) {
    showToast(`${product.name} is currently out of stock`, "error");
    return;
  }

  const cart = getCart();
  const existingIndex = cart.findIndex(item => item.id === productId);

  let newQuantity = quantity;
  if (existingIndex > -1) {
    newQuantity = cart[existingIndex].quantity + quantity;
  }

  // Stock availability check
  if (product.stockCount && newQuantity > product.stockCount) {
    newQuantity = product.stockCount;
    showToast(`Maximum available stock (${product.stockCount}) added`, "warning");
  }

  if (existingIndex > -1) {
    cart[existingIndex].quantity = newQuantity;
    cart[existingIndex].updatedAt = Date.now();
  } else {
    cart.push({
      id: productId,
      quantity: newQuantity,
      addedAt: Date.now()
    });
  }

  saveCart(cart);

  // User feedback: Toast & A11y Live Announcement
  showToast(`Added ${product.name} (${newQuantity} in bag)`, "success");
  if (typeof announceLiveMessage === "function") {
    announceLiveMessage(`Added ${product.name} to shopping bag. Bag now contains ${getCartTotalQuantity()} items.`);
  }

  // Trigger button bounce/pulse animation if element provided
  if (event && event.currentTarget) {
    const btn = event.currentTarget;
    btn.classList.add("btn-added-pulse");
    setTimeout(() => btn.classList.remove("btn-added-pulse"), 600);
  }

  // If currently on cart page, re-render
  if (document.getElementById("cartContentArea")) {
    renderCartPage();
  }
}

/**
 * Update quantity of a specific cart item
 * @param {string} productId 
 * @param {number} newQuantity 
 */
function updateCartQuantity(productId, newQuantity) {
  const qty = parseInt(newQuantity, 10);
  const cart = getCart();

  if (isNaN(qty) || qty <= 0) {
    removeFromCart(productId);
    return;
  }

  const product = getProductDataById(productId);
  if (product && product.stockCount && qty > product.stockCount) {
    showToast(`Only ${product.stockCount} items available in stock`, "warning");
    const item = cart.find(i => i.id === productId);
    if (item) item.quantity = product.stockCount;
  } else {
    const item = cart.find(i => i.id === productId);
    if (item) item.quantity = qty;
  }

  saveCart(cart);

  if (document.getElementById("cartContentArea")) {
    renderCartPage();
  }
}

/**
 * Remove an item from the cart
 * @param {string} productId 
 */
function removeFromCart(productId) {
  const product = getProductDataById(productId);
  const name = product ? product.name : "Item";
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);

  showToast(`Removed "${name}" from your bag`, "info");
  if (typeof announceLiveMessage === "function") {
    announceLiveMessage(`Removed ${name} from shopping bag.`);
  }

  if (document.getElementById("cartContentArea")) {
    renderCartPage();
  }
}

/**
 * Clear entire cart
 * @param {boolean} confirmed 
 */
function clearCart(confirmed = false) {
  if (!confirmed) {
    const modal = document.getElementById("clearCartModal");
    if (modal) {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      return;
    }
  }

  closeClearCartModal();
  saveCart([]);
  removePromoVoucher(false);
  showToast("Your shopping bag has been cleared", "info");

  if (document.getElementById("cartContentArea")) {
    renderCartPage();
  }
}

function closeClearCartModal() {
  const modal = document.getElementById("clearCartModal");
  if (modal) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }
}

/**
 * Quick-add sample demo luxury items to cart (convenience helper for testing)
 */
function seedDemoCart() {
  const demoItems = [
    { id: "prod-1", quantity: 1 }, // Headphones
    { id: "prod-8", quantity: 2 }  // Raw Wildflower Honey
  ];
  saveCart(demoItems);
  showToast("Loaded sample luxury items into your shopping bag!", "success");
  if (document.getElementById("cartContentArea")) {
    renderCartPage();
  }
}

/* ==========================================================================
   3. CART CALCULATIONS, PROMOS & TOTALS
   ========================================================================== */

/**
 * Get total quantity count of all items in cart
 * @returns {number}
 */
function getCartTotalQuantity() {
  return getCart().reduce((acc, item) => acc + (item.quantity || 0), 0);
}

/**
 * Get currently selected shipping option
 * @returns {Object}
 */
function getSelectedShippingOption() {
  try {
    const saved = localStorage.getItem(SHIPPING_STORAGE_KEY);
    if (saved && SHIPPING_OPTIONS[saved]) {
      return SHIPPING_OPTIONS[saved];
    }
  } catch (e) {
    console.warn("Error reading shipping option:", e);
  }
  return SHIPPING_OPTIONS.standard;
}

/**
 * Select a shipping method and save in localStorage
 * @param {string} shippingId 
 */
function selectShippingMethod(shippingId) {
  if (SHIPPING_OPTIONS[shippingId]) {
    try {
      localStorage.setItem(SHIPPING_STORAGE_KEY, shippingId);
    } catch (e) {
      console.warn("Storage error", e);
    }
    showToast(`Shipping updated: ${SHIPPING_OPTIONS[shippingId].name}`, "info");
    if (document.getElementById("cartContentArea")) {
      renderCartPage();
    }
  }
}

/**
 * Get active promo voucher from localStorage
 * @returns {Object|null}
 */
function getActivePromoVoucher() {
  try {
    const raw = localStorage.getItem(PROMO_STORAGE_KEY);
    if (raw) {
      const code = raw.toUpperCase().trim();
      if (PROMO_VOUCHERS[code]) {
        return PROMO_VOUCHERS[code];
      }
    }
  } catch (e) {
    console.warn("Error reading promo:", e);
  }
  return null;
}

/**
 * Apply promo code to cart
 * @param {string} inputCode 
 */
function applyPromoVoucher(inputCode) {
  const code = (inputCode || "").trim().toUpperCase();
  if (!code) {
    showToast("Please enter a voucher code", "warning");
    return;
  }

  const voucher = PROMO_VOUCHERS[code];
  if (!voucher) {
    showToast(`Invalid promo code "${code}". Try ZENVY10 or AURA20`, "error");
    return;
  }

  const totals = calculateCartTotals();
  if (voucher.minSpend && totals.subtotal < voucher.minSpend) {
    showToast(`Code "${code}" requires minimum subtotal of $${voucher.minSpend.toFixed(2)}`, "warning");
    return;
  }

  try {
    localStorage.setItem(PROMO_STORAGE_KEY, code);
  } catch (e) {
    console.warn("Storage error", e);
  }

  showToast(`Voucher applied: ${voucher.description}!`, "success");
  if (typeof announceLiveMessage === "function") {
    announceLiveMessage(`Promo code ${code} applied. ${voucher.description}.`);
  }

  if (document.getElementById("cartContentArea")) {
    renderCartPage();
  }
}

/**
 * Remove active promo code
 * @param {boolean} [showNotice=true] 
 */
function removePromoVoucher(showNotice = true) {
  try {
    localStorage.removeItem(PROMO_STORAGE_KEY);
  } catch (e) {
    console.warn("Storage error", e);
  }
  if (showNotice) {
    showToast("Voucher code removed", "info");
  }
  if (document.getElementById("cartContentArea")) {
    renderCartPage();
  }
}

/**
 * Comprehensive Cart Totals Calculation
 * @returns {Object} subtotal, discount, shipping, tax, grandTotal, etc.
 */
function calculateCartTotals() {
  const cart = getCart();
  let subtotal = 0;
  let totalItems = 0;

  const itemDetails = cart.map(cartItem => {
    const product = getProductDataById(cartItem.id);
    if (!product) return null;

    const lineTotal = product.price * cartItem.quantity;
    subtotal += lineTotal;
    totalItems += cartItem.quantity;

    return {
      product,
      quantity: cartItem.quantity,
      lineTotal
    };
  }).filter(Boolean);

  // Selected Shipping
  const shippingOption = getSelectedShippingOption();
  let shippingCost = shippingOption.price;

  // Free standard shipping if subtotal >= 100
  if (shippingOption.id === "standard" && subtotal >= (shippingOption.freeThreshold || 100)) {
    shippingCost = 0.00;
  }

  // Active Promo Discount
  const promo = getActivePromoVoucher();
  let discountAmount = 0;

  if (promo && subtotal > 0) {
    if (promo.type === "percent") {
      discountAmount = (subtotal * promo.value) / 100;
    } else if (promo.type === "fixed") {
      discountAmount = Math.min(subtotal, promo.value);
    } else if (promo.type === "shipping") {
      discountAmount = shippingCost;
      shippingCost = 0.00;
    }
  }

  // Estimated Tax: 5% of discounted subtotal
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = subtotal > 0 ? taxableAmount * 0.05 : 0;

  // Grand Total
  const grandTotal = Math.max(0, taxableAmount + shippingCost + taxAmount);

  // Free Shipping Threshold Progress
  const standardThreshold = 100.00;
  const freeShippingProgress = Math.min(100, (subtotal / standardThreshold) * 100);
  const freeShippingShortfall = Math.max(0, standardThreshold - subtotal);
  const isFreeShippingUnlocked = subtotal >= standardThreshold;

  return {
    items: itemDetails,
    itemCount: totalItems,
    subtotal,
    shippingOption,
    shippingCost,
    promo,
    discountAmount,
    taxAmount,
    grandTotal,
    freeShippingProgress,
    freeShippingShortfall,
    isFreeShippingUnlocked
  };
}

/* ==========================================================================
   4. UI RENDERING: CART PAGE
   ========================================================================== */

/**
 * Synchronize cart badge counters on all header triggers across all pages
 */
function updateCartBadges() {
  const count = getCartTotalQuantity();
  const badges = document.querySelectorAll(".cart-count-badge, #cartBadgeCount");

  badges.forEach(badge => {
    badge.textContent = count;
    badge.setAttribute("aria-label", `${count} items in shopping cart`);
    if (count > 0) {
      badge.style.display = "inline-flex";
    } else {
      badge.style.display = "inline-flex";
    }
  });
}

/**
 * Render the entire Cart Page (`cart.html`)
 */
function renderCartPage() {
  const container = document.getElementById("cartContentArea");
  if (!container) return;

  const totals = calculateCartTotals();
  updateCartBadges();

  // Update Free Shipping Progress Bar
  const meterEl = document.getElementById("freeShippingMeter");
  if (meterEl) {
    meterEl.innerHTML = renderFreeShippingMeterHTML(totals);
  }

  // Update Header Item Counter Pill
  const countPill = document.getElementById("cartHeaderCount");
  if (countPill) {
    countPill.textContent = `${totals.itemCount} ${totals.itemCount === 1 ? 'item' : 'items'}`;
  }

  // Empty Cart State
  if (totals.items.length === 0) {
    container.innerHTML = renderEmptyCartHTML();
    return;
  }

  // Populated 2-Column Cart Layout
  container.innerHTML = `
    <div class="cart-layout-grid">
      <!-- Left Column: Cart Items & Actions -->
      <section class="cart-items-column" aria-label="Shopping Bag Items">
        <div class="cart-table-card">
          <div class="cart-table-header">
            <span class="col-head col-prod">Product</span>
            <span class="col-head col-price">Price</span>
            <span class="col-head col-qty">Quantity</span>
            <span class="col-head col-total">Total</span>
            <span class="col-head col-act" aria-label="Actions"></span>
          </div>

          <div class="cart-items-list" role="list">
            ${totals.items.map(item => renderCartItemRowHTML(item)).join("")}
          </div>

          <div class="cart-items-footer-row">
            <a href="products.html" class="btn-continue-shopping" title="Browse catalog for more essentials">
              <span aria-hidden="true">←</span> Continue Exploring Collection
            </a>
            <button 
              type="button" 
              class="btn-clear-cart" 
              onclick="clearCart(false)" 
              aria-label="Clear all items from your shopping bag"
            >
              <span aria-hidden="true">🗑</span> Clear Entire Bag
            </button>
          </div>
        </div>

        <!-- Recommended Luxury Complements -->
        <div class="cart-recommendations-box">
          <div class="recs-header">
            <span class="recs-tag">Curated For You</span>
            <h3 class="recs-title">Complete Your Luxury Experience</h3>
          </div>
          <div class="recs-grid">
            ${renderCartRecommendationsHTML(totals.items.map(i => i.product.id))}
          </div>
        </div>
      </section>

      <!-- Right Column: Sticky Order Summary & Checkout -->
      <aside class="cart-summary-column" aria-label="Order Summary & Checkout">
        <div class="cart-summary-card">
          <h2 class="summary-heading">Order Summary</h2>

          <!-- Subtotal -->
          <div class="summary-line">
            <span class="summary-label">Subtotal (${totals.itemCount} items)</span>
            <span class="summary-val">$${totals.subtotal.toFixed(2)}</span>
          </div>

          <!-- Promo Voucher Section -->
          <div class="summary-promo-block">
            <label for="promoCodeInput" class="summary-label-sub">Promotional Voucher</label>
            ${totals.promo ? `
              <div class="applied-promo-tag" role="status">
                <div class="promo-tag-left">
                  <span class="promo-check">✓</span>
                  <div>
                    <strong>${totals.promo.code}</strong>
                    <span class="promo-desc">${totals.promo.description}</span>
                  </div>
                </div>
                <button type="button" class="btn-remove-promo" onclick="removePromoVoucher()" aria-label="Remove promo code">✕</button>
              </div>
            ` : `
              <div class="promo-input-row">
                <input 
                  type="text" 
                  id="promoCodeInput" 
                  class="promo-text-input" 
                  placeholder="e.g. ZENVY10 or AURA20" 
                  aria-label="Enter promotional voucher code"
                  onkeydown="if(event.key==='Enter'){ applyPromoVoucher(this.value); }"
                />
                <button 
                  type="button" 
                  class="btn-apply-promo" 
                  onclick="applyPromoVoucher(document.getElementById('promoCodeInput').value)"
                >
                  Apply
                </button>
              </div>
              <div class="promo-hints">Try <button type="button" class="promo-quick-btn" onclick="applyPromoVoucher('ZENVY10')">ZENVY10</button> or <button type="button" class="promo-quick-btn" onclick="applyPromoVoucher('AURA20')">AURA20</button></div>
            `}
          </div>

          ${totals.discountAmount > 0 ? `
            <div class="summary-line discount-line">
              <span class="summary-label">Voucher Savings (${totals.promo.code})</span>
              <span class="summary-val discount-val">−$${totals.discountAmount.toFixed(2)}</span>
            </div>
          ` : ""}

          <!-- Shipping Speed Selector -->
          <div class="summary-shipping-block">
            <span class="summary-label-sub" id="shippingOptionsLabel">Delivery Speed</span>
            <div class="shipping-options-list" role="radiogroup" aria-labelledby="shippingOptionsLabel">
              ${Object.values(SHIPPING_OPTIONS).map(opt => {
                const isSelected = totals.shippingOption.id === opt.id;
                const isFree = opt.id === "standard" && totals.subtotal >= 100;
                const costDisplay = isFree ? "FREE" : `$${opt.price.toFixed(2)}`;
                return `
                  <label class="shipping-option-card ${isSelected ? 'is-selected' : ''}">
                    <input 
                      type="radio" 
                      name="shippingSpeed" 
                      value="${opt.id}" 
                      ${isSelected ? 'checked' : ''} 
                      onchange="selectShippingMethod('${opt.id}')"
                    />
                    <div class="shipping-info">
                      <div class="shipping-name-row">
                        <strong class="shipping-title">${opt.name}</strong>
                        <span class="shipping-price-pill ${isFree ? 'is-free' : ''}">${costDisplay}</span>
                      </div>
                      <span class="shipping-est">${opt.estimate}</span>
                    </div>
                  </label>
                `;
              }).join("")}
            </div>
          </div>

          <!-- Sales Tax -->
          <div class="summary-line">
            <span class="summary-label">Estimated Tax (5% Standard)</span>
            <span class="summary-val">$${totals.taxAmount.toFixed(2)}</span>
          </div>

          <div class="summary-divider"></div>

          <!-- Grand Total -->
          <div class="summary-total-line">
            <div>
              <span class="summary-total-label">Grand Total</span>
              <span class="summary-tax-note">Includes all luxury duties &amp; delivery</span>
            </div>
            <span class="summary-total-val">$${totals.grandTotal.toFixed(2)}</span>
          </div>

          <!-- Primary Checkout Button -->
          <button 
            type="button" 
            class="btn-checkout" 
            onclick="openCheckoutModal()"
            aria-label="Proceed to Secure Checkout. Total $${totals.grandTotal.toFixed(2)}"
          >
            <span class="lock-icon" aria-hidden="true">🔒</span>
            <span class="btn-text">Proceed to Checkout</span>
            <span class="checkout-arrow" aria-hidden="true">→</span>
          </button>

          <!-- Accessibility Audio Narration -->
          <button 
            type="button" 
            class="btn-audio-breakdown" 
            onclick="narrateCartBreakdown()"
            aria-label="Listen to audio spoken breakdown of your order"
            title="Read summary out loud with speech synthesizer"
          >
            <span aria-hidden="true">🔊</span> Read Order Summary
          </button>

          <!-- Trust Badges & Guarantee -->
          <div class="summary-trust-strip">
            <div class="trust-badge-item">
              <span class="trust-icon" aria-hidden="true">🛡</span>
              <div class="trust-text">
                <strong>256-Bit SSL Encryption</strong>
                <span>Bank-grade checkout protection</span>
              </div>
            </div>
            <div class="trust-badge-item">
              <span class="trust-icon" aria-hidden="true">↺</span>
              <div class="trust-text">
                <strong>30-Day Luxury Returns</strong>
                <span>Complimentary hassle-free returns</span>
              </div>
            </div>
            <div class="trust-badge-item">
              <span class="trust-icon" aria-hidden="true">♿</span>
              <div class="trust-text">
                <strong>Universal Design Standard</strong>
                <span>WCAG AAA Accessible Checkout</span>
              </div>
            </div>
          </div>

          <!-- View Past Orders link -->
          <div class="summary-history-link-wrap">
            <button type="button" class="btn-view-history" onclick="openOrderHistoryModal()">
              📦 View Previous Orders (${getStoredOrders().length})
            </button>
          </div>
        </div>
      </aside>
    </div>
  `;
}

/**
 * Free Shipping Progress Bar HTML
 * @param {Object} totals 
 */
function renderFreeShippingMeterHTML(totals) {
  if (totals.isFreeShippingUnlocked) {
    return `
      <div class="free-shipping-box is-unlocked" role="status" aria-live="polite">
        <div class="shipping-meter-text">
          <span class="shipping-meter-icon">🎉</span>
          <span><strong>Complimentary Luxury Shipping Unlocked!</strong> You qualify for free Standard Delivery on this order.</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill unlocked" style="width: 100%;"></div>
        </div>
      </div>
    `;
  }

  return `
    <div class="free-shipping-box" role="status" aria-live="polite">
      <div class="shipping-meter-text">
        <span class="shipping-meter-icon">✈</span>
        <span>Add <strong>$${totals.freeShippingShortfall.toFixed(2)}</strong> more of luxury essentials to unlock <strong>Free Standard Delivery</strong>!</span>
      </div>
      <div class="progress-bar-track" aria-label="Free shipping progress" role="progressbar" aria-valuenow="${Math.round(totals.freeShippingProgress)}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar-fill" style="width: ${totals.freeShippingProgress}%;"></div>
      </div>
    </div>
  `;
}

/**
 * Empty Cart State HTML
 */
function renderEmptyCartHTML() {
  const pastOrdersCount = getStoredOrders().length;
  return `
    <div class="cart-empty-state" role="region" aria-label="Empty Shopping Bag">
      <div class="empty-cart-icon-wrap" aria-hidden="true">
        <span class="empty-bag-icon">🛍</span>
      </div>
      <h2 class="empty-cart-title">Your Shopping Bag is Empty</h2>
      <p class="empty-cart-desc">
        Explore our curated collection of luxury apparel, acoustic studio sound, and organic culinary delicacies designed for modern digital living.
      </p>

      <div class="empty-cart-actions">
        <a href="products.html" class="btn-primary-luxury">
          Explore The Collection
        </a>
        <button type="button" class="btn-secondary-demo" onclick="seedDemoCart()" title="Load test items to test cart and checkout">
          ⚡ Quick Add Sample Items
        </button>
        ${pastOrdersCount > 0 ? `
          <button type="button" class="btn-history-secondary" onclick="openOrderHistoryModal()">
            📦 View Past Orders (${pastOrdersCount})
          </button>
        ` : ""}
      </div>
    </div>
  `;
}

/**
 * Render single cart item row
 * @param {Object} item { product, quantity, lineTotal }
 */
function renderCartItemRowHTML(item) {
  const p = item.product;
  const svgFallback = (typeof PRODUCT_SVG_ICONS !== "undefined" && PRODUCT_SVG_ICONS[p.svgIcon]) ? PRODUCT_SVG_ICONS[p.svgIcon] : "";

  return `
    <article class="cart-item-row" id="cartRow-${p.id}" role="listitem">
      <!-- Product Thumbnail & Details -->
      <div class="cart-col-product">
        <div class="cart-thumb-box" onclick="if(typeof openProductModal==='function') openProductModal('${p.id}')" role="button" tabindex="0" aria-label="View details for ${p.name}">
          <img 
            src="${p.image}" 
            alt="${p.name}" 
            class="cart-thumb-img" 
            loading="lazy"
            onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';"
          />
          <div class="cart-thumb-svg" style="display: none;">
            ${svgFallback}
          </div>
        </div>

        <div class="cart-item-info">
          <span class="cart-item-cat">${p.categoryName || p.category}</span>
          <h3 class="cart-item-title">
            <a href="javascript:void(0)" onclick="if(typeof openProductModal==='function') openProductModal('${p.id}')">${p.name}</a>
          </h3>
          <span class="cart-item-stock ${p.stockCount <= 5 ? 'is-low' : 'is-ok'}">
            ● ${p.stockCount <= 5 ? `Only ${p.stockCount} left in stock` : 'In Stock'}
          </span>
        </div>
      </div>

      <!-- Unit Price -->
      <div class="cart-col-price">
        <span class="col-mobile-label">Price:</span>
        <div class="unit-price-wrap">
          <span class="item-unit-price">$${p.price.toFixed(2)}</span>
          ${p.originalPrice ? `<span class="item-orig-price">$${p.originalPrice.toFixed(2)}</span>` : ""}
        </div>
      </div>

      <!-- Quantity Selector -->
      <div class="cart-col-qty">
        <span class="col-mobile-label">Quantity:</span>
        <div class="cart-qty-controller" role="group" aria-label="Adjust quantity for ${p.name}">
          <button 
            type="button" 
            class="btn-qty-step" 
            onclick="updateCartQuantity('${p.id}', ${item.quantity - 1})"
            aria-label="Decrease quantity"
            ${item.quantity <= 1 ? 'title="Remove item from bag"' : ''}
          >−</button>
          <input 
            type="number" 
            class="cart-qty-input" 
            value="${item.quantity}" 
            min="1" 
            max="${p.stockCount || 99}" 
            aria-label="Quantity for ${p.name}"
            onchange="updateCartQuantity('${p.id}', this.value)"
          />
          <button 
            type="button" 
            class="btn-qty-step" 
            onclick="updateCartQuantity('${p.id}', ${item.quantity + 1})"
            aria-label="Increase quantity"
            ${item.quantity >= (p.stockCount || 99) ? 'disabled title="Max stock reached"' : ''}
          >+</button>
        </div>
      </div>

      <!-- Line Total -->
      <div class="cart-col-total">
        <span class="col-mobile-label">Total:</span>
        <span class="item-line-total">$${item.lineTotal.toFixed(2)}</span>
      </div>

      <!-- Remove Action -->
      <div class="cart-col-remove">
        <button 
          type="button" 
          class="btn-remove-item" 
          onclick="removeFromCart('${p.id}')"
          aria-label="Remove ${p.name} from bag"
          title="Remove item"
        >
          <span aria-hidden="true">✕</span>
          <span class="remove-label">Remove</span>
        </button>
      </div>
    </article>
  `;
}

/**
 * Recommendations for products not currently in cart
 * @param {Array<string>} existingIds 
 */
function renderCartRecommendationsHTML(existingIds) {
  const allProds = getStoredProducts();
  const candidates = allProds.filter(p => !existingIds.includes(p.id)).slice(0, 3);

  if (candidates.length === 0) {
    return `<p class="no-recs">You have explored all our current luxury essentials!</p>`;
  }

  return candidates.map(p => `
    <div class="rec-mini-card">
      <img src="${p.image}" alt="${p.name}" class="rec-img" onerror="this.src='images/denim.jpeg';" />
      <div class="rec-info">
        <h4 class="rec-name">${p.name}</h4>
        <span class="rec-price">$${p.price.toFixed(2)}</span>
      </div>
      <button 
        type="button" 
        class="btn-rec-add" 
        onclick="addToCart('${p.id}', 1, event)"
        aria-label="Add ${p.name} to bag"
        title="Quick add to bag"
      >
        + Add
      </button>
    </div>
  `).join("");
}

/* ==========================================================================
   5. AUDIO NARRATION FOR SHOPPING CART (ACCESSIBILITY)
   ========================================================================== */

/**
 * Speak full auditory breakdown of the cart using Web Speech API
 */
function narrateCartBreakdown() {
  const totals = calculateCartTotals();
  if (totals.items.length === 0) {
    if (typeof narrateText === "function") {
      narrateText("Your shopping bag is currently empty. Please browse our collection to add essentials.");
    }
    return;
  }

  const itemsSpoken = totals.items.map(i => `${i.quantity} of ${i.product.name} at ${i.product.price} dollars each`).join(", ");
  const text = `Shopping bag overview. You have ${totals.itemCount} items in your bag. Items include: ${itemsSpoken}. Subtotal is ${totals.subtotal.toFixed(2)} dollars. ` +
    (totals.discountAmount > 0 ? `Voucher discount of ${totals.discountAmount.toFixed(2)} dollars applied. ` : "") +
    `Selected shipping is ${totals.shippingOption.name} costing ${totals.shippingCost === 0 ? "free of charge" : totals.shippingCost.toFixed(2) + " dollars"}. ` +
    `Estimated tax is ${totals.taxAmount.toFixed(2)} dollars. Grand total is ${totals.grandTotal.toFixed(2)} dollars. ` +
    `Press Tab to proceed to checkout.`;

  if (typeof narrateText === "function") {
    narrateText(text);
  } else if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
  }
}

/* ==========================================================================
   6. CHECKOUT MODAL & ORDER PROCESSING (LOCALSTORAGE SAVED ORDERS)
   ========================================================================== */

/**
 * Open Checkout Dialog Modal
 */
function openCheckoutModal() {
  const totals = calculateCartTotals();
  if (totals.items.length === 0) {
    showToast("Your shopping bag is empty", "warning");
    return;
  }

  const modal = document.getElementById("checkoutModal");
  const itemsContainer = document.getElementById("checkoutItemsSummary");
  const totalValEl = document.getElementById("checkoutGrandTotal");

  if (itemsContainer) {
    itemsContainer.innerHTML = totals.items.map(i => `
      <div class="checkout-mini-item">
        <span class="chk-qty">${i.quantity}x</span>
        <span class="chk-title">${i.product.name}</span>
        <span class="chk-price">$${i.lineTotal.toFixed(2)}</span>
      </div>
    `).join("");
  }

  if (totalValEl) {
    totalValEl.textContent = `$${totals.grandTotal.toFixed(2)}`;
  }

  if (modal) {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const firstInput = document.getElementById("checkoutFullName");
    if (firstInput) firstInput.focus();
  }
}

function closeCheckoutModal() {
  const modal = document.getElementById("checkoutModal");
  if (modal) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }
}

/**
 * Helper to auto-fill sample valid checkout information for testing
 */
function fillTestCheckoutData() {
  const fields = {
    checkoutFullName: "Alexander Vance",
    checkoutEmail: "alexander.vance@zenvy-luxury.com",
    checkoutPhone: "+1 (555) 019-2834",
    checkoutAddress: "Penthouse 4B, 740 Park Avenue",
    checkoutCity: "New York",
    checkoutPostal: "10021",
    checkoutCardNum: "4242 •••• •••• 4242",
    checkoutCardExpiry: "12/28",
    checkoutCardCvv: "888",
    checkoutNotes: "Please deliver with signature verification."
  };

  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });

  showToast("Auto-filled test checkout credentials!", "info");
}

/**
 * Handle Checkout Submission & Save Order in localStorage
 * @param {Event} e 
 */
function handleCheckoutSubmit(e) {
  if (e) e.preventDefault();

  const fullName = (document.getElementById("checkoutFullName")?.value || "").trim();
  const email = (document.getElementById("checkoutEmail")?.value || "").trim();
  const phone = (document.getElementById("checkoutPhone")?.value || "").trim();
  const address = (document.getElementById("checkoutAddress")?.value || "").trim();
  const city = (document.getElementById("checkoutCity")?.value || "").trim();
  const postal = (document.getElementById("checkoutPostal")?.value || "").trim();
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || "card";
  const notes = (document.getElementById("checkoutNotes")?.value || "").trim();

  // Basic Validation
  if (!fullName || !email || !address || !city) {
    showToast("Please fill in all required shipping fields", "error");
    return;
  }

  const totals = calculateCartTotals();
  if (totals.items.length === 0) {
    showToast("No items in bag to checkout", "error");
    return;
  }

  // Submit button visual loading state
  const submitBtn = document.getElementById("btnConfirmOrder");
  const origBtnContent = submitBtn ? submitBtn.innerHTML : "";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner" aria-hidden="true">⏳</span> Securing &amp; Processing Order...`;
  }

  setTimeout(() => {
    // Generate Order ID & Timestamp
    const orderId = `ZNV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderDate = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    });

    // Create Order Object
    const order = {
      orderId,
      date: orderDate,
      timestamp: Date.now(),
      customer: {
        fullName,
        email,
        phone,
        address,
        city,
        postal,
        paymentMethod: paymentMethod === "card" ? "Credit / Debit Card (Verified)" : paymentMethod === "cod" ? "Cash on Delivery" : "Digital Wallet",
        notes
      },
      items: totals.items.map(i => ({
        id: i.product.id,
        name: i.product.name,
        category: i.product.categoryName,
        price: i.product.price,
        quantity: i.quantity,
        lineTotal: i.lineTotal,
        image: i.product.image
      })),
      subtotal: totals.subtotal,
      discount: totals.discountAmount,
      promoCode: totals.promo ? totals.promo.code : null,
      shippingOption: totals.shippingOption.name,
      shippingCost: totals.shippingCost,
      tax: totals.taxAmount,
      grandTotal: totals.grandTotal,
      status: "Confirmed & In Preparation"
    };

    // 1. Deduct Stock from localStorage Products
    deductInventoryStock(totals.items.map(i => ({ id: i.product.id, quantity: i.quantity })));

    // 2. Save Order into localStorage
    saveOrderToStorage(order);

    // 3. Clear Cart in localStorage
    saveCart([]);
    removePromoVoucher(false);

    // Restore button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origBtnContent;
    }

    // Close checkout modal
    closeCheckoutModal();

    // Show Celebration & Invoice Modal
    showOrderSuccessModal(order);

    // Re-render cart page if on it
    if (document.getElementById("cartContentArea")) {
      renderCartPage();
    }
  }, 1200);
}

/* ==========================================================================
   7. ORDER SUCCESS MODAL & INVOICE RECEIPT
   ========================================================================== */

/**
 * Display Order Success Confirmation Modal
 * @param {Object} order 
 */
function showOrderSuccessModal(order) {
  const modal = document.getElementById("orderSuccessModal");
  const content = document.getElementById("orderSuccessContent");
  if (!modal || !content) return;

  content.innerHTML = `
    <div class="order-success-card">
      <div class="success-badge-animation" aria-hidden="true">✓</div>
      <span class="success-tag">Payment &amp; Reservation Confirmed</span>
      <h2 class="success-title">Thank You For Your Order!</h2>
      <p class="success-subtitle">
        Your bespoke order <strong>#${order.orderId}</strong> has been received and is being carefully packaged in signature luxury presentation.
      </p>

      <div class="invoice-summary-box">
        <div class="invoice-meta-row">
          <div>
            <span class="meta-label">Order Number</span>
            <strong class="meta-val">${order.orderId}</strong>
          </div>
          <div>
            <span class="meta-label">Order Date</span>
            <strong class="meta-val">${order.date}</strong>
          </div>
          <div>
            <span class="meta-label">Payment Method</span>
            <strong class="meta-val">${order.customer.paymentMethod}</strong>
          </div>
          <div>
            <span class="meta-label">Delivery Address</span>
            <strong class="meta-val">${order.customer.address}, ${order.customer.city}</strong>
          </div>
        </div>

        <div class="invoice-items-table">
          <div class="invoice-head-row">
            <span>Item</span>
            <span>Qty</span>
            <span>Price</span>
            <span style="text-align: right;">Total</span>
          </div>
          ${order.items.map(i => `
            <div class="invoice-item-row">
              <span class="inv-name">${i.name}</span>
              <span class="inv-qty">${i.quantity}</span>
              <span class="inv-price">$${i.price.toFixed(2)}</span>
              <span class="inv-total" style="text-align: right;">$${i.lineTotal.toFixed(2)}</span>
            </div>
          `).join("")}
        </div>

        <div class="invoice-totals-breakdown">
          <div class="inv-breakdown-row">
            <span>Subtotal:</span>
            <span>$${order.subtotal.toFixed(2)}</span>
          </div>
          ${order.discount > 0 ? `
            <div class="inv-breakdown-row discount">
              <span>Voucher Savings (${order.promoCode}):</span>
              <span>−$${order.discount.toFixed(2)}</span>
            </div>
          ` : ""}
          <div class="inv-breakdown-row">
            <span>Shipping (${order.shippingOption}):</span>
            <span>${order.shippingCost === 0 ? "FREE" : `$${order.shippingCost.toFixed(2)}`}</span>
          </div>
          <div class="inv-breakdown-row">
            <span>Sales Tax (5%):</span>
            <span>$${order.tax.toFixed(2)}</span>
          </div>
          <div class="inv-breakdown-row grand-total">
            <strong>Grand Total Paid:</strong>
            <strong class="gold-amount">$${order.grandTotal.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      <div class="invoice-actions-row">
        <button type="button" class="btn-print-invoice" onclick="window.print()">
          🖨 Print Invoice / Receipt
        </button>
        <button type="button" class="btn-continue-store" onclick="closeOrderSuccessModal()">
          Continue Shopping
        </button>
      </div>
    </div>
  `;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  if (typeof announceLiveMessage === "function") {
    announceLiveMessage(`Order ${order.orderId} placed successfully. Total paid $${order.grandTotal.toFixed(2)}.`);
  }
}

function closeOrderSuccessModal() {
  const modal = document.getElementById("orderSuccessModal");
  if (modal) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }
}

/* ==========================================================================
   8. ORDER HISTORY (SAVED ORDERS IN LOCALSTORAGE)
   ========================================================================== */

/**
 * Retrieve saved orders list from localStorage
 * @returns {Array}
 */
function getStoredOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (raw) {
      const orders = JSON.parse(raw);
      if (Array.isArray(orders)) return orders;
    }
  } catch (e) {
    console.warn("Error reading orders from localStorage:", e);
  }
  return [];
}

/**
 * Save new order into localStorage
 * @param {Object} order 
 */
function saveOrderToStorage(order) {
  try {
    const existing = getStoredOrders();
    existing.unshift(order); // Prepend new order at beginning
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("Failed to save order to localStorage:", e);
  }
}

/**
 * Open Order History Modal
 */
function openOrderHistoryModal() {
  const modal = document.getElementById("orderHistoryModal");
  const listContainer = document.getElementById("orderHistoryContent");
  if (!modal || !listContainer) return;

  const orders = getStoredOrders();

  if (orders.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-orders-view">
        <span class="empty-orders-icon">📦</span>
        <h3>No Past Orders Found</h3>
        <p>You have not placed any orders from this browser session yet.</p>
        <button type="button" class="btn-primary-luxury" onclick="closeOrderHistoryModal()">
          Explore Collection
        </button>
      </div>
    `;
  } else {
    listContainer.innerHTML = `
      <div class="orders-history-list">
        ${orders.map(ord => `
          <div class="past-order-card">
            <div class="past-order-header">
              <div>
                <span class="past-order-id">#${ord.orderId}</span>
                <span class="past-order-date">${ord.date}</span>
              </div>
              <span class="past-order-status-badge">● ${ord.status || 'Confirmed'}</span>
            </div>

            <div class="past-order-items-preview">
              ${ord.items.map(i => `
                <div class="past-item-pill">
                  <span class="pill-qty">${i.quantity}×</span>
                  <span class="pill-name">${i.name}</span>
                  <span class="pill-price">$${i.lineTotal.toFixed(2)}</span>
                </div>
              `).join("")}
            </div>

            <div class="past-order-footer">
              <span class="past-order-total">Total Paid: <strong>$${ord.grandTotal.toFixed(2)}</strong></span>
              <button type="button" class="btn-reorder" onclick="reorderItems('${ord.orderId}')">
                🔁 Re-order Items
              </button>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeOrderHistoryModal() {
  const modal = document.getElementById("orderHistoryModal");
  if (modal) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }
}

/**
 * Re-order all items from a past order back into active cart
 * @param {string} orderId 
 */
function reorderItems(orderId) {
  const orders = getStoredOrders();
  const found = orders.find(o => o.orderId === orderId);
  if (!found) return;

  found.items.forEach(item => {
    addToCart(item.id, item.quantity);
  });

  closeOrderHistoryModal();
  showToast(`Loaded ${found.items.length} items from #${orderId} into bag`, "success");

  if (document.getElementById("cartContentArea")) {
    renderCartPage();
  }
}

/* ==========================================================================
   9. MODAL QUANTITY SELECTOR HELPER (FOR PRODUCT DETAILS MODAL)
   ========================================================================== */

/**
 * Adjust quantity inside the Product Quick View Modal
 * @param {number} delta 
 */
function adjustModalQty(delta) {
  const input = document.getElementById("modalQuantityInput");
  if (!input) return;
  let val = parseInt(input.value, 10) || 1;
  const max = parseInt(input.getAttribute("max"), 10) || 99;
  val = Math.max(1, Math.min(max, val + delta));
  input.value = val;
}

/**
 * Add item from modal into cart with selected quantity
 * @param {string} productId 
 */
function addModalItemToCart(productId) {
  const input = document.getElementById("modalQuantityInput");
  const qty = input ? parseInt(input.value, 10) || 1 : 1;
  addToCart(productId, qty);
  if (typeof closeModal === "function") {
    closeModal();
  }
}

/* ==========================================================================
   10. INITIALIZATION
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize products catalog in localStorage if needed
  getStoredProducts();

  // 2. Synchronize badge counters everywhere
  updateCartBadges();

  // 3. Render Cart page if current page is cart.html
  if (document.getElementById("cartContentArea")) {
    renderCartPage();
  }

  // 4. Keyboard Shortcuts: Escape to close open modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCheckoutModal();
      closeOrderSuccessModal();
      closeOrderHistoryModal();
      closeClearCartModal();
    }
  });
});
