/**
 * Zenvy Luxury E-Commerce - Order Confirmation & Status Display Engine
 * Member 02 Features:
 * - 10. Delivery address form & confirmation details
 * - 11. Order confirmation invoice
 * - 12. Order history integration
 * - 13. Order status display with visual timeline stepper
 */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatLKRCurrency(amount) {
  if (typeof formatCurrency === "function") {
    return formatCurrency(amount);
  }
  const num = Number(amount) || 0;
  return "Rs. " + num.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showToastNotification(message, type = "info") {
  if (typeof showToast === "function") {
    showToast(message, type);
  } else {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

function announceLive(message) {
  if (typeof announceLiveMessage === "function") {
    announceLiveMessage(message);
  }
}

/**
 * Determine dynamic timeline step from order timestamp
 * Steps:
 * 1: Order Placed & Confirmed
 * 2: Luxury Packaging & Signature Gift-Boxing
 * 3: Handed to Courier (PromptX / Domex)
 * 4: Out for Delivery (Colombo & Islandwide)
 * 5: Delivered
 */
function getOrderStatusDetails(order) {
  const now = Date.now();
  const orderTime = order.timestamp || (now - 60000);
  const diffHours = (now - orderTime) / (1000 * 60 * 60);

  let currentStep = 2; // Default: In Preparation
  let statusText = "Confirmed & In Preparation";
  let statusClass = "is-preparing";
  const idHash = (order.orderId || "ZNV").split("").reduce((acc, char) => acc + char.charCodeAt(0), 100000);
  let trackingNum = order.trackingNumber || `PX-LK-${Math.abs(idHash % 900000 + 100000)}`;

  if (diffHours < 0.5) {
    currentStep = 1;
    statusText = "Order Received & Verified";
    statusClass = "is-verified";
  } else if (diffHours < 2) {
    currentStep = 2;
    statusText = "Signature Luxury Packaging";
    statusClass = "is-preparing";
  } else if (diffHours < 12) {
    currentStep = 3;
    statusText = "Dispatched with Courier";
    statusClass = "is-dispatched";
  } else if (diffHours < 24) {
    currentStep = 4;
    statusText = "Out for Doorstep Delivery";
    statusClass = "is-out-for-delivery";
  } else {
    currentStep = 5;
    statusText = "Delivered & Signed";
    statusClass = "is-delivered";
  }

  return {
    currentStep,
    statusText,
    statusClass,
    courierName,
    trackingNum,
    estimatedDelivery: order.estimatedDelivery || "2–3 Business Days"
  };
}

/**
 * Initialize Order Confirmation & Status Display Page
 */
function initOrderConfirmationPage() {
  const container = document.getElementById("confirmationPageContent");
  if (!container) return;

  // Read orderId from URL query parameter e.g. ?orderId=ZNV-2026-XXXX
  const urlParams = new URLSearchParams(window.location.search);
  const requestedId = urlParams.get("orderId");

  const orders = typeof getStoredOrders === "function" ? getStoredOrders() : [];
  let order = null;

  if (requestedId) {
    order = orders.find(o => o.orderId.toLowerCase() === requestedId.trim().toLowerCase());
  }

  // Fallback to latest placed order
  if (!order && orders.length > 0) {
    order = orders[0];
  }

  if (!order) {
    renderNoOrderFound(container);
    return;
  }

  renderOrderConfirmationView(container, order);
}

/**
 * Render when no orders exist in storage
 */
function renderNoOrderFound(container) {
  container.innerHTML = `
    <div class="cart-empty-state" role="region" aria-label="Order Not Found">
      <div class="empty-cart-icon-wrap" aria-hidden="true">
        <span class="empty-bag-icon">🔍</span>
      </div>
      <h1 class="empty-cart-title">No Order Details Found</h1>
      <p class="empty-cart-desc">
        We could not locate any order receipt with that identification number in this browser. Please check your order reference or browse your profile history.
      </p>

      <!-- Order ID Search Form -->
      <form onsubmit="handleManualOrderLookup(event)" class="order-lookup-inline-form">
        <label for="manualLookupInput" class="sr-only">Enter Order ID</label>
        <input type="text" id="manualLookupInput" class="form-input" placeholder="e.g. ZNV-2026-123456" required />
        <button type="submit" class="btn-checkout" style="min-width: 140px;">
          <span>Track Order</span>
        </button>
      </form>

      <div class="empty-cart-actions" style="margin-top: 24px;">
        <a href="products.html" class="btn-primary-luxury">
          Explore Collection
        </a>
        <a href="profile.html" class="btn-secondary-demo">
          View My Profile Orders
        </a>
      </div>
    </div>
  `;
}

function handleManualOrderLookup(event) {
  event.preventDefault();
  const input = document.getElementById("manualLookupInput")?.value.trim();
  if (input) {
    window.location.href = `order-confirmation.html?orderId=${encodeURIComponent(input)}`;
  }
}

/**
 * Render the complete confirmation & order status display view
 */
function renderOrderConfirmationView(container, order) {
  const statusDetails = getOrderStatusDetails(order);

  container.innerHTML = `
    <div class="order-confirmation-wrapper">
      <!-- 1. Celebratory Success Hero -->
      <div class="confirmation-success-hero">
        <div class="success-badge-animation" aria-hidden="true">✓</div>
        <span class="success-tag">Bespoke Order Confirmed</span>
        <h1 class="success-title">Thank You For Your Luxury Order!</h1>
        <p class="success-subtitle">
          Your order <strong>#${escapeHTML(order.orderId)}</strong> has been registered. A signature presentation package is being prepared for islandwide delivery.
        </p>

        <div class="confirmation-quick-meta">
          <div class="meta-chip">
            <span class="chip-label">Order Number</span>
            <strong class="chip-val">#${escapeHTML(order.orderId)}</strong>
          </div>
          <div class="meta-chip">
            <span class="chip-label">Order Date</span>
            <strong class="chip-val">${escapeHTML(order.date)}</strong>
          </div>
          <div class="meta-chip">
            <span class="chip-label">Total Amount</span>
            <strong class="chip-val gold-amount">${formatLKRCurrency(order.grandTotal)}</strong>
          </div>
          <div class="meta-chip">
            <span class="chip-label">Courier Service</span>
            <strong class="chip-val">${escapeHTML(statusDetails.courierName)}</strong>
          </div>
        </div>
      </div>

      <!-- 2. Feature 13: Order Status Display & Interactive Timeline -->
      <section class="order-status-card" aria-labelledby="statusTimelineTitle">
        <div class="status-card-header">
          <div>
            <span class="section-tag">Live Logistics Tracking</span>
            <h2 id="statusTimelineTitle" class="status-card-title">Order Status Display</h2>
          </div>
          <div class="live-status-pill ${statusDetails.statusClass}">
            <span class="status-pulse-dot" aria-hidden="true"></span>
            <strong>${escapeHTML(statusDetails.statusText)}</strong>
          </div>
        </div>

        <!-- Courier Tracking Info Strip -->
        <div class="tracking-info-strip">
          <div class="tracking-col">
            <span class="track-label">Courier Waybill Number</span>
            <strong class="track-val"><code>${escapeHTML(statusDetails.trackingNum)}</code></strong>
          </div>
          <div class="tracking-col">
            <span class="track-label">Estimated Islandwide Delivery</span>
            <strong class="track-val">2–3 Business Days (PromptX / Domex)</strong>
          </div>
          <div class="tracking-col">
            <span class="track-label">Delivery Destination</span>
            <strong class="track-val">${escapeHTML(order.customer.city || "Colombo")}, Sri Lanka</strong>
          </div>
        </div>

        <!-- 5-Step Visual Stepper -->
        <div class="order-stepper-container" role="progressbar" aria-label="Order fulfillment progress" aria-valuenow="${statusDetails.currentStep}" aria-valuemin="1" aria-valuemax="5">
          <div class="stepper-progress-track">
            <div class="stepper-progress-fill" style="width: ${((statusDetails.currentStep - 1) / 4) * 100}%;"></div>
          </div>

          <div class="stepper-steps-row">
            <div class="stepper-step-item ${statusDetails.currentStep >= 1 ? 'is-completed' : ''} ${statusDetails.currentStep === 1 ? 'is-active' : ''}">
              <div class="step-circle" aria-hidden="true">${statusDetails.currentStep > 1 ? '✓' : '1'}</div>
              <div class="step-text">
                <strong class="step-name">Order Placed</strong>
                <span class="step-desc">Payment Verified</span>
              </div>
            </div>

            <div class="stepper-step-item ${statusDetails.currentStep >= 2 ? 'is-completed' : ''} ${statusDetails.currentStep === 2 ? 'is-active' : ''}">
              <div class="step-circle" aria-hidden="true">${statusDetails.currentStep > 2 ? '✓' : '2'}</div>
              <div class="step-text">
                <strong class="step-name">Packaging</strong>
                <span class="step-desc">Signature Gift Box</span>
              </div>
            </div>

            <div class="stepper-step-item ${statusDetails.currentStep >= 3 ? 'is-completed' : ''} ${statusDetails.currentStep === 3 ? 'is-active' : ''}">
              <div class="step-circle" aria-hidden="true">${statusDetails.currentStep > 3 ? '✓' : '3'}</div>
              <div class="step-text">
                <strong class="step-name">Handed to Courier</strong>
                <span class="step-desc">PromptX / Domex</span>
              </div>
            </div>

            <div class="stepper-step-item ${statusDetails.currentStep >= 4 ? 'is-completed' : ''} ${statusDetails.currentStep === 4 ? 'is-active' : ''}">
              <div class="step-circle" aria-hidden="true">${statusDetails.currentStep > 4 ? '✓' : '4'}</div>
              <div class="step-text">
                <strong class="step-name">Out for Delivery</strong>
                <span class="step-desc">Courier Driver en route</span>
              </div>
            </div>

            <div class="stepper-step-item ${statusDetails.currentStep >= 5 ? 'is-completed' : ''} ${statusDetails.currentStep === 5 ? 'is-active' : ''}">
              <div class="step-circle" aria-hidden="true">${statusDetails.currentStep === 5 ? '✓' : '5'}</div>
              <div class="step-text">
                <strong class="step-name">Delivered</strong>
                <span class="step-desc">Recipient Signature</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Details Grid: Delivery Address (Feature 10) & Payment Summary -->
      <div class="confirmation-details-grid">
        <!-- Feature 10: Confirmed Delivery Address Card -->
        <section class="confirmation-box" aria-labelledby="deliveryInfoHeading">
          <div class="confirmation-box-header">
            <span class="box-icon" aria-hidden="true">📍</span>
            <h3 id="deliveryInfoHeading" class="confirmation-box-title">Delivery Destination Details</h3>
          </div>
          <div class="address-details-content">
            <div class="detail-row">
              <span class="detail-label">Recipient Name:</span>
              <strong class="detail-val">${escapeHTML(order.customer.fullName)}</strong>
            </div>
            <div class="detail-row">
              <span class="detail-label">Street Address:</span>
              <strong class="detail-val">${escapeHTML(order.customer.address)}</strong>
            </div>
            <div class="detail-row">
              <span class="detail-label">City &amp; Postal Code:</span>
              <strong class="detail-val">${escapeHTML(order.customer.city)} - ${escapeHTML(order.customer.postal || '00400')}</strong>
            </div>
            <div class="detail-row">
              <span class="detail-label">Province / District:</span>
              <strong class="detail-val">${escapeHTML(order.customer.province || 'Western Province')}, Sri Lanka</strong>
            </div>
            <div class="detail-row">
              <span class="detail-label">Contact Phone:</span>
              <strong class="detail-val">${escapeHTML(order.customer.phone)}</strong>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email Invoice:</span>
              <strong class="detail-val">${escapeHTML(order.customer.email)}</strong>
            </div>
            ${order.customer.notes ? `
              <div class="detail-row notes-row">
                <span class="detail-label">Delivery Notes:</span>
                <span class="detail-val notes-val">${escapeHTML(order.customer.notes)}</span>
              </div>
            ` : ""}
          </div>
        </section>

        <!-- Payment & Security Card -->
        <section class="confirmation-box" aria-labelledby="paymentInfoHeading">
          <div class="confirmation-box-header">
            <span class="box-icon" aria-hidden="true">💳</span>
            <h3 id="paymentInfoHeading" class="confirmation-box-title">Payment &amp; Transaction Details</h3>
          </div>
          <div class="address-details-content">
            <div class="detail-row">
              <span class="detail-label">Payment Channel:</span>
              <strong class="detail-val">${escapeHTML(order.customer.paymentMethod)}</strong>
            </div>
            <div class="detail-row">
              <span class="detail-label">Transaction Status:</span>
              <strong class="detail-val" style="color: #4ade80;">✓ ${escapeHTML(order.customer.paymentStatus || 'Verified')}</strong>
            </div>
            <div class="detail-row">
              <span class="detail-label">Currency:</span>
              <strong class="detail-val">Sri Lankan Rupee (LKR / Rs.)</strong>
            </div>
            <div class="detail-row">
              <span class="detail-label">VAT / Duty:</span>
              <strong class="detail-val">5% Government VAT Included</strong>
            </div>
            <div class="detail-row">
              <span class="detail-label">Warranty Protection:</span>
              <strong class="detail-val">100% Genuine Sri Lankan Warranty</strong>
            </div>
            <div class="detail-row">
              <span class="detail-label">Security Protocol:</span>
              <strong class="detail-val">256-Bit SSL Encrypted Verification</strong>
            </div>
          </div>
        </section>
      </div>

      <!-- 4. Feature 11: Itemized Product Table & Financial Invoice Breakdown -->
      <section class="confirmation-invoice-card" aria-labelledby="invoiceItemsHeading">
        <div class="invoice-card-header">
          <h3 id="invoiceItemsHeading" class="invoice-card-title">Itemized Order Breakdown</h3>
          <span class="invoice-count-tag">${order.items.length} ${order.items.length === 1 ? 'item' : 'items'}</span>
        </div>

        <div class="invoice-items-table">
          <div class="invoice-head-row">
            <span>Item Description</span>
            <span>Category</span>
            <span>Qty</span>
            <span>Unit Price</span>
            <span style="text-align: right;">Line Total</span>
          </div>
          ${order.items.map(item => `
            <div class="invoice-item-row">
              <div class="inv-product-cell">
                <img src="${item.image}" alt="${escapeHTML(item.name)}" class="inv-thumb" onerror="this.src='images/denim.jpeg';" />
                <span class="inv-name">${escapeHTML(item.name)}</span>
              </div>
              <span class="inv-cat">${escapeHTML(item.category || 'Luxury Essential')}</span>
              <span class="inv-qty">${escapeHTML(item.quantity)}</span>
              <span class="inv-price">${formatLKRCurrency(item.price)}</span>
              <span class="inv-total" style="text-align: right;">${formatLKRCurrency(item.lineTotal)}</span>
            </div>
          `).join("")}
        </div>

        <div class="invoice-totals-breakdown">
          <div class="inv-breakdown-row">
            <span>Items Subtotal:</span>
            <span>${formatLKRCurrency(order.subtotal)}</span>
          </div>
          ${order.discount > 0 ? `
            <div class="inv-breakdown-row discount">
              <span>Voucher Savings (${escapeHTML(order.promoCode || 'PROMO')}):</span>
              <span>−${formatLKRCurrency(order.discount)}</span>
            </div>
          ` : ""}
          <div class="inv-breakdown-row">
            <span>Delivery Fee (${escapeHTML(order.shippingOption)}):</span>
            <span>${order.shippingCost === 0 ? '<strong style="color: #4ade80;">FREE</strong>' : formatLKRCurrency(order.shippingCost)}</span>
          </div>
          <div class="inv-breakdown-row">
            <span>Estimated VAT (5%):</span>
            <span>${formatLKRCurrency(order.tax)}</span>
          </div>
          <div class="inv-breakdown-row grand-total">
            <strong>Grand Total Paid:</strong>
            <strong class="gold-amount">${formatLKRCurrency(order.grandTotal)}</strong>
          </div>
        </div>
      </section>

      <!-- 5. Actions: Print Invoice, Order History, Continue Shopping -->
      <div class="confirmation-actions-strip">
        <button type="button" class="btn-print-invoice" onclick="window.print()" title="Print complete official order invoice receipt">
          🖨 Print / Save Invoice PDF
        </button>
        <button type="button" class="btn-audio-breakdown" onclick="narrateConfirmationOrder('${escapeHTML(order.orderId)}')" style="width: auto; margin: 0; padding: 12px 22px;">
          🔊 Read Confirmation Audio
        </button>
        <a href="profile.html" class="btn-checkout" style="max-width: 250px;">
          <span>View in Order History</span>
          <span aria-hidden="true">→</span>
        </a>
        <a href="products.html" class="btn-secondary-demo" style="max-width: 240px;">
          <span>Continue Shopping</span>
        </a>
      </div>
    </div>
  `;
}

/**
 * Audio narration for order confirmation & status
 */
function narrateConfirmationOrder(orderId) {
  const orders = typeof getStoredOrders === "function" ? getStoredOrders() : [];
  const order = orders.find(o => o.orderId === orderId) || orders[0];
  if (!order) return;

  const status = getOrderStatusDetails(order);
  const text = `Order Confirmation for Order Number ${order.orderId}. Your order total of ${order.grandTotal.toFixed(0)} rupees has been confirmed. Current order status is: ${status.statusText}. Courier is ${status.courierName} with tracking number ${status.trackingNum}. Destination is ${order.customer.address}, ${order.customer.city}. You can print this invoice or view your past orders in your customer profile.`;

  if (typeof narrateText === "function") {
    narrateText(text);
  } else if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
  }
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  initOrderConfirmationPage();
});
