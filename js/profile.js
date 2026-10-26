/**
 * Zenvy Luxury E-Commerce - Customer Profile Management Engine
 * Member 02 Feature: 8. Customer profile page
 *
 * Handles:
 * - Customer authentication state verification
 * - Personal contact info & Sri Lankan delivery address updates
 * - PBKDF2 Password updates & account security
 * - Scoped order history rendering with re-order capability
 * - Invoice receipt viewing and printing
 * - Accessibility announcements & audio narration
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
 * Initialize and render the customer profile page
 */
function initProfilePage() {
  const account = typeof getCurrentZenvyAccount === "function" ? getCurrentZenvyAccount() : null;
  const container = document.getElementById("profileContentArea");
  if (!container) return;

  if (!account) {
    renderSignedOutState(container);
    return;
  }

  renderSignedInProfile(container, account);
}

/**
 * Render prompt when user is not signed in
 */
function renderSignedOutState(container) {
  container.innerHTML = `
    <div class="profile-guest-card">
      <div class="guest-card-icon" aria-hidden="true">👤</div>
      <span class="section-tag">Zenvy Member Portal</span>
      <h1 class="guest-title">Please Sign In to Access Your Profile</h1>
      <p class="guest-subtitle">
        Sign in to your Zenvy account to manage your bespoke profile, saved Sri Lankan delivery addresses, track recent orders, and re-order your favorite luxury essentials.
      </p>
      <div class="guest-actions">
        <a href="login.html" class="btn-checkout" style="max-width: 260px;">
          <span>Sign In to Zenvy</span>
          <span aria-hidden="true">→</span>
        </a>
        <a href="register.html" class="btn-secondary-demo" style="max-width: 260px;">
          <span>Create an Account</span>
        </a>
      </div>
      <div style="margin-top: 32px; border-top: 1px solid var(--border-subtle); padding-top: 20px;">
        <a href="products.html" class="btn-continue-shopping">
          <span aria-hidden="true">←</span> Continue Exploring Collection
        </a>
      </div>
    </div>
  `;
}

/**
 * Render full customer profile for authenticated user
 */
function renderSignedInProfile(container, account) {
  const profile = account.profile || {};
  const orders = typeof getStoredOrders === "function" ? getStoredOrders() : [];
  const cartQty = typeof getCartTotalQuantity === "function" ? getCartTotalQuantity() : 0;

  // Extract initials for luxury monogram
  const names = (account.name || "Customer").trim().split(/\s+/);
  const initials = names.length > 1
    ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
    : (names[0].slice(0, 2)).toUpperCase();

  const registeredDateStr = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "2026";

  container.innerHTML = `
    <!-- Top Hero Card -->
    <div class="profile-hero-card">
      <div class="profile-hero-left">
        <div class="profile-monogram" aria-hidden="true">${escapeHTML(initials)}</div>
        <div class="profile-identity">
          <div class="profile-badge-row">
            <span class="profile-tier-badge">✦ Verified Zenvy Member</span>
            <span class="profile-member-date">Member since ${escapeHTML(registeredDateStr)}</span>
          </div>
          <h1 class="profile-display-name">${escapeHTML(account.name)}</h1>
          <p class="profile-display-email">${escapeHTML(account.email)}</p>
        </div>
      </div>

      <div class="profile-hero-actions">
        <button type="button" class="btn-profile-audio" onclick="narrateProfileSummary()" title="Listen to profile overview">
          <span aria-hidden="true">🔊</span> Read Profile
        </button>
        <button type="button" class="btn-header-ghost" onclick="handleProfileSignOut()" title="Sign out on this browser">
          <span>🚪</span> Sign Out
        </button>
      </div>
    </div>

    <!-- Quick Metrics Strip -->
    <div class="profile-metrics-grid">
      <div class="metric-card">
        <span class="metric-icon" aria-hidden="true">📦</span>
        <div class="metric-content">
          <strong class="metric-value">${orders.length}</strong>
          <span class="metric-label">Completed Orders</span>
        </div>
      </div>

      <div class="metric-card">
        <span class="metric-icon" aria-hidden="true">🛍️</span>
        <div class="metric-content">
          <strong class="metric-value">${cartQty}</strong>
          <span class="metric-label">Items in Shopping Bag</span>
        </div>
        ${cartQty > 0 ? `<a href="cart.html" class="metric-link">View Bag →</a>` : ""}
      </div>

      <div class="metric-card">
        <span class="metric-icon" aria-hidden="true">📍</span>
        <div class="metric-content">
          <strong class="metric-value">${escapeHTML(profile.city || "Colombo")}</strong>
          <span class="metric-label">Default Shipping Destination</span>
        </div>
      </div>

      <div class="metric-card">
        <span class="metric-icon" aria-hidden="true">🛡️</span>
        <div class="metric-content">
          <strong class="metric-value">Active</strong>
          <span class="metric-label">Account Security Status</span>
        </div>
      </div>
    </div>

    <!-- 2-Column Main Workspace -->
    <div class="profile-workspace-grid">
      <!-- Left Column: Personal Info & Default Delivery Address Forms -->
      <div class="profile-left-col">
        <!-- Section 1: Personal Details Form -->
        <section class="profile-box" aria-labelledby="personalInfoTitle">
          <div class="profile-box-header">
            <div>
              <span class="section-tag">Identity</span>
              <h2 id="personalInfoTitle" class="profile-box-title">Personal Details</h2>
            </div>
          </div>

          <form id="profilePersonalForm" onsubmit="handlePersonalDetailsSubmit(event)" class="profile-form">
            <div class="form-group">
              <label for="profFullName" class="form-label">Full Name *</label>
              <input type="text" id="profFullName" class="form-input" required value="${escapeHTML(profile.fullName || account.name || '')}" />
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label for="profEmail" class="form-label">Email Address (Read-only)</label>
                <input type="email" id="profEmail" class="form-input is-readonly" readonly value="${escapeHTML(account.email || '')}" title="Email is linked to this account login" />
                <span class="account-field-hint">Used for order invoices and login authentication.</span>
              </div>
              <div class="form-group">
                <label for="profPhone" class="form-label">Contact Phone (Sri Lanka)</label>
                <input type="tel" id="profPhone" class="form-input" placeholder="+94 77 123 4567" value="${escapeHTML(profile.phone || '')}" />
              </div>
            </div>

            <button type="submit" class="btn-checkout" style="max-width: 240px; margin-top: 10px;">
              <span>Save Personal Info</span>
            </button>
            <p id="personalFormStatus" class="account-form-status" role="status" aria-live="polite"></p>
          </form>
        </section>

        <!-- Section 2: Default Sri Lankan Delivery Address -->
        <section class="profile-box" aria-labelledby="deliveryAddressTitle">
          <div class="profile-box-header">
            <div>
              <span class="section-tag">Logistics</span>
              <h2 id="deliveryAddressTitle" class="profile-box-title">Default Sri Lankan Delivery Address</h2>
            </div>
          </div>

          <form id="profileAddressForm" onsubmit="handleDeliveryAddressSubmit(event)" class="profile-form">
            <div class="form-group">
              <label for="profAddress" class="form-label">Street Address *</label>
              <input type="text" id="profAddress" class="form-input" required placeholder="e.g. No. 45/2, Galle Road, Bambalapitiya" value="${escapeHTML(profile.address || '')}" />
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label for="profCity" class="form-label">City / Town *</label>
                <input type="text" id="profCity" class="form-input" required placeholder="e.g. Colombo, Kandy, Galle" value="${escapeHTML(profile.city || '')}" />
              </div>
              <div class="form-group">
                <label for="profPostal" class="form-label">Postal Code *</label>
                <input type="text" id="profPostal" class="form-input" required placeholder="e.g. 00400" value="${escapeHTML(profile.postal || '')}" />
              </div>
            </div>

            <div class="form-group">
              <label for="profProvince" class="form-label">Province / District</label>
              <select id="profProvince" class="form-input">
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

            <div class="form-group">
              <label for="profNotes" class="form-label">Delivery Notes / Landmark Instructions</label>
              <input type="text" id="profNotes" class="form-input" placeholder="e.g. Deliver during daytime, leave with apartment reception" value="${escapeHTML(profile.notes || '')}" />
            </div>

            <button type="submit" class="btn-checkout" style="max-width: 240px; margin-top: 10px;">
              <span>Save Delivery Address</span>
            </button>
            <p id="addressFormStatus" class="account-form-status" role="status" aria-live="polite"></p>
          </form>
        </section>

        <!-- Section 3: Password & Security -->
        <section class="profile-box" aria-labelledby="securityTitle">
          <div class="profile-box-header">
            <div>
              <span class="section-tag">Security</span>
              <h2 id="securityTitle" class="profile-box-title">Change Password</h2>
            </div>
          </div>

          <form id="profilePasswordForm" onsubmit="handlePasswordChangeSubmit(event)" class="profile-form">
            <div class="form-group">
              <label for="profCurrentPass" class="form-label">Current Password *</label>
              <div class="account-password-wrap">
                <input type="password" id="profCurrentPass" class="form-input" required />
                <button class="password-visibility-btn" type="button" data-password-toggle="profCurrentPass" aria-label="Show current password">Show</button>
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label for="profNewPass" class="form-label">New Password (Min. 8 characters) *</label>
                <div class="account-password-wrap">
                  <input type="password" id="profNewPass" class="form-input" minlength="8" required />
                  <button class="password-visibility-btn" type="button" data-password-toggle="profNewPass" aria-label="Show new password">Show</button>
                </div>
              </div>
              <div class="form-group">
                <label for="profConfirmPass" class="form-label">Confirm New Password *</label>
                <div class="account-password-wrap">
                  <input type="password" id="profConfirmPass" class="form-input" minlength="8" required />
                  <button class="password-visibility-btn" type="button" data-password-toggle="profConfirmPass" aria-label="Show confirmation password">Show</button>
                </div>
              </div>
            </div>

            <button type="submit" class="btn-secondary-demo" style="max-width: 240px; margin-top: 10px;">
              <span>Update Password</span>
            </button>
            <p id="passwordFormStatus" class="account-form-status" role="status" aria-live="polite"></p>
          </form>
        </section>
      </div>

      <!-- Right Column: Customer's Orders History -->
      <div class="profile-right-col">
        <section class="profile-box" aria-labelledby="myOrdersTitle">
          <div class="profile-box-header">
            <div>
              <span class="section-tag">Purchases</span>
              <h2 id="myOrdersTitle" class="profile-box-title">My Order History (${orders.length})</h2>
            </div>
            ${orders.length > 0 ? `
              <a href="cart.html" class="btn-continue-shopping" style="font-size: var(--fs-xs);">
                Go to Bag (${cartQty}) →
              </a>
            ` : ""}
          </div>

          <div class="profile-orders-container">
            ${orders.length === 0 ? renderProfileEmptyOrdersHTML() : renderProfileOrdersListHTML(orders)}
          </div>
        </section>
      </div>
    </div>
  `;

  // Attach password toggle listeners
  container.querySelectorAll("[data-password-toggle]").forEach(button => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      if (!(input instanceof HTMLInputElement)) return;
      const isPass = input.type === "password";
      input.type = isPass ? "text" : "password";
      button.textContent = isPass ? "Hide" : "Show";
      button.setAttribute("aria-label", `${isPass ? "Hide" : "Show"} password`);
    });
  });
}

/**
 * Render empty orders state in profile
 */
function renderProfileEmptyOrdersHTML() {
  return `
    <div class="profile-empty-orders">
      <span class="empty-orders-icon" aria-hidden="true">📦</span>
      <h3 style="font-family: var(--font-serif); font-size: var(--fs-lg); margin-bottom: 8px; color: #ffffff;">No Orders Found</h3>
      <p style="color: var(--text-muted); font-size: var(--fs-sm); max-width: 380px; margin: 0 auto 20px;">
        You haven't placed any luxury orders from this account yet. Discover our curated collection of digital essentials.
      </p>
      <a href="products.html" class="btn-primary-luxury" style="display: inline-flex;">
        Explore Collection
      </a>
    </div>
  `;
}

/**
 * Render list of customer's orders in profile
 */
function renderProfileOrdersListHTML(orders) {
  return `
    <div class="profile-orders-list">
      ${orders.map(order => `
        <article class="profile-order-card" id="orderCard-${escapeHTML(order.orderId)}">
          <div class="profile-order-head">
            <div>
              <strong class="order-id-tag">#${escapeHTML(order.orderId)}</strong>
              <span class="order-date-text">${escapeHTML(order.date)}</span>
            </div>
            <span class="past-order-status-badge">● ${escapeHTML(order.status || 'Confirmed')}</span>
          </div>

          <div class="profile-order-meta">
            <div>
              <span class="meta-label">Payment</span>
              <strong class="meta-val">${escapeHTML(order.customer?.paymentMethod || 'Credit/Debit Card')}</strong>
            </div>
            <div>
              <span class="meta-label">Delivery Destination</span>
              <strong class="meta-val">${escapeHTML(order.customer?.city || 'Colombo')}, Sri Lanka</strong>
            </div>
            <div>
              <span class="meta-label">Total Amount</span>
              <strong class="meta-val gold-amount">${formatLKRCurrency(order.grandTotal)}</strong>
            </div>
          </div>

          <!-- Items pills -->
          <div class="profile-order-items">
            ${(order.items || []).map(item => `
              <div class="profile-item-pill">
                <span class="pill-qty">${escapeHTML(item.quantity)}×</span>
                <span class="pill-name">${escapeHTML(item.name)}</span>
                <span class="pill-price">${formatLKRCurrency(item.lineTotal)}</span>
              </div>
            `).join("")}
          </div>

          <!-- Footer Actions -->
          <div class="profile-order-footer">
            <button type="button" class="btn-invoice-view" onclick="viewProfileInvoice('${escapeHTML(order.orderId)}')">
              📄 View Invoice
            </button>
            <button type="button" class="btn-reorder" onclick="reorderProfileOrder('${escapeHTML(order.orderId)}')">
              🔁 Re-order Items
            </button>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

/**
 * Handle Personal Details Form Submit
 */
function handlePersonalDetailsSubmit(event) {
  event.preventDefault();
  const statusEl = document.getElementById("personalFormStatus");
  const fullName = document.getElementById("profFullName")?.value.trim();
  const phone = document.getElementById("profPhone")?.value.trim();

  if (!fullName) {
    if (statusEl) {
      statusEl.textContent = "Please enter your full name.";
      statusEl.classList.add("is-error");
    }
    return;
  }

  if (typeof updateCurrentZenvyProfile === "function") {
    const success = updateCurrentZenvyProfile({ fullName, phone });
    if (success) {
      // Also update account.name in session
      try {
        const rawSession = localStorage.getItem("zenvy_account_session_v1");
        if (rawSession) {
          const session = JSON.parse(rawSession);
          session.name = fullName;
          localStorage.setItem("zenvy_account_session_v1", JSON.stringify(session));
        }
      } catch (e) {
        console.warn(e);
      }

      showToastNotification("Personal details successfully updated!", "success");
      announceLive("Personal details updated successfully.");
      if (statusEl) {
        statusEl.textContent = "✓ Personal details saved successfully.";
        statusEl.classList.remove("is-error");
      }
      if (typeof updateAccountNavigation === "function") {
        updateAccountNavigation();
      }
    } else {
      if (statusEl) {
        statusEl.textContent = "Failed to update profile. Please try again.";
        statusEl.classList.add("is-error");
      }
    }
  }
}

/**
 * Handle Delivery Address Form Submit
 */
function handleDeliveryAddressSubmit(event) {
  event.preventDefault();
  const statusEl = document.getElementById("addressFormStatus");
  const address = document.getElementById("profAddress")?.value.trim();
  const city = document.getElementById("profCity")?.value.trim();
  const postal = document.getElementById("profPostal")?.value.trim();
  const province = document.getElementById("profProvince")?.value;
  const notes = document.getElementById("profNotes")?.value.trim();

  if (!address || !city || !postal) {
    if (statusEl) {
      statusEl.textContent = "Please fill in all required address fields.";
      statusEl.classList.add("is-error");
    }
    return;
  }

  if (typeof updateCurrentZenvyProfile === "function") {
    const success = updateCurrentZenvyProfile({ address, city, postal, province, notes });
    if (success) {
      showToastNotification("Default delivery address saved!", "success");
      announceLive("Default delivery address saved.");
      if (statusEl) {
        statusEl.textContent = "✓ Delivery address saved successfully. Will auto-fill during checkout.";
        statusEl.classList.remove("is-error");
      }
    } else {
      if (statusEl) {
        statusEl.textContent = "Failed to save address. Storage full or account unavailable.";
        statusEl.classList.add("is-error");
      }
    }
  }
}

/**
 * Handle Password Change Submit
 */
async function handlePasswordChangeSubmit(event) {
  event.preventDefault();
  const statusEl = document.getElementById("passwordFormStatus");
  const currentPass = document.getElementById("profCurrentPass")?.value;
  const newPass = document.getElementById("profNewPass")?.value;
  const confirmPass = document.getElementById("profConfirmPass")?.value;

  if (newPass !== confirmPass) {
    if (statusEl) {
      statusEl.textContent = "New passwords do not match.";
      statusEl.classList.add("is-error");
    }
    return;
  }

  if (newPass.length < 8) {
    if (statusEl) {
      statusEl.textContent = "Password must be at least 8 characters.";
      statusEl.classList.add("is-error");
    }
    return;
  }

  try {
    const account = getCurrentZenvyAccount();
    if (!account) return;

    const accounts = getStoredAccounts();
    const targetAcc = accounts.find(a => a.email === account.email);
    if (!targetAcc) {
      throw new Error("Account not found in storage.");
    }

    if (statusEl) {
      statusEl.textContent = "Verifying current password…";
      statusEl.classList.remove("is-error");
    }

    // Verify current password
    const currentHash = await hashAccountPassword(currentPass, base64ToBytes(targetAcc.salt));
    if (currentHash !== targetAcc.passwordHash) {
      if (statusEl) {
        statusEl.textContent = "Incorrect current password.";
        statusEl.classList.add("is-error");
      }
      return;
    }

    // Hash new password with a fresh salt
    const newSalt = crypto.getRandomValues(new Uint8Array(PASSWORD_SALT_LENGTH));
    const newHash = await hashAccountPassword(newPass, newSalt);

    targetAcc.salt = bytesToBase64(newSalt);
    targetAcc.passwordHash = newHash;
    targetAcc.updatedAt = new Date().toISOString();

    localStorage.setItem("zenvy_accounts_v1", JSON.stringify(accounts));

    document.getElementById("profilePasswordForm")?.reset();
    showToastNotification("Password successfully updated!", "success");
    announceLive("Password successfully updated.");
    if (statusEl) {
      statusEl.textContent = "✓ Password successfully updated and securely hashed.";
      statusEl.classList.remove("is-error");
    }
  } catch (error) {
    console.error("Password change error:", error);
    if (statusEl) {
      statusEl.textContent = error.message || "Failed to update password.";
      statusEl.classList.add("is-error");
    }
  }
}

/**
 * Re-order items from an order into the active bag
 */
function reorderProfileOrder(orderId) {
  if (typeof reorderItems === "function") {
    reorderItems(orderId);
  } else {
    const orders = typeof getStoredOrders === "function" ? getStoredOrders() : [];
    const order = orders.find(o => o.orderId === orderId);
    if (!order || !Array.isArray(order.items)) {
      showToastNotification("Order details could not be found.", "error");
      return;
    }
    order.items.forEach(i => {
      if (typeof addToCart === "function") {
        addToCart(i.id, i.quantity);
      }
    });
    showToastNotification(`Re-added items from #${orderId} to your bag!`, "success");
    window.location.href = "cart.html";
  }
}

/**
 * View / Print Invoice for a given order in profile
 */
function viewProfileInvoice(orderId) {
  const orders = typeof getStoredOrders === "function" ? getStoredOrders() : [];
  const order = orders.find(o => o.orderId === orderId);
  if (!order) {
    showToastNotification("Order not found.", "error");
    return;
  }

  if (typeof showOrderSuccessModal === "function") {
    showOrderSuccessModal(order);
  } else {
    // Show fallback invoice alert
    window.print();
  }
}

/**
 * Handle user sign out from profile page
 */
function handleProfileSignOut() {
  if (typeof signOutZenvyAccount === "function") {
    signOutZenvyAccount();
    showToastNotification("You have signed out.", "info");
    initProfilePage();
  }
}

/**
 * Speak profile auditory breakdown
 */
function narrateProfileSummary() {
  const account = getCurrentZenvyAccount();
  if (!account) {
    if (typeof narrateText === "function") {
      narrateText("You are not signed in. Please sign in to access your customer profile.");
    }
    return;
  }

  const orders = typeof getStoredOrders === "function" ? getStoredOrders() : [];
  const text = `Customer Profile for ${account.name}. Email address: ${account.email}. You have placed ${orders.length} orders with Zenvy. Your default delivery city is ${account.profile?.city || "Colombo"}. Use Tab to navigate through your personal details, delivery address, and order history.`;

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
  initProfilePage();

  window.addEventListener("zenvy:account-change", () => {
    initProfilePage();
  });

  window.addEventListener("storage", event => {
    if (event.key === "zenvy_accounts_v1" || event.key === "zenvy_account_session_v1") {
      initProfilePage();
    }
  });
});
