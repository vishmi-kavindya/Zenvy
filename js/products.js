/**
 * AuraMart - Products & Store Catalog Data (VÉLORA Luxury Theme)
 * HCI Assignment - Member 01
 * 
 * Contains exactly 10 products across exactly 3 categories:
 * - electronics (4 items)
 * - clothing (3 items)
 * - food (3 items)
 * 
 * Styled for high-end warm luxury aesthetic with offline SVG vector fallbacks
 * and browser localStorage persistence.
 */

const PRODUCTS_DATA = [
  {
    id: "prod-1",
    name: "Aura Luxe ANC Wireless Headphones",
    category: "electronics",
    categoryName: "Electronics",
    price: 149.99,
    originalPrice: 199.99,
    rating: 4.8,
    reviewsCount: 142,
    popularity: 98,
    inStock: true,
    stockCount: 15,
    badge: "Bestseller",
    badgeType: "hot",
    image: "images/headphone.jpeg",
    svgIcon: "headphones",
    description: "Premium acoustic noise-cancelling over-ear wireless headphones finished with brushed champagne metal, 40-hour battery life, and plush memory foam earcups.",
    specs: [
      "Hybrid Active Noise Cancellation (ANC)",
      "40-hour battery life with fast Type-C charging",
      "Bluetooth 5.3 + lossless 3.5mm gold-plated jack",
      "Multipoint pairing for laptop and mobile switching",
      "Ergonomic tactile physical control buttons"
    ]
  },
  {
    id: "prod-2",
    name: "Minimalist Chrono Smart Watch",
    category: "electronics",
    categoryName: "Electronics",
    price: 89.50,
    originalPrice: 119.00,
    rating: 4.6,
    reviewsCount: 96,
    popularity: 92,
    inStock: true,
    stockCount: 8,
    badge: "Popular",
    badgeType: "popular",
    image: "images/watch.jpeg",
    svgIcon: "watch",
    description: "Clean Scandinavian-inspired black and gold smart fitness timepiece with high-contrast AMOLED display, heart-rate tracking, and 14-day battery reserve.",
    specs: [
      "1.43-inch high-contrast AMOLED crystal display",
      "14-day battery life on a single magnetic charge",
      "24/7 Heart rate, SpO2 blood oxygen, and sleep monitoring",
      "5 ATM water resistance (swimming and shower safe)",
      "Universal vibration haptic alerts for notifications"
    ]
  },
  {
    id: "prod-3",
    name: "Lumina 360 Acoustic Studio Speaker",
    category: "electronics",
    categoryName: "Electronics",
    price: 59.00,
    originalPrice: 79.99,
    rating: 4.5,
    reviewsCount: 78,
    popularity: 85,
    inStock: true,
    stockCount: 12,
    badge: "Sale",
    badgeType: "sale",
    image: "images/speaker.jpeg",
    svgIcon: "speaker",
    description: "Architectural 360-degree wireless surround speaker featuring dual passive bass radiators, acoustic fabric grille, and ambient warm ring illumination.",
    specs: [
      "360-degree omnidirectional room-filling audio",
      "24W peak dynamic output with deep bass resonance",
      "IP67 splashproof & outdoor weather resistant",
      "16-hour continuous playtime with powerbank function",
      "Tactile embossed top controls for accessibility"
    ]
  },
  {
    id: "prod-4",
    name: "VisionView 4K Ultra HD Action Camera",
    category: "electronics",
    categoryName: "Electronics",
    price: 119.00,
    originalPrice: 149.00,
    rating: 4.7,
    reviewsCount: 64,
    popularity: 88,
    inStock: true,
    stockCount: 5,
    badge: "New Season",
    badgeType: "new",
    image: "images/camera.jpeg",
    svgIcon: "camera",
    description: "Ultra-compact 4K at 60fps action camera with dual preview touchscreens, 6-axis hardware stabilization, and 30-meter waterproof adventure housing.",
    specs: [
      "Cinema-grade 4K at 60 FPS video & 20MP HDR stills",
      "Dual screens: 2.0-inch rear touch + 1.4-inch front screen",
      "SmoothFlow 6-axis hardware gyro stabilization",
      "Waterproof to 30 meters with included shell",
      "High-contrast UI with audible capture beeps"
    ]
  },
  {
    id: "prod-5",
    name: "Classic Beige Linen Casual Shirt",
    category: "clothing",
    categoryName: "Clothing",
    price: 38.00,
    originalPrice: 49.00,
    rating: 4.6,
    reviewsCount: 118,
    popularity: 89,
    inStock: true,
    stockCount: 25,
    badge: "Organic",
    badgeType: "eco",
    image: "images/shirt.jpeg",
    svgIcon: "shirt",
    description: "Breathable 100% natural organic flax linen shirt with relaxed tailored cut, mother-of-pearl buttons, and sensory-friendly tagless collar.",
    specs: [
      "100% Pure Certified Natural Linen",
      "Tag-free printed label for zero skin friction",
      "Breathable, lightweight texture ideal for warm climates",
      "Pre-washed for signature softness that improves over time",
      "Ethically tailored with reinforced seams"
    ]
  },
  {
    id: "prod-6",
    name: "AeroFlex All-Weather Minimalist Jacket",
    category: "clothing",
    categoryName: "Clothing",
    price: 74.99,
    originalPrice: 99.00,
    rating: 4.9,
    reviewsCount: 154,
    popularity: 96,
    inStock: true,
    stockCount: 9,
    badge: "Top Rated",
    badgeType: "hot",
    image: "images/jacket.jpeg",
    svgIcon: "jacket",
    description: "Streamlined water-repellent performance shell jacket featuring subtle reflective safety accents, stowaway hood, and ergonomic zip pulls.",
    specs: [
      "Advanced DWR (Durable Water Repellent) breathable shell",
      "High-visibility reflective safety accents on cuffs and spine",
      "Packable design folds into interior chest pocket",
      "Adjustable bungee storm hood and hem cords",
      "Fleece-lined magnetic closure side pockets"
    ]
  },
  {
    id: "prod-7",
    name: "DenimCraft Tailored Stretch Jeans",
    category: "clothing",
    categoryName: "Clothing",
    price: 49.50,
    originalPrice: 65.00,
    rating: 4.3,
    reviewsCount: 82,
    popularity: 81,
    inStock: true,
    stockCount: 14,
    badge: "Popular",
    badgeType: "popular",
    image: "images/denim.jpeg",
    svgIcon: "jeans",
    description: "Contemporary slim-tapered denim crafted with 4-way stretch flex weave for all-day mobility, comfort waistband, and rich artisan rinse.",
    specs: [
      "98% Sustainable Cotton, 2% High-Recovery Elastane",
      "4-way flex stretch prevents bagging at knees",
      "Reinforced copper rivets and smooth glide brass zip",
      "Deep ergonomic pockets designed to secure smartphones",
      "Artisan wash with fade-resistant dye lock"
    ]
  },
  {
    id: "prod-8",
    name: "NatureGold Raw Wildflower Honey 500g",
    category: "food",
    categoryName: "Food",
    price: 14.99,
    originalPrice: 19.99,
    rating: 4.9,
    reviewsCount: 220,
    popularity: 99,
    inStock: true,
    stockCount: 30,
    badge: "100% Raw",
    badgeType: "eco",
    image: "images/honey.jpeg",
    svgIcon: "honey",
    description: "100% unpasteurized raw mountain wildflower honey harvested ethically from remote alpine meadows. Packed with natural enzymes, propolis, and delicate nectar notes.",
    specs: [
      "100% Pure, Unfiltered & Cold-Extracted Honey",
      "Single-source mountain beekeeping with zero additives",
      "Naturally rich in bio-active enzymes & bee pollen",
      "Recyclable amber glass jar with easy-twist embossed lid",
      "Certified Gluten-Free, Non-GMO & Kosher"
    ]
  },
  {
    id: "prod-9",
    name: "ArtisanReserve Espresso Whole Beans 1kg",
    category: "food",
    categoryName: "Food",
    price: 19.50,
    originalPrice: 25.00,
    rating: 4.8,
    reviewsCount: 185,
    popularity: 94,
    inStock: true,
    stockCount: 18,
    badge: "Fair Trade",
    badgeType: "hot",
    image: "images/coffee.jpeg",
    svgIcon: "coffee",
    description: "Slow-roasted specialty Arabica beans featuring an opulent profile of dark Swiss cocoa, roasted hazelnut, and golden caramel with velvety crema.",
    specs: [
      "100% High-Elevation Specialty Grade Arabica Beans",
      "Fair Trade & Rainforest Alliance Certified",
      "Micro-drum roasted in small batches for peak aromatic freshness",
      "Airtight bag with one-way degassing freshness valve",
      "Tasting notes: Dark chocolate, hazelnut, and cane sugar"
    ]
  },
  {
    id: "prod-10",
    name: "NutriCrunch Royal Roasted Nut Mix 750g",
    category: "food",
    categoryName: "Food",
    price: 16.25,
    originalPrice: 21.50,
    rating: 4.7,
    reviewsCount: 104,
    popularity: 87,
    inStock: true,
    stockCount: 22,
    badge: "Superfood",
    badgeType: "popular",
    image: "images/nuts.jpeg",
    svgIcon: "nuts",
    description: "Dry-roasted artisan blend of whole California almonds, jumbo cashews, golden walnuts, and pecans, gently dusted with pink Himalayan salt. Zero added oils.",
    specs: [
      "Slow dry-roasted with absolutely zero added oils",
      "Gourmet mix: Almonds, cashews, walnuts, and pecans",
      "Lightly kissed with mineral-rich Himalayan pink salt",
      "6g plant protein and healthy Omega-3 fats per serving",
      "Resealable freshness zipper pouch"
    ]
  }
];

// Fallback SVG icons
const PRODUCT_SVG_ICONS = {
  headphones: `<svg viewBox="0 0 100 100" class="prod-svg-art" aria-hidden="true">
    <circle cx="50" cy="50" r="45" fill="rgba(197, 155, 109, 0.12)" stroke="#c59b6d" stroke-width="2"/>
    <path d="M 28 56 A 22 22 0 0 1 72 56" fill="none" stroke="#c59b6d" stroke-width="4.5" stroke-linecap="round"/>
    <rect x="22" y="52" width="12" height="24" rx="6" fill="#1c1a17" stroke="#c59b6d" stroke-width="2"/>
    <rect x="66" y="52" width="12" height="24" rx="6" fill="#1c1a17" stroke="#c59b6d" stroke-width="2"/>
    <circle cx="50" cy="30" r="3" fill="#c59b6d"/>
  </svg>`,
  watch: `<svg viewBox="0 0 100 100" class="prod-svg-art" aria-hidden="true">
    <circle cx="50" cy="50" r="45" fill="rgba(197, 155, 109, 0.12)" stroke="#c59b6d" stroke-width="2"/>
    <rect x="43" y="16" width="14" height="68" rx="4" fill="#2d2925"/>
    <rect x="33" y="32" width="34" height="36" rx="8" fill="#141210" stroke="#c59b6d" stroke-width="2.5"/>
    <circle cx="50" cy="50" r="11" fill="none" stroke="#c59b6d" stroke-width="1.8" stroke-dasharray="4,2"/>
    <line x1="50" y1="50" x2="50" y2="44" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="56" y2="50" stroke="#c59b6d" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  speaker: `<svg viewBox="0 0 100 100" class="prod-svg-art" aria-hidden="true">
    <circle cx="50" cy="50" r="45" fill="rgba(197, 155, 109, 0.12)" stroke="#c59b6d" stroke-width="2"/>
    <rect x="35" y="24" width="30" height="52" rx="10" fill="#1c1a17" stroke="#c59b6d" stroke-width="2.5"/>
    <circle cx="50" cy="40" r="8" fill="#282521" stroke="#c59b6d" stroke-width="1.5"/>
    <circle cx="50" cy="62" r="10" fill="#282521" stroke="#c59b6d" stroke-width="1.5"/>
    <circle cx="50" cy="20" r="2.5" fill="#c59b6d"/>
  </svg>`,
  camera: `<svg viewBox="0 0 100 100" class="prod-svg-art" aria-hidden="true">
    <circle cx="50" cy="50" r="45" fill="rgba(197, 155, 109, 0.12)" stroke="#c59b6d" stroke-width="2"/>
    <rect x="25" y="32" width="50" height="36" rx="6" fill="#1c1a17" stroke="#c59b6d" stroke-width="2.5"/>
    <circle cx="50" cy="50" r="13" fill="#141210" stroke="#c59b6d" stroke-width="2.5"/>
    <circle cx="50" cy="50" r="6" fill="#c59b6d"/>
    <rect x="63" y="36" width="7" height="6" rx="2" fill="#eab308"/>
  </svg>`,
  shirt: `<svg viewBox="0 0 100 100" class="prod-svg-art" aria-hidden="true">
    <circle cx="50" cy="50" r="45" fill="rgba(197, 155, 109, 0.12)" stroke="#c59b6d" stroke-width="2"/>
    <path d="M 34 26 L 44 32 C 48 35 52 35 56 32 L 66 26 L 78 38 L 68 44 L 68 76 L 32 76 L 32 44 L 22 38 Z" fill="#2a2622" stroke="#c59b6d" stroke-width="2" stroke-linejoin="round"/>
  </svg>`,
  jacket: `<svg viewBox="0 0 100 100" class="prod-svg-art" aria-hidden="true">
    <circle cx="50" cy="50" r="45" fill="rgba(197, 155, 109, 0.12)" stroke="#c59b6d" stroke-width="2"/>
    <path d="M 34 24 L 50 30 L 66 24 L 78 36 L 70 44 L 68 76 L 32 76 L 30 44 L 22 36 Z" fill="#221e1a" stroke="#c59b6d" stroke-width="2" stroke-linejoin="round"/>
    <line x1="50" y1="30" x2="50" y2="76" stroke="#c59b6d" stroke-width="1.8" stroke-dasharray="3,2"/>
  </svg>`,
  jeans: `<svg viewBox="0 0 100 100" class="prod-svg-art" aria-hidden="true">
    <circle cx="50" cy="50" r="45" fill="rgba(197, 155, 109, 0.12)" stroke="#c59b6d" stroke-width="2"/>
    <path d="M 32 26 L 68 26 L 66 76 L 53 76 L 50 46 L 47 76 L 34 76 Z" fill="#1e222d" stroke="#c59b6d" stroke-width="2" stroke-linejoin="round"/>
    <line x1="32" y1="34" x2="68" y2="34" stroke="#c59b6d" stroke-width="1.5"/>
  </svg>`,
  honey: `<svg viewBox="0 0 100 100" class="prod-svg-art" aria-hidden="true">
    <circle cx="50" cy="50" r="45" fill="rgba(197, 155, 109, 0.12)" stroke="#c59b6d" stroke-width="2"/>
    <rect x="36" y="22" width="28" height="8" rx="2" fill="#c59b6d"/>
    <path d="M 33 30 Q 30 50 34 74 L 66 74 Q 70 50 67 30 Z" fill="#423525" stroke="#c59b6d" stroke-width="2"/>
    <circle cx="50" cy="52" r="10" fill="#c59b6d" opacity="0.3"/>
    <text x="50" y="55" font-size="8" font-weight="bold" fill="#faedcd" text-anchor="middle">PURE</text>
  </svg>`,
  coffee: `<svg viewBox="0 0 100 100" class="prod-svg-art" aria-hidden="true">
    <circle cx="50" cy="50" r="45" fill="rgba(197, 155, 109, 0.12)" stroke="#c59b6d" stroke-width="2"/>
    <path d="M 33 24 L 67 24 L 63 76 L 37 76 Z" fill="#2d2218" stroke="#c59b6d" stroke-width="2"/>
    <ellipse cx="50" cy="50" rx="9" ry="12" fill="#1b140e" stroke="#c59b6d" stroke-width="1.5"/>
    <path d="M 50 39 Q 54 50 50 61" stroke="#c59b6d" stroke-width="1.5" fill="none"/>
  </svg>`,
  nuts: `<svg viewBox="0 0 100 100" class="prod-svg-art" aria-hidden="true">
    <circle cx="50" cy="50" r="45" fill="rgba(197, 155, 109, 0.12)" stroke="#c59b6d" stroke-width="2"/>
    <path d="M 30 28 L 70 28 L 65 74 L 35 74 Z" fill="#252119" stroke="#c59b6d" stroke-width="2"/>
    <ellipse cx="45" cy="52" rx="7" ry="10" transform="rotate(-15 45 52)" fill="#c59b6d" opacity="0.8"/>
    <ellipse cx="56" cy="54" rx="8" ry="7" transform="rotate(20 56 54)" fill="#faedcd" opacity="0.8"/>
  </svg>`
};

/* ==========================================================================
   MEMBER DIVISION NOTE:
   Shopping Cart, Checkout & Customer Accounts are the sole responsibility of
   Member 02. Member 01 focuses on Catalog, Browsing, and Universal Accessibility.
   ========================================================================== */

/* ==========================================================================
   CATALOG QUERIES
   ========================================================================== */

function getAllProducts() {
  return [...PRODUCTS_DATA];
}

function getProductById(id) {
  return PRODUCTS_DATA.find(p => p.id === id);
}

function getProductsByCategory(category) {
  if (!category || category === "all") return getAllProducts();
  return PRODUCTS_DATA.filter(p => p.category.toLowerCase() === category.toLowerCase());
}

function sortProductsList(products, sortBy) {
  const cloned = [...products];
  switch (sortBy) {
    case "price-low":
      return cloned.sort((a, b) => a.price - b.price);
    case "price-high":
      return cloned.sort((a, b) => b.price - a.price);
    case "rating-high":
      return cloned.sort((a, b) => b.rating - a.rating);
    case "popularity":
    default:
      return cloned.sort((a, b) => b.popularity - a.popularity);
  }
}

/* ==========================================================================
   UI RENDERING: PRODUCT CARDS
   ========================================================================== */

function renderStarRating(rating) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  let starsHtml = "";

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      starsHtml += `<span class="star star-full" aria-hidden="true">★</span>`;
    } else if (i === fullStars + 1 && hasHalf) {
      starsHtml += `<span class="star star-half" aria-hidden="true">★</span>`;
    } else {
      starsHtml += `<span class="star star-empty" aria-hidden="true">☆</span>`;
    }
  }

  return starsHtml;
}

function createProductCardHTML(product) {
  const svgFallback = PRODUCT_SVG_ICONS[product.svgIcon] || "";

  return `
    <article class="product-card" id="card-${product.id}" data-id="${product.id}" data-category="${product.category}">
      <div class="product-card-badge-wrap">
        <span class="product-badge badge-${product.badgeType}">${product.badge}</span>
        <span class="product-category-pill">${product.categoryName}</span>
      </div>

      <div class="product-image-container" onclick="openProductModal('${product.id}')" role="button" tabindex="0" aria-label="View details for ${product.name}">
        <img 
          src="${product.image}" 
          alt="${product.name}" 
          class="product-image"
          loading="lazy"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />
        <div class="product-svg-fallback" style="display: none;">
          ${svgFallback}
        </div>
        <div class="image-overlay">
          <span class="quick-view-text"><i class="icon-eye" aria-hidden="true">👁</i> Quick Details</span>
        </div>
      </div>

      <div class="product-card-body">
        <div class="product-rating-row" aria-label="Rating: ${product.rating} out of 5 stars from ${product.reviewsCount} reviews">
          <div class="stars-wrap">${renderStarRating(product.rating)}</div>
          <span class="rating-number"><strong>${product.rating.toFixed(1)}</strong> <span class="reviews-count">(${product.reviewsCount})</span></span>
        </div>

        <h3 class="product-title">
          <a href="javascript:void(0)" onclick="openProductModal('${product.id}')" title="${product.name}">${product.name}</a>
        </h3>

        <p class="product-snippet">${product.description.substring(0, 80)}...</p>

        <div class="product-price-row">
          <div class="price-wrap">
            <span class="current-price">$${product.price.toFixed(2)}</span>
            ${product.originalPrice ? `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` : ""}
          </div>
          <span class="stock-status ${product.stockCount <= 5 ? 'stock-low' : 'stock-ok'}">
            ${product.stockCount <= 5 ? `Only ${product.stockCount} left!` : 'In Stock'}
          </span>
        </div>

        <div class="product-card-actions">
          <button 
            type="button" 
            class="btn-audio-listen" 
            onclick="narrateProduct('${product.id}')" 
            title="Read product information"
            aria-label="Listen to audio description of ${product.name}"
          >
            <span class="audio-icon" aria-hidden="true">🔊</span>
            <span class="btn-text">Listen</span>
          </button>

          <button 
            type="button" 
            class="btn-quick-view" 
            onclick="openProductModal('${product.id}')"
            aria-label="View full details for ${product.name}"
          >
            <span aria-hidden="true">👁</span> Details
          </button>

          <button 
            type="button" 
            class="btn-add-cart" 
            onclick="if(typeof addToCart==='function'){ addToCart('${product.id}', 1, event); }"
            aria-label="Add ${product.name} to shopping bag"
            title="Add to Shopping Bag"
          >
            <span aria-hidden="true">🛒</span> Add
          </button>
        </div>
      </div>
    </article>
  `;
}

/* ==========================================================================
   PRODUCT DETAILS MODAL
   ========================================================================== */

let activeModalProductId = null;

function openProductModal(productId) {
  const product = getProductById(productId);
  if (!product) return;

  activeModalProductId = productId;
  const modal = document.getElementById("productModal");
  const modalContent = document.getElementById("modalProductContent");
  if (!modal || !modalContent) return;

  const svgFallback = PRODUCT_SVG_ICONS[product.svgIcon] || "";
  const specsList = product.specs.map(spec => `<li><span class="spec-check" aria-hidden="true">✓</span> ${spec}</li>`).join("");

  modalContent.innerHTML = `
    <div class="modal-product-grid">
      <div class="modal-image-col">
        <div class="modal-image-wrap">
          <img 
            src="${product.image}" 
            alt="${product.name}" 
            class="modal-product-img"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          />
          <div class="modal-svg-fallback" style="display:none;">
            ${svgFallback}
          </div>
          <span class="product-badge badge-${product.badgeType} modal-badge">${product.badge}</span>
        </div>
      </div>

      <div class="modal-info-col">
        <div class="modal-category-tag">${product.categoryName.toUpperCase()}</div>
        <h2 id="modalTitle" class="modal-title">${product.name}</h2>

        <div class="modal-rating-row" aria-label="Rated ${product.rating} stars out of 5 based on ${product.reviewsCount} customer reviews">
          <div class="stars-wrap">${renderStarRating(product.rating)}</div>
          <span class="modal-rating-val"><strong>${product.rating.toFixed(1)}</strong></span>
          <span class="modal-reviews-count">(${product.reviewsCount} verified reviews)</span>
        </div>

        <div class="modal-price-box">
          <span class="modal-current-price">$${product.price.toFixed(2)}</span>
          ${product.originalPrice ? `<span class="modal-original-price">$${product.originalPrice.toFixed(2)}</span>` : ""}
          <span class="modal-discount-tag">Save ${(100 - (product.price / product.originalPrice * 100)).toFixed(0)}%</span>
        </div>

        <p class="modal-description">${product.description}</p>

        <div class="modal-specs-section">
          <h4 class="specs-title">Key Specifications & Usability Highlights:</h4>
          <ul class="specs-list">${specsList}</ul>
        </div>

        <div class="modal-stock-row">
          <span class="stock-indicator ${product.stockCount <= 5 ? 'warning' : 'ok'}">
            ● ${product.inStock ? `In Stock (${product.stockCount} units available)` : 'Out of Stock'}
          </span>
          <span class="sku-text">Product Code: AUR-${product.id.toUpperCase()}</span>
        </div>

        <div class="modal-cart-action-row" style="display:flex; gap:12px; align-items:center; margin-bottom:14px; width:100%;">
          <div class="quantity-selector" role="group" aria-label="Select quantity">
            <button type="button" class="btn-qty" onclick="if(typeof adjustModalQty==='function') adjustModalQty(-1)" aria-label="Decrease quantity">−</button>
            <input type="number" id="modalQuantityInput" value="1" min="1" max="${product.stockCount}" aria-label="Quantity" readonly />
            <button type="button" class="btn-qty" onclick="if(typeof adjustModalQty==='function') adjustModalQty(1)" aria-label="Increase quantity">+</button>
          </div>
          <button 
            type="button" 
            class="btn-modal-add-cart" 
            onclick="if(typeof addModalItemToCart==='function'){ addModalItemToCart('${product.id}'); } else if(typeof addToCart==='function'){ addToCart('${product.id}', 1); closeModal(); }"
            aria-label="Add ${product.name} to shopping bag"
          >
            <span>🛒</span> Add to Bag
          </button>
        </div>

        <div class="modal-actions-box">
          <button 
            type="button" 
            class="btn-modal-audio" 
            onclick="narrateProduct('${product.id}')"
            aria-label="Listen to audio description of this product"
          >
            🔊 Audio Narration
          </button>

          <button 
            type="button" 
            class="btn-modal-close-action" 
            onclick="closeModal()"
            aria-label="Close details view"
          >
            ✕ Close Details
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const closeBtn = document.getElementById("closeModalBtn");
  if (closeBtn) closeBtn.focus();
}

function closeModal() {
  const modal = document.getElementById("productModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (activeModalProductId) {
    const card = document.getElementById(`card-${activeModalProductId}`);
    if (card) {
      const btn = card.querySelector(".btn-quick-view") || card;
      btn.focus();
    }
  }
}

// Member 02 will provide cart and quantity management scripts.



/* ==========================================================================
   TOAST NOTIFICATIONS
   ========================================================================== */

function showToast(message, type = "info") {
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.className = "toast-container";
    toastContainer.setAttribute("aria-live", "polite");
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `toast-message toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}</span>
    <span class="toast-text">${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-fade-out");
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });

  const modal = document.getElementById("productModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }
});
