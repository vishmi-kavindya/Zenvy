/**
 * AuraMart - Search & Filter Engine
 * HCI Assignment - Member 01
 * 
 * Manages:
 * 1. Global navigation search input with live auto-suggestions dropdown
 * 2. Category filtering (all, electronics, clothing, food)
 * 3. Sorting by popularity, price (low-to-high, high-to-low), and rating
 * 4. URL query parameter synchronization (?category=... &search=...)
 * 5. Screen reader accessible announcements
 */

// Search state
let currentSearchTerm = "";
let currentCategory = "all";
let currentSort = "popularity";

/**
 * Filter and sort products according to current state
 * @returns {Array} Filtered and sorted product array
 */
function getFilteredAndSortedProducts() {
  let list = getAllProducts();

  // 1. Category Filter
  if (currentCategory && currentCategory !== "all") {
    list = list.filter(p => p.category.toLowerCase() === currentCategory.toLowerCase());
  }

  // 2. Search Term Filter
  if (currentSearchTerm.trim()) {
    const term = currentSearchTerm.toLowerCase().trim();
    list = list.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.categoryName.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.specs.some(s => s.toLowerCase().includes(term))
    );
  }

  // 3. Sort Filter
  list = sortProductsList(list, currentSort);

  return list;
}

/**
 * Render products grid on products.html
 */
function renderProductsGrid() {
  const grid = document.getElementById("productsGrid");
  const countEl = document.getElementById("resultCount");
  const activeFiltersContainer = document.getElementById("activeFiltersRow");
  if (!grid) return;

  const filtered = getFilteredAndSortedProducts();

  // Update counter
  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${getAllProducts().length} products`;
  }

  // Announce to screen reader
  if (typeof announceLiveMessage === "function") {
    announceLiveMessage(`Found ${filtered.length} products matching your criteria.`);
  }

  // Render active filter tags
  if (activeFiltersContainer) {
    let chips = "";
    if (currentCategory !== "all") {
      chips += `
        <span class="filter-chip">
          Category: <strong>${currentCategory.toUpperCase()}</strong>
          <button type="button" onclick="setCategoryFilter('all')" aria-label="Remove category filter">✕</button>
        </span>
      `;
    }
    if (currentSearchTerm.trim()) {
      chips += `
        <span class="filter-chip">
          Search: <strong>"${escapeHtml(currentSearchTerm)}"</strong>
          <button type="button" onclick="clearSearchFilter()" aria-label="Remove search filter">✕</button>
        </span>
      `;
    }
    if (chips) {
      chips += `<button type="button" class="btn-clear-all" onclick="resetAllFilters()">Reset All Filters</button>`;
      activeFiltersContainer.innerHTML = chips;
      activeFiltersContainer.style.display = "flex";
    } else {
      activeFiltersContainer.innerHTML = "";
      activeFiltersContainer.style.display = "none";
    }
  }

  // Render Empty State or Products
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-results-box" role="status">
        <div class="no-results-icon" aria-hidden="true">🔍</div>
        <h3>No matching products found</h3>
        <p>We couldn't find any items matching "<strong>${escapeHtml(currentSearchTerm)}</strong>" in the selected category.</p>
        <button type="button" class="btn-primary-glow" onclick="resetAllFilters()">Clear All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(product => createProductCardHTML(product)).join("");
}

/**
 * Change the active category filter
 * @param {string} category 
 */
function setCategoryFilter(category) {
  currentCategory = category;

  // Update active pill button state
  const pills = document.querySelectorAll(".category-pill-btn");
  pills.forEach(pill => {
    const pillCat = pill.getAttribute("data-category");
    if (pillCat === category) {
      pill.classList.add("active");
      pill.setAttribute("aria-pressed", "true");
    } else {
      pill.classList.remove("active");
      pill.setAttribute("aria-pressed", "false");
    }
  });

  renderProductsGrid();
}

/**
 * Clear the current search filter
 */
function clearSearchFilter() {
  currentSearchTerm = "";
  const inputs = document.querySelectorAll(".product-search-input");
  inputs.forEach(input => input.value = "");
  renderProductsGrid();
}

/**
 * Reset both category and search filters
 */
function resetAllFilters() {
  currentSearchTerm = "";
  currentCategory = "all";
  currentSort = "popularity";

  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) sortSelect.value = "popularity";

  const inputs = document.querySelectorAll(".product-search-input");
  inputs.forEach(input => input.value = "");

  setCategoryFilter("all");
}

/* ==========================================================================
   LIVE AUTO-SUGGESTIONS DROPDOWN (NAVBAR SEARCH)
   ========================================================================== */

function setupSearchInputs() {
  const searchWrappers = document.querySelectorAll(".nav-search-wrap");

  searchWrappers.forEach(wrap => {
    const input = wrap.querySelector(".product-search-input");
    const dropdown = wrap.querySelector(".search-suggestions-dropdown");
    const clearBtn = wrap.querySelector(".search-clear-btn");
    if (!input || !dropdown) return;

    let selectedSuggestionIndex = -1;

    // Input handler
    input.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      if (clearBtn) {
        clearBtn.style.display = val.length > 0 ? "block" : "none";
      }

      // If we are on products.html, update grid real-time
      if (document.getElementById("productsGrid")) {
        currentSearchTerm = val;
        renderProductsGrid();
      }

      // Render suggestions dropdown
      if (val.length >= 1) {
        showSuggestions(val, dropdown, input);
      } else {
        dropdown.classList.remove("is-visible");
        dropdown.innerHTML = "";
      }
    });

    // Clear button handler
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        input.value = "";
        clearBtn.style.display = "none";
        dropdown.classList.remove("is-visible");
        input.focus();
        if (document.getElementById("productsGrid")) {
          currentSearchTerm = "";
          renderProductsGrid();
        }
      });
    }

    // Keyboard navigation within suggestions
    input.addEventListener("keydown", (e) => {
      const items = dropdown.querySelectorAll(".suggestion-item");
      if (!dropdown.classList.contains("is-visible") || items.length === 0) {
        if (e.key === "Enter") {
          e.preventDefault();
          executeSearchSubmission(input.value.trim());
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedSuggestionIndex = (selectedSuggestionIndex + 1) % items.length;
        updateSelectedSuggestion(items, selectedSuggestionIndex);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedSuggestionIndex = (selectedSuggestionIndex - 1 + items.length) % items.length;
        updateSelectedSuggestion(items, selectedSuggestionIndex);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && items[selectedSuggestionIndex]) {
          items[selectedSuggestionIndex].click();
        } else {
          executeSearchSubmission(input.value.trim());
        }
      } else if (e.key === "Escape") {
        dropdown.classList.remove("is-visible");
      }
    });

    // Close suggestions on outside click
    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) {
        dropdown.classList.remove("is-visible");
      }
    });
  });
}

function updateSelectedSuggestion(items, index) {
  items.forEach((item, idx) => {
    if (idx === index) {
      item.classList.add("is-selected");
      item.setAttribute("aria-selected", "true");
      item.scrollIntoView({ block: "nearest" });
    } else {
      item.classList.remove("is-selected");
      item.setAttribute("aria-selected", "false");
    }
  });
}

function showSuggestions(term, dropdown, input) {
  const matches = getAllProducts().filter(p => 
    p.name.toLowerCase().includes(term.toLowerCase()) ||
    p.categoryName.toLowerCase().includes(term.toLowerCase()) ||
    p.description.toLowerCase().includes(term.toLowerCase())
  ).slice(0, 5);

  if (matches.length === 0) {
    dropdown.innerHTML = `
      <div class="suggestion-no-match">
        No matches for "<strong>${escapeHtml(term)}</strong>"
      </div>
    `;
    dropdown.classList.add("is-visible");
    return;
  }

  let html = `<div class="suggestions-header">Matching Products (${matches.length})</div>`;
  matches.forEach(product => {
    html += `
      <div 
        class="suggestion-item" 
        role="option" 
        tabindex="0" 
        onclick="selectSuggestionProduct('${product.id}')"
      >
        <img src="${product.image}" alt="" class="suggestion-thumb" onerror="this.src='https://placehold.co/40x40?text=Aura'" />
        <div class="suggestion-details">
          <div class="suggestion-title">${highlightMatch(product.name, term)}</div>
          <div class="suggestion-meta">
            <span class="suggestion-cat">${product.categoryName}</span>
            <span class="suggestion-price">$${product.price.toFixed(2)}</span>
            <span class="suggestion-rating">★ ${product.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    `;
  });

  html += `
    <div class="suggestions-footer" onclick="executeSearchSubmission('${escapeHtml(term)}')">
      <span>View all results for "<strong>${escapeHtml(term)}</strong>" &rarr;</span>
    </div>
  `;

  dropdown.innerHTML = html;
  dropdown.classList.add("is-visible");
}

function selectSuggestionProduct(productId) {
  // If we are on products.html, open modal or highlight
  if (typeof openProductModal === "function") {
    openProductModal(productId);
  } else {
    // Navigate to products.html with product details modal trigger
    window.location.href = `products.html?highlight=${productId}`;
  }

  const dropdowns = document.querySelectorAll(".search-suggestions-dropdown");
  dropdowns.forEach(d => d.classList.remove("is-visible"));
}

function executeSearchSubmission(term) {
  if (!term) return;
  // If not on products page, navigate to it
  if (!document.getElementById("productsGrid")) {
    window.location.href = `products.html?search=${encodeURIComponent(term)}`;
  } else {
    currentSearchTerm = term;
    renderProductsGrid();
    const dropdowns = document.querySelectorAll(".search-suggestions-dropdown");
    dropdowns.forEach(d => d.classList.remove("is-visible"));
  }
}

function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
  return text.replace(regex, `<mark class="search-highlight">$1</mark>`);
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

/* ==========================================================================
   INITIALIZATION & URL PARAMS READING
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  setupSearchInputs();

  // Read URL parameters on page load
  const urlParams = new URLSearchParams(window.location.search);
  const paramCat = urlParams.get("category");
  const paramSearch = urlParams.get("search");
  const paramHighlight = urlParams.get("highlight");

  if (paramCat) {
    currentCategory = paramCat.toLowerCase();
  }

  if (paramSearch) {
    currentSearchTerm = paramSearch;
    const inputs = document.querySelectorAll(".product-search-input");
    inputs.forEach(input => input.value = paramSearch);
  }

  // Setup sorting dropdown listener
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderProductsGrid();
    });
  }

  // Category pill button click handlers
  const categoryPills = document.querySelectorAll(".category-pill-btn");
  categoryPills.forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = btn.getAttribute("data-category");
      setCategoryFilter(cat);
    });
  });

  // If on products page, perform initial render
  if (document.getElementById("productsGrid")) {
    setCategoryFilter(currentCategory);

    // If highlighted product was passed in URL, open its modal
    if (paramHighlight) {
      setTimeout(() => {
        if (typeof openProductModal === "function") {
          openProductModal(paramHighlight);
        }
      }, 350);
    }
  }
});
