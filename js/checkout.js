/**
 * Zenvy Luxury E-Commerce - Checkout Engine
 * Member 02 Feature: 9. Checkout page
 *
 * Handles:
 * - Two-column responsive luxury checkout layout
 * - Pre-populating saved customer delivery details from profile
 * - Live Sri Lankan shipping methods & promo voucher recalculation
 * - Stock verification and inventory deduction
 * - LocalStorage order invoice generation & persistence
 * - Print invoice receipt generation & accessibility narration
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
 * Initialize and render checkout page
 */
function initCheckoutPage() {
  const container = document.getElementById("checkoutPageContent");
  if (!container) return;

  // Workflow Step: Is user logged in?
  // If NO -> Redirect to Login Page with return redirect to Checkout
  const account = typeof getCurrentZenvyAccount === "function" ? getCurrentZenvyAccount() : null;
  if (!account) {
    window.location.href = "login.html?redirect=checkout.html";
    return;
  }

  const totals = typeof calculateCartTotals === "function" ? calculateCartTotals() : null;
  if (!totals || totals.items.length === 0) {
    renderCheckoutEmptyBag(container);
    return;
  }

  renderCheckoutWorkspace(container, totals);
}

/**
 * Render empty bag state on checkout page
 */
function renderCheckoutEmptyBag(container) {
  container.innerHTML = `
    <div class="cart-empty-state" role="region" aria-label="Empty Shopping Bag">
      <div class="empty-cart-icon-wrap" aria-hidden="true">
        <span class="empty-bag-icon">🛍</span>
      </div>
      <h1 class="empty-cart-title">Your Shopping Bag is Empty</h1>
      <p class="empty-cart-desc">
        There are no luxury essentials in your bag to checkout. Please explore our curated collections to add items before placing an order.
      </p>
      <div class="empty-cart-actions">
        <a href="products.html" class="btn-primary-luxury">
          Explore The Collection
        </a>
        <button type="button" class="btn-secondary-demo" onclick="seedDemoCartAndCheckout()">
          ⚡ Quick Add Sample Items
        </button>
      </div>
    </div>
  `;
}

function seedDemoCartAndCheckout() {
  if (typeof seedDemoCart === "function") {
    seedDemoCart();
    initCheckoutPage();
  }
}

/**
 * Render the main 2-column checkout workspace
 */
function renderCheckoutWorkspace(container, totals) {
  const account = typeof getCurrentZenvyAccount === "function" ? getCurrentZenvyAccount() : null;
  const profile = account?.profile || {};

  container.innerHTML = `
    <div class="checkout-layout-grid">
      <!-- Left Column: Checkout Multi-Step Form -->
      <section class="checkout-main-column" aria-label="Checkout Process">
        <form id="dedicatedCheckoutForm" onsubmit="processDedicatedCheckout(event)" class="checkout-steps-form">
          <!-- Step 1: Customer & Delivery Details -->
          <div class="checkout-step-card">
            <div class="checkout-step-header">
              <div class="step-badge">1</div>
              <div>
                <h2 class="step-title">Customer &amp; Delivery Destination</h2>
                <p class="step-subtitle">Where should our courier deliver your luxury parcel in Sri Lanka?</p>
              </div>
              <button type="button" class="btn-autofill-test" onclick="fillSriLankanDemoData()" title="Fill sample Colombo delivery details">
                ⚡ Fill Sample Details
              </button>
            </div>

            ${account ? `
              <div class="checkout-account-banner">
                <span class="acc-icon" aria-hidden="true">✓</span>
                <span>Signed in as <strong>${escapeHTML(account.name)}</strong> (${escapeHTML(account.email)}). Your details have been pre-filled.</span>
              </div>
            ` : `
              <div class="checkout-guest-banner">
                <span>Have a Zenvy account? <a href="login.html">Sign in</a> to use saved delivery addresses.</span>
              </div>
            `}

            <div class="form-group">
              <label for="chkFullName" class="form-label">Full Recipient Name *</label>
              <input type="text" id="chkFullName" class="form-input" required placeholder="e.g. Kavinda Perera" value="${escapeHTML(profile.fullName || account?.name || '')}" />
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label for="chkEmail" class="form-label">Email Address (For Invoice) *</label>
                <input type="email" id="chkEmail" class="form-input" required placeholder="kavinda.perera@gmail.com" value="${escapeHTML(account?.email || '')}" />
              </div>
              <div class="form-group">
                <label for="chkPhone" class="form-label">Mobile Phone (Sri Lanka) *</label>
                <input type="tel" id="chkPhone" class="form-input" required placeholder="e.g. +94 77 123 4567" value="${escapeHTML(profile.phone || '')}" />
              </div>
            </div>

            <div class="form-group">
              <label for="chkAddress" class="form-label">Delivery Street Address *</label>
              <input type="text" id="chkAddress" class="form-input" required placeholder="e.g. No. 45/2, Galle Road, Bambalapitiya" value="${escapeHTML(profile.address || '')}" />
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label for="chkCity" class="form-label">City / Town *</label>
                <input type="text" id="chkCity" class="form-input" required placeholder="e.g. Colombo, Kandy, Galle" value="${escapeHTML(profile.city || '')}" />
              </div>
              <div class="form-group">
                <label for="chkPostal" class="form-label">Postal Code *</label>
                <input type="text" id="chkPostal" class="form-input" required placeholder="e.g. 00400" value="${escapeHTML(profile.postal || '')}" />
              </div>
            </div>

            <div class="form-group">
              <label for="chkProvince" class="form-label">Province / District</label>
              <select id="chkProvince" class="form-input">
                <option value="Western Province" ${profile.province === 'Western Province' ? 'selected' : ''}>Western Province (Colombo, Gampaha, Kalutara)</option>
                <option value="Central Province" ${profile.province === 'Central Province' ? 'selected' : ''}>Central Province (Kandy, Nuwara Eliya, Matale)</option>
                <option value="Southern Province" ${profile.province === 'Southern Province' ? 'selected' : ''}>Southern Province (Galle, Matara, Hambantota)</option>
                <option value="North Western Province" ${profile.province === 'North Western Province' ? 'selected' : ''}>North Western Province (Kurunegala, Puttalam)</option>
                <option value="Sabaragamuwa Province" ${profile.province === 'Sabaragamuwa Province' ? 'selected' : ''}>Sabaragamuwa Province (Ratnapura, Kegalle)</option>
                <option value="Eastern Province" ${profile.province === 'Eastern Province' ? 'selected' : ''}>Eastern Province (Trincomalee, Batticaloa, Ampara)</option>
                <option value="Uva Province" ${profile.province === 'Uva Province' ? 'selected' : ''}>Uva Province (Badulla, Monaragala)</option>
                <option value="North Central Province" ${profile.province === 'North Central Province' ? 'selected' : ''}>North Central Province (Anuradhapura, Polonnaruwa)</option>
                <option value="Northern Province" ${profile.province === 'Northern Province' ? 'selected' : ''}>Northern Province (Jaffna, Kilinochchi, Mannar)</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label for="chkNotes" class="form-label">Delivery Notes / Landmark Instructions (Optional)</label>
              <input type="text" id="chkNotes" class="form-input" placeholder="e.g. Call 077 123 4567 upon arrival; deliver during office hours" value="${escapeHTML(profile.notes || '')}" />
            </div>

            ${account ? `
              <label class="account-consent" style="margin-top: 16px;">
                <input type="checkbox" id="chkSaveProfile" checked />
                <span>Save/update these delivery details in my Zenvy profile</span>
              </label>
            ` : ""}
          </div>

          <!-- Step 2: Islandwide Delivery Method -->
          <div class="checkout-step-card">
            <div class="checkout-step-header">
              <div class="step-badge">2</div>
              <div>
                <h2 class="step-title">Delivery Speed &amp; Courier Service</h2>
                <p class="step-subtitle">Islandwide door-to-door delivery with live tracking</p>
              </div>
            </div>

            <div class="shipping-options-list" role="radiogroup" aria-label="Sri Lankan Delivery Options">
              ${Object.values(SHIPPING_OPTIONS).map(opt => {
                const isSelected = totals.shippingOption.id === opt.id;
                const isFree = opt.id === "standard" && totals.subtotal >= (opt.freeThreshold || 10000.00);
                const costDisplay = isFree ? "FREE" : formatLKRCurrency(opt.price);
                return `
                  <label class="shipping-option-card ${isSelected ? 'is-selected' : ''}">
                    <input 
                      type="radio" 
                      name="checkoutShippingSpeed" 
                      value="${opt.id}" 
                      ${isSelected ? 'checked' : ''} 
                      onchange="updateCheckoutShippingMethod('${opt.id}')"
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

          <!-- Step 3: Mock Payment Gateway (Sri Lanka) -->
          <div class="checkout-step-card">
            <div class="checkout-step-header">
              <div class="step-badge">3</div>
              <div>
                <h2 class="step-title">Mock Payment Gateway (Sri Lanka)</h2>
                <p class="step-subtitle">Authorize simulated checkout transaction in Sri Lankan Rupees (LKR)</p>
              </div>
            </div>

            <div class="payment-radio-group">
              <label class="payment-radio-card is-selected">
                <input type="radio" name="checkoutPaymentMethod" value="card" checked onchange="handlePaymentMethodChange(this.value)" />
                <div class="pay-card-label">
                  <span>💳 Credit / Debit Card (Visa, MasterCard, LankaPay)</span>
                  <span style="font-size: 0.72rem; color: var(--primary);">(Simulated Payment Gateway Demo)</span>
                </div>
              </label>

              <!-- Simulated Card Details -->
              <div id="simulatedCardInputs" class="simulated-card-box">
                <div class="form-group">
                  <label for="chkCardNum" class="form-label">Card Number</label>
                  <input type="text" id="chkCardNum" class="form-input" placeholder="4242 •••• •••• 4242" value="4242 •••• •••• 4242" />
                </div>
                <div class="form-row-2">
                  <div class="form-group">
                    <label for="chkCardExp" class="form-label">Expiry Date</label>
                    <input type="text" id="chkCardExp" class="form-input" placeholder="MM/YY" value="12/28" />
                  </div>
                  <div class="form-group">
                    <label for="chkCardCvv" class="form-label">CVV / CVC</label>
                    <input type="password" id="chkCardCvv" class="form-input" placeholder="•••" maxlength="4" value="888" />
                  </div>
                </div>
                <p class="checkout-demo-note">Demo notice: No real money is charged. Test transactions use simulated authorization.</p>
              </div>

              <label class="payment-radio-card">
                <input type="radio" name="checkoutPaymentMethod" value="cod" onchange="handlePaymentMethodChange(this.value)" />
                <div class="pay-card-label">
                  <span>💵 Cash on Delivery (Islandwide COD)</span>
                  <span style="font-size: 0.72rem; color: var(--primary);">(Pay cash directly upon parcel delivery)</span>
                </div>
              </label>

              <label class="payment-radio-card">
                <input type="radio" name="checkoutPaymentMethod" value="koko" onchange="handlePaymentMethodChange(this.value)" />
                <div class="pay-card-label">
                  <span>📱 Koko / Mintpay (Buy Now Pay Later)</span>
                  <span style="font-size: 0.72rem; color: var(--text-muted);">(3 interest-free installments in LKR)</span>
                </div>
              </label>

              <label class="payment-radio-card">
                <input type="radio" name="checkoutPaymentMethod" value="lankaqr" onchange="handlePaymentMethodChange(this.value)" />
                <div class="pay-card-label">
                  <span>🏦 LankaQR / FriMi / Direct Bank Transfer</span>
                  <span style="font-size: 0.72rem; color: var(--text-muted);">(Prompt QR scan or bank slip upload)</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Step 4: Review, Terms & Confirmation -->
          <div class="checkout-step-card">
            <label class="account-consent">
              <input type="checkbox" id="chkAgreeTerms" required checked />
              <span>I agree to Zenvy's luxury terms of service, delivery policies, and 30-day returns guarantee.</span>
            </label>

            <button type="submit" id="btnPlaceOrderMain" class="btn-checkout" style="min-height: 56px; font-size: 1.1rem;">
              <span class="lock-icon" aria-hidden="true">🔒</span>
              <span id="btnPlaceOrderText">Authorize Mock Payment &bull; ${formatLKRCurrency(totals.grandTotal)}</span>
              <span class="checkout-arrow" aria-hidden="true">→</span>
          </div>
        </form>
      </section>

      <!-- Right Column: Sticky Order Summary -->
      <aside class="checkout-summary-column" aria-label="Order Summary">
        <div class="cart-summary-card">
          <div class="summary-header-row">
            <h2 class="summary-heading">Order Summary</h2>
            <span class="cart-count-pill">${totals.itemCount} ${totals.itemCount === 1 ? 'item' : 'items'}</span>
          </div>

          <!-- Free Shipping Meter -->
          <div style="margin-bottom: 20px;">
            ${renderFreeShippingMeterHTML(totals)}
          </div>

          <!-- Itemized list preview -->
          <div class="checkout-items-preview-list" style="margin-bottom: 20px; max-height: 320px; overflow-y: auto;">
            ${totals.items.map(item => `
              <div class="checkout-item-line">
                <img src="${item.product.image}" alt="${escapeHTML(item.product.name)}" class="chk-item-thumb" onerror="this.src='images/denim.jpeg';" />
                <div class="chk-item-details">
                  <span class="chk-item-name">${escapeHTML(item.product.name)}</span>
                  <span class="chk-item-meta">${item.quantity} × ${formatLKRCurrency(item.product.price)}</span>
                </div>
                <strong class="chk-item-total">${formatLKRCurrency(item.lineTotal)}</strong>
              </div>
            `).join("")}
          </div>

          <!-- Subtotal -->
          <div class="summary-line">
            <span class="summary-label">Items Subtotal</span>
            <span class="summary-val">${formatLKRCurrency(totals.subtotal)}</span>
          </div>

          <!-- Promo Voucher Block -->
          <div class="summary-promo-block">
            <label for="chkPromoInput" class="summary-label-sub">Promotional Voucher</label>
            ${totals.promo ? `
              <div class="applied-promo-tag" role="status">
                <div class="promo-tag-left">
                  <span class="promo-check">✓</span>
                  <div>
                    <strong>${escapeHTML(totals.promo.code)}</strong>
                    <span class="promo-desc">${escapeHTML(totals.promo.description)}</span>
                  </div>
                </div>
                <button type="button" class="btn-remove-promo" onclick="removeCheckoutPromo()" aria-label="Remove promo code">✕</button>
              </div>
            ` : `
              <div class="promo-input-row">
                <input 
                  type="text" 
                  id="chkPromoInput" 
                  class="promo-text-input" 
                  placeholder="e.g. ZENVY10 or AURA20" 
                  aria-label="Enter promotional voucher code"
                  onkeydown="if(event.key==='Enter'){ event.preventDefault(); applyCheckoutPromo(this.value); }"
                />
                <button 
                  type="button" 
                  class="btn-apply-promo" 
                  onclick="applyCheckoutPromo(document.getElementById('chkPromoInput').value)"
                >
                  Apply
                </button>
              </div>
              <div class="promo-hints">
                Try <button type="button" class="promo-quick-btn" onclick="applyCheckoutPromo('ZENVY10')">ZENVY10</button> or 
                <button type="button" class="promo-quick-btn" onclick="applyCheckoutPromo('AURA20')">AURA20</button>
              </div>
            `}
          </div>

          ${totals.discountAmount > 0 ? `
            <div class="summary-line discount-line">
              <span class="summary-label">Voucher Savings (${escapeHTML(totals.promo?.code)})</span>
              <span class="summary-val discount-val">−${formatLKRCurrency(totals.discountAmount)}</span>
            </div>
          ` : ""}

          <!-- Shipping line -->
          <div class="summary-line">
            <span class="summary-label">${escapeHTML(totals.shippingOption.name)}</span>
            <span class="summary-val">${totals.shippingCost === 0 ? '<strong style="color: #4ade80;">FREE</strong>' : formatLKRCurrency(totals.shippingCost)}</span>
          </div>

          <!-- Sales VAT -->
          <div class="summary-line">
            <span class="summary-label">Estimated VAT (5% Standard)</span>
            <span class="summary-val">${formatLKRCurrency(totals.taxAmount)}</span>
          </div>

          <div class="summary-divider"></div>

          <!-- Grand Total -->
          <div class="summary-total-line">
            <div>
              <span class="summary-total-label">Grand Total</span>
              <span class="summary-tax-note">Includes all luxury duties &amp; delivery</span>
            </div>
            <span class="summary-total-val">${formatLKRCurrency(totals.grandTotal)}</span>
          </div>

          <!-- Accessibility Audio Narration -->
          <button 
            type="button" 
            class="btn-audio-breakdown" 
            onclick="narrateCartBreakdown()"
            aria-label="Listen to order breakdown"
            title="Read summary out loud with speech synthesizer"
          >
            <span aria-hidden="true">🔊</span> Read Order Summary
          </button>

          <!-- Return to bag link -->
          <div style="margin-top: 18px; text-align: center;">
            <a href="cart.html" class="btn-continue-shopping" style="font-size: var(--fs-xs);">
              <span aria-hidden="true">←</span> Return to Shopping Bag
            </a>
          </div>

          <!-- Trust Strip -->
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
        </div>
      </aside>
    </div>
  `;
}

/**
 * Handle radio change for payment method to show/hide card fields
 */
function handlePaymentMethodChange(method) {
  const cardBox = document.getElementById("simulatedCardInputs");
  if (cardBox) {
    cardBox.style.display = method === "card" ? "block" : "none";
  }
}

/**
 * Auto fill Sri Lankan demo data for fast testing
 */
function fillSriLankanDemoData() {
  const fields = {
    chkFullName: "Kavinda Perera",
    chkEmail: "kavinda.perera@gmail.com",
    chkPhone: "+94 77 123 4567",
    chkAddress: "No. 45/2, Galle Road, Bambalapitiya",
    chkCity: "Colombo",
    chkPostal: "00400",
    chkNotes: "Please call 077 123 4567 before delivery. Deliver during office hours."
  };

  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });

  showToastNotification("Auto-filled Sri Lankan test credentials!", "info");
}

/**
 * Update shipping method selection on dedicated checkout page
 */
function updateCheckoutShippingMethod(shippingId) {
  if (typeof selectShippingMethod === "function") {
    selectShippingMethod(shippingId);
    initCheckoutPage();
  }
}

/**
 * Apply promo code from checkout page
 */
function applyCheckoutPromo(code) {
  if (typeof applyPromoVoucher === "function") {
    applyPromoVoucher(code);
    initCheckoutPage();
  }
}

/**
 * Remove promo code from checkout page
 */
function removeCheckoutPromo() {
  if (typeof removePromoVoucher === "function") {
    removePromoVoucher(true);
    initCheckoutPage();
  }
}

/**
 * Process dedicated checkout form submission
 */
function processDedicatedCheckout(event) {
  event.preventDefault();
  const statusEl = document.getElementById("checkoutFormStatus");
  const submitBtn = document.getElementById("btnPlaceOrderMain");
  const submitText = document.getElementById("btnPlaceOrderText");

  const fullName = document.getElementById("chkFullName")?.value.trim();
  const email = document.getElementById("chkEmail")?.value.trim().toLowerCase();
  const phone = document.getElementById("chkPhone")?.value.trim();
  const address = document.getElementById("chkAddress")?.value.trim();
  const city = document.getElementById("chkCity")?.value.trim();
  const postal = document.getElementById("chkPostal")?.value.trim();
  const province = document.getElementById("chkProvince")?.value;
  const notes = document.getElementById("chkNotes")?.value.trim();
  const saveToProfile = document.getElementById("chkSaveProfile")?.checked;
  const paymentMethod = document.querySelector('input[name="checkoutPaymentMethod"]:checked')?.value || "card";

  // Basic validation
  if (!fullName || !email || !phone || !address || !city || !postal) {
    if (statusEl) {
      statusEl.textContent = "Please fill in all required shipping fields.";
      statusEl.classList.add("is-error");
    }
    showToastNotification("Please fill in all required delivery fields.", "error");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    if (statusEl) {
      statusEl.textContent = "Please enter a valid email address.";
      statusEl.classList.add("is-error");
    }
    showToastNotification("Please enter a valid email address.", "error");
    return;
  }

  const totals = typeof calculateCartTotals === "function" ? calculateCartTotals() : null;
  if (!totals || totals.items.length === 0) {
    showToastNotification("No items in bag to checkout.", "error");
    return;
  }

  // Stock check
  const unavailableItem = totals.items.find(item => {
    const product = typeof getProductDataById === "function" ? getProductDataById(item.product.id) : null;
    return !product || !Number.isInteger(product.stockCount) || product.stockCount < item.quantity;
  });

  if (unavailableItem) {
    showToastNotification(`${unavailableItem.product.name} no longer has sufficient stock. Please update your bag.`, "error");
    initCheckoutPage();
    return;
  }

  const paymentLabel = paymentMethod === "card"
    ? "Credit / Debit Card (Verified Demo)"
    : paymentMethod === "cod"
      ? "Cash on Delivery (Islandwide COD)"
      : paymentMethod === "koko"
        ? "Koko / Mintpay (3 Installments)"
        : "LankaQR / FriMi Bank Transfer";

  // Step in workflow: Mock Payment
  if (submitBtn) {
    submitBtn.disabled = true;
    if (submitText) submitText.textContent = "Authorizing Mock Payment…";
  }

  showMockPaymentGateway(totals.grandTotal, paymentLabel, () => {
    const orderToken = typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
    const orderId = `ZNV-${new Date().getFullYear()}-${orderToken.toUpperCase()}`;
    const orderDate = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    });

    const paymentStatus = paymentMethod === "cod"
      ? "Pay Cash upon Delivery"
      : paymentMethod === "card"
        ? "Mock Payment Authorized & Confirmed"
        : "Pending Payment Confirmation";

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
        province,
        paymentMethod: paymentLabel,
        paymentStatus,
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
      status: "Confirmed & In Preparation",
      trackingNumber: `PX-LK-${Math.floor(100000 + Math.random() * 900000)}`,
      estimatedDelivery: "2–3 Business Days (PromptX / Domex)"
    };

    // Deduct stock & save
    if (typeof deductInventoryStock === "function") {
      deductInventoryStock(totals.items.map(i => ({ id: i.product.id, quantity: i.quantity })));
    }

    if (typeof saveOrderToStorage === "function") {
      saveOrderToStorage(order);
    }

    // Save profile address if requested
    if (saveToProfile && typeof updateCurrentZenvyProfile === "function") {
      try {
        updateCurrentZenvyProfile({ fullName, phone, address, city, postal, province, notes });
      } catch (e) {
        console.warn("Could not save delivery profile:", e);
      }
    }

    // Clear cart & promo
    if (typeof saveCart === "function") {
      saveCart([]);
    }
    if (typeof removePromoVoucher === "function") {
      removePromoVoucher(false);
    }

    announceLive(`Mock payment authorized. Order ${order.orderId} confirmed. Total ${formatLKRCurrency(order.grandTotal)}.`);
    showToastNotification(`Mock Payment authorized! Order #${order.orderId} confirmed!`, "success");

    // Workflow Step: Order Confirmation
    setTimeout(() => {
      window.location.href = `order-confirmation.html?orderId=${encodeURIComponent(order.orderId)}`;
    }, 400);
  });
}

/**
 * Interactive Mock Payment Gateway Simulation Modal
 */
function showMockPaymentGateway(amount, paymentLabel, onComplete) {
  let modal = document.getElementById("mockPaymentGatewayModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "mockPaymentGatewayModal";
    modal.className = "checkout-modal-backdrop is-open";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="checkout-modal-dialog" style="max-width: 480px; text-align: center; padding: 36px 28px; box-shadow: var(--shadow-lg);">
      <div style="font-size: 3rem; margin-bottom: 12px;" aria-hidden="true">🔒</div>
      <span class="section-tag">Mock Payment Gateway</span>
      <h3 style="font-family: var(--font-serif); font-size: 1.5rem; color: #ffffff; margin: 8px 0 10px;">
        Authorizing Mock Transaction
      </h3>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 18px;">
        Processing simulated transaction for <strong style="color: var(--primary);">${formatLKRCurrency(amount)}</strong> via <strong>${escapeHTML(paymentLabel)}</strong>…
      </p>

      <div class="mock-gateway-amount-box" style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; margin-bottom: 20px;">
        <span style="font-size: 0.72rem; color: var(--text-muted); display: block; text-transform: uppercase;">Amount to Authorize</span>
        <strong style="font-size: 1.5rem; color: var(--primary); font-family: var(--font-serif);">${formatLKRCurrency(amount)}</strong>
      </div>

      <div id="mockGatewayStatusText" style="font-size: 0.82rem; color: var(--accent-sand); margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <span class="status-pulse-dot" aria-hidden="true"></span> Securing simulated transaction authorization…
      </div>

      <div class="progress-bar-track" style="margin-bottom: 16px;">
        <div id="mockGatewayBar" class="progress-bar-fill" style="width: 25%; transition: width 400ms ease;"></div>
      </div>
      <span style="font-size: 0.70rem; color: var(--text-muted);">256-Bit SSL Demo Sandbox • Simulated Authorization (No Real Charge)</span>
    </div>
  `;

  document.body.classList.add("modal-open");

  // Animate mock payment progress
  setTimeout(() => {
    const bar = document.getElementById("mockGatewayBar");
    const statusText = document.getElementById("mockGatewayStatusText");
    if (bar) bar.style.width = "75%";
    if (statusText) statusText.innerHTML = `<span class="status-pulse-dot" aria-hidden="true"></span> Verifying Sri Lankan banking simulation credentials…`;
  }, 450);

  setTimeout(() => {
    const bar = document.getElementById("mockGatewayBar");
    const statusText = document.getElementById("mockGatewayStatusText");
    if (bar) {
      bar.style.width = "100%";
      bar.style.background = "#4ade80";
    }
    if (statusText) statusText.innerHTML = `<span style="color: #4ade80; font-weight: 700;">✓ Mock Payment Authorized &amp; Confirmed!</span>`;
  }, 950);

  setTimeout(() => {
    modal.remove();
    document.body.classList.remove("modal-open");
    if (typeof onComplete === "function") onComplete();
  }, 1350);
}

/**
 * Render complete order confirmation & invoice receipt on checkout page
 */
function renderDedicatedOrderSuccess(order) {
  const container = document.getElementById("checkoutPageContent");
  if (!container) return;

  container.innerHTML = `
    <div class="checkout-success-view">
      <div class="order-success-card" style="box-shadow: var(--shadow-lg);">
        <div class="success-badge-animation" aria-hidden="true">✓</div>
        <span class="success-tag">Payment &amp; Reservation Confirmed</span>
        <h1 class="success-title">Thank You For Your Bespoke Order!</h1>
        <p class="success-subtitle">
          Your order <strong>#${escapeHTML(order.orderId)}</strong> has been registered and is being carefully packaged in signature Zenvy luxury presentation.
        </p>

        <div class="invoice-summary-box">
          <div class="invoice-meta-row">
            <div>
              <span class="meta-label">Order Number</span>
              <strong class="meta-val">${escapeHTML(order.orderId)}</strong>
            </div>
            <div>
              <span class="meta-label">Order Date</span>
              <strong class="meta-val">${escapeHTML(order.date)}</strong>
            </div>
            <div>
              <span class="meta-label">Payment Method</span>
              <strong class="meta-val">${escapeHTML(order.customer.paymentMethod)}</strong>
              <span class="meta-label" style="color: var(--primary); font-size: 0.72rem;">${escapeHTML(order.customer.paymentStatus)}</span>
            </div>
            <div>
              <span class="meta-label">Delivery Destination</span>
              <strong class="meta-val">${escapeHTML(order.customer.address)}, ${escapeHTML(order.customer.city)}</strong>
            </div>
          </div>

          <div class="invoice-items-table">
            <div class="invoice-head-row">
              <span>Item Description</span>
              <span>Qty</span>
              <span>Unit Price</span>
              <span style="text-align: right;">Total</span>
            </div>
            ${order.items.map(i => `
              <div class="invoice-item-row">
                <span class="inv-name">${escapeHTML(i.name)}</span>
                <span class="inv-qty">${escapeHTML(i.quantity)}</span>
                <span class="inv-price">${formatLKRCurrency(i.price)}</span>
                <span class="inv-total" style="text-align: right;">${formatLKRCurrency(i.lineTotal)}</span>
              </div>
            `).join("")}
          </div>

          <div class="invoice-totals-breakdown">
            <div class="inv-breakdown-row">
              <span>Subtotal:</span>
              <span>${formatLKRCurrency(order.subtotal)}</span>
            </div>
            ${order.discount > 0 ? `
              <div class="inv-breakdown-row discount">
                <span>Voucher Savings (${escapeHTML(order.promoCode)}):</span>
                <span>−${formatLKRCurrency(order.discount)}</span>
              </div>
            ` : ""}
            <div class="inv-breakdown-row">
              <span>Shipping (${escapeHTML(order.shippingOption)}):</span>
              <span>${order.shippingCost === 0 ? "FREE" : formatLKRCurrency(order.shippingCost)}</span>
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
        </div>

        <div class="order-success-actions" style="margin-top: 28px; justify-content: center; gap: 14px;">
          <button type="button" class="btn-print-invoice" onclick="window.print()">
            🖨 Print / Save Invoice PDF
          </button>
          <a href="profile.html" class="btn-checkout" style="max-width: 240px;">
            <span>View in My Profile</span>
            <span aria-hidden="true">→</span>
          </a>
          <a href="products.html" class="btn-secondary-demo" style="max-width: 240px;">
            <span>Continue Shopping</span>
          </a>
        </div>
      </div>
    </div>
  `;
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  initCheckoutPage();

  window.addEventListener("zenvy:account-change", () => {
    initCheckoutPage();
  });

  window.addEventListener("storage", event => {
    if (event.key === "zenvy_cart" || event.key?.startsWith("zenvy_cart:user:") || event.key === "zenvy_shipping") {
      initCheckoutPage();
    }
  });
});
