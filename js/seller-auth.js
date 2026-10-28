const SELLER_EMAIL = "zenvy@gmail.com";
const SELLER_PASSWORD = "zenvy123";
const SELLER_SESSION_KEY = "zenvy_seller_session_v1";
const SELLER_PAGES = new Set(["admin.html", "manage-products.html", "manage-orders.html"]);

const sellerAuthParams = new URLSearchParams(window.location.search);
const isSellerLoginMode = sellerAuthParams.get("role") === "seller";
window.isSellerLoginMode = isSellerLoginMode;
window.loginSellerAccount = loginSellerAccount;

function isSellerSignedIn() {
    try {
        const session = JSON.parse(localStorage.getItem(SELLER_SESSION_KEY) || "null");
        return session?.email === SELLER_EMAIL;
    } catch (error) {
        console.error("Could not read seller sign-in state:", error);
        return false;
    }
}

function getSellerRedirectTarget() {
    const redirect = sellerAuthParams.get("redirect");
    return SELLER_PAGES.has(redirect) ? redirect : "admin.html";
}

async function loginSellerAccount(form) {
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    if (email !== SELLER_EMAIL || password !== SELLER_PASSWORD) {
        setSellerFormStatus(form, "Seller email or password is incorrect.", true);
        return;
    }

    try {
        localStorage.setItem(SELLER_SESSION_KEY, JSON.stringify({
            email: SELLER_EMAIL,
            signedInAt: new Date().toISOString()
        }));
    } catch (error) {
        console.error("Could not save seller sign-in state:", error);
        setSellerFormStatus(form, "Could not save seller sign-in. Check browser storage and try again.", true);
        return;
    }

    form.reset();
    setSellerFormStatus(form, "Seller sign-in successful. Opening your dashboard…");
    window.setTimeout(() => {
        window.location.href = getSellerRedirectTarget();
    }, 350);
}

function setSellerFormStatus(form, message, isError = false) {
    const status = form.querySelector("[data-account-status]");
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", isError);
}

function configureSellerLogin() {
    if (!isSellerLoginMode) return;

    const title = document.getElementById("accountTitle");
    const tag = document.getElementById("loginSectionTag");
    const subtitle = document.getElementById("loginIntroSubtitle");
    const securityNote = document.querySelector(".account-security-note");
    const signInLink = document.querySelector("[data-seller-signin-link]");
    const profileLink = document.querySelector("[data-account-profile-link]");
    const accountSignOutButton = document.querySelector("[data-account-signout]");

    document.title = "Seller Sign In | Zenvy";
    if (title) title.textContent = "Seller sign in";
    if (tag) tag.textContent = "ZENVY SELLER STUDIO";
    if (subtitle) subtitle.textContent = "Sign in to manage your products, orders, and inventory.";
    if (securityNote) {
        securityNote.textContent =
            "Demo seller access only: credentials are checked in this browser and can be inspected. This is not secure for a live store.";
    }
    if (signInLink) signInLink.hidden = true;
    if (profileLink) profileLink.hidden = true;
    if (accountSignOutButton) accountSignOutButton.hidden = true;
    document.querySelectorAll("[data-customer-only]").forEach(element => {
        element.hidden = true;
    });

    const continueLink = document.querySelector('.account-nav a[href="products.html"]');
    if (continueLink) {
        continueLink.href = "index.html";
        continueLink.textContent = "Back to store";
    }

    if (isSellerSignedIn()) {
        window.location.replace(getSellerRedirectTarget());
    }
}

function addSellerSignOut() {
    if (!SELLER_PAGES.has(window.location.pathname.split("/").pop())) return;

    const storeLink = document.querySelector(".store-link");
    if (!storeLink || document.querySelector("[data-seller-signout]")) return;

    const signOutButton = document.createElement("button");
    signOutButton.type = "button";
    signOutButton.className = "seller-signout-link";
    signOutButton.dataset.sellerSignout = "";
    signOutButton.textContent = "Sign out";
    signOutButton.addEventListener("click", () => {
        try {
            localStorage.removeItem(SELLER_SESSION_KEY);
            window.location.replace("login.html?role=seller&redirect=admin.html");
        } catch (error) {
            console.error("Could not sign out seller:", error);
        }
    });
    storeLink.before(signOutButton);
}

const currentSellerPage = window.location.pathname.split("/").pop();
if (SELLER_PAGES.has(currentSellerPage) && !isSellerSignedIn()) {
    window.location.replace(`login.html?role=seller&redirect=${encodeURIComponent(currentSellerPage)}`);
} else {
    document.addEventListener("DOMContentLoaded", () => {
        configureSellerLogin();
        addSellerSignOut();
    });
}
