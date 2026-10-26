const ACCOUNT_STORAGE_KEY = "zenvy_accounts_v1";
const ACCOUNT_SESSION_KEY = "zenvy_account_session_v1";
const PASSWORD_HASH_ITERATIONS = 210000;
const PASSWORD_HASH_LENGTH = 256;
const PASSWORD_SALT_LENGTH = 16;

function getStoredAccounts() {
  const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
  if (!raw) return [];

  const accounts = JSON.parse(raw);
  if (!Array.isArray(accounts)) {
    throw new Error("Saved account data is invalid. Clear this site's account storage to continue.");
  }
  return accounts;
}

function getCurrentZenvyAccount() {
  try {
    const rawSession = localStorage.getItem(ACCOUNT_SESSION_KEY);
    if (!rawSession) return null;

    const session = JSON.parse(rawSession);
    const account = getStoredAccounts().find(savedAccount => savedAccount.email === session.email);
    return account
      ? { name: account.name, email: account.email, profile: account.profile || {} }
      : null;
  } catch (error) {
    console.error("Could not read the active account:", error);
    return null;
  }
}

function getZenvyStorageKey(baseKey) {
  const account = getCurrentZenvyAccount();
  return account ? `${baseKey}:user:${encodeURIComponent(account.email)}` : baseKey;
}

function updateCurrentZenvyProfile(profile) {
  const account = getCurrentZenvyAccount();
  if (!account) return false;

  const accounts = getStoredAccounts();
  const accountIndex = accounts.findIndex(savedAccount => savedAccount.email === account.email);
  if (accountIndex < 0) return false;

  accounts[accountIndex].profile = {
    ...accounts[accountIndex].profile,
    ...profile
  };
  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
  return true;
}

function migrateGuestCartToAccount(email) {
  const guestCartRaw = localStorage.getItem("zenvy_cart")
    || localStorage.getItem("cart")
    || localStorage.getItem("auramart_cart");
  if (!guestCartRaw) return;

  const guestCart = JSON.parse(guestCartRaw);
  if (!Array.isArray(guestCart) || guestCart.length === 0) return;

  const accountCartKey = `zenvy_cart:user:${encodeURIComponent(email)}`;
  const accountCartRaw = localStorage.getItem(accountCartKey);
  const accountCart = accountCartRaw ? JSON.parse(accountCartRaw) : [];
  if (!Array.isArray(accountCart)) {
    throw new Error("Saved cart data is invalid. Clear this site's cart storage to continue.");
  }

  const productsRaw = localStorage.getItem("zenvy_products");
  const products = productsRaw ? JSON.parse(productsRaw) : [];
  const stockById = new Map(
    Array.isArray(products) ? products.map(product => [product.id, product.stockCount]) : []
  );
  const mergedCart = new Map();

  [...accountCart, ...guestCart].forEach(item => {
    if (!item || typeof item.id !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1) return;
    const stock = stockById.get(item.id);
    const maxQuantity = Number.isInteger(stock) ? stock : 99;
    const mergedQuantity = (mergedCart.get(item.id) || 0) + item.quantity;
    mergedCart.set(item.id, Math.min(mergedQuantity, maxQuantity));
  });

  localStorage.setItem(
    accountCartKey,
    JSON.stringify([...mergedCart].map(([id, quantity]) => ({ id, quantity })))
  );
  localStorage.removeItem("zenvy_cart");
  localStorage.removeItem("cart");
  localStorage.removeItem("auramart_cart");
}

function updateAccountNavigation() {
  const account = getCurrentZenvyAccount();
  document.querySelectorAll("a.btn-account-trigger").forEach(link => {
    link.textContent = account ? `Hi, ${account.name.split(/\s+/)[0]}` : "Sign In";
    link.setAttribute("aria-label", account ? `Signed in as ${account.name}. Account details` : "Sign in to your account");
    link.href = account ? "profile.html" : "login.html";

    const container = link.parentElement;
    if (!container) return;
    let signOutButton = container.querySelector("[data-account-nav-signout]");
    if (account && !signOutButton) {
      signOutButton = document.createElement("button");
      signOutButton.type = "button";
      signOutButton.className = "btn-account-trigger account-nav-signout";
      signOutButton.dataset.accountNavSignout = "";
      signOutButton.textContent = "Sign Out";
      signOutButton.addEventListener("click", signOutZenvyAccount);
      link.after(signOutButton);
    } else if (!account && signOutButton) {
      signOutButton.remove();
    }
  });
}

function signOutZenvyAccount() {
  try {
    localStorage.removeItem(ACCOUNT_SESSION_KEY);
    updateAccountNavigation();
    if (typeof updateCartBadges === "function") updateCartBadges();
    if (typeof renderCartPage === "function" && document.getElementById("cartContentArea")) {
      renderCartPage();
    }
    if (document.querySelector('[data-account-form="login"]')) {
      setFormStatus(document.querySelector('[data-account-form="login"]'), "You have signed out on this browser.");
    }
  } catch (error) {
    console.error("Could not sign out:", error);
    const loginForm = document.querySelector('[data-account-form="login"]');
    if (loginForm) setFormStatus(loginForm, "Could not sign out. Check this site's browser storage settings.", true);
  }
}

function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

async function hashAccountPassword(password, salt) {
  if (!window.crypto?.subtle) {
    throw new Error("Secure password hashing is unavailable. Open this site on localhost or HTTPS and try again.");
  }

  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PASSWORD_HASH_ITERATIONS,
      hash: "SHA-256"
    },
    passwordKey,
    PASSWORD_HASH_LENGTH
  );
  return bytesToBase64(derivedBits);
}

function setFormStatus(form, message, isError = false) {
  const status = form.querySelector("[data-account-status]");
  if (status) {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  }
}

async function registerAccount(form) {
  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value;
  const confirmation = document.getElementById("confirmPassword").value;

  if (password !== confirmation) {
    setFormStatus(form, "Passwords do not match.", true);
    return;
  }

  const accounts = getStoredAccounts();
  if (accounts.some(account => account.email === email)) {
    setFormStatus(form, "An account with this email already exists. Please sign in instead.", true);
    return;
  }

  const salt = crypto.getRandomValues(new Uint8Array(PASSWORD_SALT_LENGTH));
  const passwordHash = await hashAccountPassword(password, salt);
  accounts.push({
    name,
    email,
    salt: bytesToBase64(salt),
    passwordHash,
    createdAt: new Date().toISOString()
  });

  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
  form.reset();
  const regParams = new URLSearchParams(window.location.search);
  const regRedirect = regParams.get("redirect");
  const loginUrl = regRedirect ? `login.html?redirect=${encodeURIComponent(regRedirect)}` : "login.html";
  setFormStatus(form, "Your account has been saved! Redirecting to sign in…");
  setTimeout(() => {
    window.location.href = loginUrl;
  }, 1000);
}

async function loginAccount(form) {
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const account = getStoredAccounts().find(savedAccount => savedAccount.email === email);

  if (!account) {
    setFormStatus(form, "Email or password is incorrect.", true);
    return;
  }

  const passwordHash = await hashAccountPassword(password, base64ToBytes(account.salt));
  if (passwordHash !== account.passwordHash) {
    setFormStatus(form, "Email or password is incorrect.", true);
    return;
  }

  localStorage.setItem(ACCOUNT_SESSION_KEY, JSON.stringify({
    email: account.email,
    name: account.name,
    signedInAt: new Date().toISOString()
  }));
  migrateGuestCartToAccount(account.email);
  updateAccountNavigation();
  window.dispatchEvent(new Event("zenvy:account-change"));
  const signOutButton = form.querySelector("[data-account-signout]");
  if (signOutButton) signOutButton.hidden = false;
  const profileLink = form.querySelector("[data-account-profile-link]");
  if (profileLink) profileLink.hidden = false;

  const urlParams = new URLSearchParams(window.location.search);
  const redirectTarget = urlParams.get("redirect") || "profile.html";
  const redirectLabel = redirectTarget.includes("checkout") ? "Checkout" : "your profile";

  form.reset();
  setFormStatus(form, `Welcome back, ${account.name}! Redirecting to ${redirectLabel}…`);
  setTimeout(() => {
    window.location.href = redirectTarget;
  }, 700);
}

document.addEventListener("DOMContentLoaded", () => {
  updateAccountNavigation();

  // Workflow support: if user redirected from cart checkout, show notice and preserve links
  const urlParams = new URLSearchParams(window.location.search);
  const redirect = urlParams.get("redirect");
  if (redirect && redirect.includes("checkout")) {
    const notice = document.getElementById("checkoutRedirectNotice");
    if (notice) notice.style.display = "flex";

    document.querySelectorAll('a[href="register.html"], a[href^="register.html?"]').forEach(a => {
      a.href = "register.html?redirect=checkout.html";
    });
    document.querySelectorAll('a[href="login.html"], a[href^="login.html?"]').forEach(a => {
      a.href = "login.html?redirect=checkout.html";
    });
  }
  document.querySelectorAll("[data-password-toggle]").forEach(button => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      if (!(input instanceof HTMLInputElement)) return;

      const showPassword = input.type === "password";
      input.type = showPassword ? "text" : "password";
      button.textContent = showPassword ? "Hide" : "Show";
      button.setAttribute("aria-label", `${showPassword ? "Hide" : "Show"} password`);
      button.setAttribute("aria-pressed", showPassword ? "true" : "false");
    });
  });

  const registrationForm = document.querySelector('[data-account-form="register"]');
  if (registrationForm instanceof HTMLFormElement) {
    const password = registrationForm.querySelector("#registerPassword");
    const confirmation = registrationForm.querySelector("#confirmPassword");

    const validatePasswordConfirmation = () => {
      if (password instanceof HTMLInputElement && confirmation instanceof HTMLInputElement) {
        confirmation.setCustomValidity(
          confirmation.value && confirmation.value !== password.value
            ? "Passwords do not match."
            : ""
        );
      }
    };

    password?.addEventListener("input", validatePasswordConfirmation);
    confirmation?.addEventListener("input", validatePasswordConfirmation);
    registrationForm.addEventListener("submit", validatePasswordConfirmation);
  }

  document.querySelectorAll("[data-account-form]").forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();
      setFormStatus(form, form.dataset.accountForm === "register" ? "Saving your account…" : "Checking your account…");
      const operation = form.dataset.accountForm === "register"
        ? registerAccount(form)
        : loginAccount(form);
      operation.catch(error => {
        console.error("Account form error:", error);
        setFormStatus(
          form,
          error instanceof DOMException && error.name === "QuotaExceededError"
            ? "Browser storage is full. Free some space and try again."
            : error.message || "Could not access browser storage. Check your browser settings and try again.",
          true
        );
      });
    });
  });

  const loginForm = document.querySelector('[data-account-form="login"]');
  const signOutButton = document.querySelector("[data-account-signout]");
  if (loginForm instanceof HTMLFormElement && signOutButton instanceof HTMLButtonElement) {
    try {
      const rawSession = localStorage.getItem(ACCOUNT_SESSION_KEY);
      if (rawSession) {
        const session = JSON.parse(rawSession);
        const account = getStoredAccounts().find(savedAccount => savedAccount.email === session.email);
        if (account) {
          signOutButton.hidden = false;
          const profileLink = loginForm.querySelector("[data-account-profile-link]");
          if (profileLink) profileLink.hidden = false;
          setFormStatus(loginForm, `You are signed in as ${account.name} on this browser.`);
        } else {
          localStorage.removeItem(ACCOUNT_SESSION_KEY);
        }
      }
    } catch (error) {
      console.error("Could not restore account session:", error);
      setFormStatus(loginForm, "Could not read saved account data. Check this site's browser storage.", true);
    }

    signOutButton.addEventListener("click", () => {
      try {
        localStorage.removeItem(ACCOUNT_SESSION_KEY);
        signOutButton.hidden = true;
        const profileLink = loginForm.querySelector("[data-account-profile-link]");
        if (profileLink) profileLink.hidden = true;
        setFormStatus(loginForm, "You have signed out on this browser.");
      } catch (error) {
        console.error("Could not clear account session:", error);
        setFormStatus(loginForm, "Could not sign out. Check this site's browser storage settings.", true);
      }
    });
  }

  window.addEventListener("storage", event => {
    if (event.key === ACCOUNT_STORAGE_KEY || event.key === ACCOUNT_SESSION_KEY) {
      updateAccountNavigation();
      if (typeof updateCartBadges === "function") updateCartBadges();
      if (typeof renderCartPage === "function" && document.getElementById("cartContentArea")) {
        renderCartPage();
      }
    }
  });
});

window.getCurrentZenvyAccount = getCurrentZenvyAccount;
window.getZenvyStorageKey = getZenvyStorageKey;
window.updateCurrentZenvyProfile = updateCurrentZenvyProfile;
