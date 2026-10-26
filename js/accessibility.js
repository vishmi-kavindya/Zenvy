/**
 * AuraMart - Accessibility & Universal Design Engine
 * HCI Assignment - Member 01
 * 
 * Implements:
 * 1. Font Size Scaling: A (Normal 100%), A+ (Large 115%), A++ (Extra Large 130%)
 * 2. High Contrast Mode (WCAG AAA compliant: yellow/cyan on pitch black with visible borders)
 * 3. Text-to-Speech Audio Narration using Web Speech API (with Play, Pause, Stop, Rate)
 * 4. Screen Reader Live Region announcements (aria-live)
 * 5. Keyboard navigation enhancement & skip link helpers
 * 6. localStorage persistence for all user accessibility preferences
 */

// Storage keys
const FONT_STORAGE_KEY = "auramart_font_size";
const CONTRAST_STORAGE_KEY = "auramart_high_contrast";
const SPEECH_RATE_KEY = "auramart_speech_rate";

// Speech Synthesis State
let synth = window.speechSynthesis || null;
let currentUtterance = null;
let isSpeaking = false;
let isPaused = false;
let activeNarratedElementId = null;
let speechRate = 1.0;

/* ==========================================================================
   1. FONT SIZE CONTROLS (A, A+, A++)
   ========================================================================== */

/**
 * Set font size level and persist in localStorage
 * @param {'normal'|'large'|'xlarge'} size 
 */
function setFontSize(size) {
  const root = document.documentElement;

  // Remove existing font size classes
  root.classList.remove("font-size-normal", "font-size-large", "font-size-xlarge");

  // Apply new class
  root.classList.add(`font-size-${size}`);

  // Persist
  try {
    localStorage.setItem(FONT_STORAGE_KEY, size);
  } catch (e) {
    console.warn("Storage error", e);
  }

  // Update button active states and ARIA attributes
  const buttons = document.querySelectorAll(".font-size-btn");
  buttons.forEach(btn => {
    const btnSize = btn.getAttribute("data-size");
    const isCurrent = btnSize === size;
    btn.classList.toggle("active", isCurrent);
    btn.setAttribute("aria-pressed", isCurrent ? "true" : "false");
  });

  const sizeLabels = {
    normal: "Normal font size (100%)",
    large: "Large font size (115%)",
    xlarge: "Extra Large font size (130%)"
  };

  announceLiveMessage(`Font size adjusted to ${sizeLabels[size] || size}`);
  showToast(`Font Size: ${size.toUpperCase()}`, "info");
}

/* ==========================================================================
   2. HIGH CONTRAST MODE
   ========================================================================== */

/**
 * Toggle high contrast mode on and off
 */
function toggleHighContrast() {
  const root = document.documentElement;
  const isHighContrast = root.classList.toggle("high-contrast");

  try {
    localStorage.setItem(CONTRAST_STORAGE_KEY, isHighContrast ? "true" : "false");
  } catch (e) {
    console.warn("Storage error", e);
  }

  updateContrastUI(isHighContrast);

  const statusText = isHighContrast ? "High Contrast Mode enabled" : "Standard visual theme restored";
  announceLiveMessage(statusText);
  showToast(statusText, "info");
}

/**
 * Synchronize UI buttons and attributes for High Contrast
 * @param {boolean} isHighContrast 
 */
function updateContrastUI(isHighContrast) {
  const contrastButtons = document.querySelectorAll(".btn-contrast-toggle");
  contrastButtons.forEach(btn => {
    btn.setAttribute("aria-pressed", isHighContrast ? "true" : "false");
    const label = btn.querySelector(".contrast-btn-label");
    const icon = btn.querySelector(".contrast-btn-icon");
    if (label) {
      label.textContent = isHighContrast ? "Contrast: High (ON)" : "High Contrast";
    }
    if (icon) {
      icon.textContent = isHighContrast ? "☀️" : "◐";
    }
    btn.classList.toggle("is-active", isHighContrast);
  });
}

/* ==========================================================================
   3. AUDIO NARRATION (TEXT-TO-SPEECH)
   ========================================================================== */

/**
 * Narrate text using Web Speech API
 * @param {string} text 
 * @param {string} [elementToHighlightId] 
 * @param {Function} [onEndCallback] 
 */
function speakText(text, elementToHighlightId = null, onEndCallback = null) {
  if (!synth) {
    showToast("Text-to-Speech is not supported by your browser.", "error");
    return;
  }

  // Cancel any ongoing speech
  stopAudioNarration();

  // Clean text of html tags
  const cleanText = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!cleanText) return;

  currentUtterance = new SpeechSynthesisUtterance(cleanText);
  currentUtterance.rate = speechRate;
  currentUtterance.pitch = 1.0;
  currentUtterance.lang = "en-US";

  // Pick natural English voice if available
  const voices = synth.getVoices();
  const naturalVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha")));
  if (naturalVoice) {
    currentUtterance.voice = naturalVoice;
  }

  // Visual highlight on target element
  clearSpeakingHighlight();
  if (elementToHighlightId) {
    const el = document.getElementById(elementToHighlightId);
    if (el) {
      el.classList.add("is-speaking");
      activeNarratedElementId = elementToHighlightId;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  updateAudioNarrationUI(true, false);

  currentUtterance.onend = () => {
    isSpeaking = false;
    isPaused = false;
    clearSpeakingHighlight();
    updateAudioNarrationUI(false, false);
    if (typeof onEndCallback === "function") onEndCallback();
  };

  currentUtterance.onerror = (e) => {
    console.error("SpeechSynthesis error:", e);
    isSpeaking = false;
    isPaused = false;
    clearSpeakingHighlight();
    updateAudioNarrationUI(false, false);
  };

  synth.speak(currentUtterance);
  isSpeaking = true;
  isPaused = false;
}

/**
 * Narrate a specific product by ID
 * @param {string} productId 
 */
function narrateProduct(productId) {
  if (typeof getProductById !== "function") return;
  const product = getProductById(productId);
  if (!product) return;

  const narrationScript = `
    Product: ${product.name}.
    Category: ${product.categoryName}.
    Price: ${product.price.toLocaleString("en-LK")} rupees.
    Customer Rating: ${product.rating} stars out of 5 from ${product.reviewsCount} reviews.
    Stock status: ${product.inStock ? 'Currently in stock' : 'Out of stock'}.
    Description: ${product.description}.
    Key features include: ${product.specs.join(". ")}.
  `;

  speakText(narrationScript, `card-${productId}`);
  showToast(`Reading details for "${product.name}"`, "info");
}

/**
 * Read aloud a comprehensive overview of the current page
 */
function narratePageSummary() {
  const isHomePage = !!document.getElementById("heroSection");
  let script = "";

  if (isHomePage) {
    script = `
      Welcome to AuraMart, your inclusive e-commerce shopping destination designed for everyone with Universal Design principles.
      This store features exactly ten high quality products divided across three curated categories: Electronics, Clothing, and Food.
      You can use the top accessibility bar to switch between Normal, Large, and Extra Large font sizes, toggle High Contrast mode, and control audio narration.
      Use the search bar in the navigation header to search for any product, or browse our categories and featured products below.
    `;
  } else {
    script = `
      You are on the AuraMart Product Catalog page.
      Browse our ten accessible items.
      You can filter items by All, Electronics, Clothing, or Food, and sort by Popularity, Price low to high, Price high to low, or Ratings.
      Use the Listen button on any product card for instant audio readout of its specifications and price.
    `;
  }

  speakText(script, null);
  showToast("Reading page overview...", "info");
}

/**
 * Pause speech
 */
function pauseAudioNarration() {
  if (synth && isSpeaking && !isPaused) {
    synth.pause();
    isPaused = true;
    updateAudioNarrationUI(true, true);
    showToast("Audio paused", "info");
  }
}

/**
 * Resume speech
 */
function resumeAudioNarration() {
  if (synth && isSpeaking && isPaused) {
    synth.resume();
    isPaused = false;
    updateAudioNarrationUI(true, false);
    showToast("Audio resumed", "info");
  }
}

/**
 * Stop narration completely
 */
function stopAudioNarration() {
  if (synth) {
    synth.cancel();
  }
  isSpeaking = false;
  isPaused = false;
  clearSpeakingHighlight();
  updateAudioNarrationUI(false, false);
}

/**
 * Set speech rate multiplier (0.8x, 1.0x, 1.2x)
 * @param {number} rate 
 */
function setSpeechRate(rate) {
  speechRate = parseFloat(rate) || 1.0;
  try {
    localStorage.setItem(SPEECH_RATE_KEY, speechRate.toString());
  } catch (e) {
    console.warn("Storage error", e);
  }
  showToast(`Voice Speed: ${speechRate}x`, "info");
}

function clearSpeakingHighlight() {
  if (activeNarratedElementId) {
    const el = document.getElementById(activeNarratedElementId);
    if (el) el.classList.remove("is-speaking");
    activeNarratedElementId = null;
  }
}

function updateAudioNarrationUI(speaking, paused) {
  const pulseEls = document.querySelectorAll(".audio-status-pulse");
  const playBtn = document.getElementById("audioPlaySummaryBtn");
  const pauseBtn = document.getElementById("audioPauseBtn");
  const stopBtn = document.getElementById("audioStopBtn");

  pulseEls.forEach(el => {
    el.classList.toggle("speaking", speaking && !paused);
    el.classList.toggle("paused", paused);
  });

  if (pauseBtn) {
    pauseBtn.style.display = speaking ? "inline-flex" : "none";
    pauseBtn.textContent = paused ? "▶ Resume" : "⏸ Pause";
    pauseBtn.setAttribute("aria-label", paused ? "Resume audio narration" : "Pause audio narration");
  }

  if (stopBtn) {
    stopBtn.style.display = speaking ? "inline-flex" : "none";
  }

  if (playBtn) {
    playBtn.textContent = speaking && !paused ? "🔊 Reading..." : "🔊 Read Page";
  }
}

/* ==========================================================================
   4. LIVE SCREEN READER REGION
   ========================================================================== */

/**
 * Announce polite message for screen readers via aria-live
 * @param {string} message 
 */
function announceLiveMessage(message) {
  let liveRegion = document.getElementById("a11yLiveAnnouncer");
  if (!liveRegion) {
    liveRegion = document.createElement("div");
    liveRegion.id = "a11yLiveAnnouncer";
    liveRegion.className = "sr-only";
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("aria-atomic", "true");
    document.body.appendChild(liveRegion);
  }

  // Clear and update to trigger announcement in screen readers
  liveRegion.textContent = "";
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 50);
}

/* ==========================================================================
   5. LOAD SAVED PREFERENCES & EVENT LISTENERS
   ========================================================================== */

function initializeAccessibility() {
  // 1. Load Font Size Preference
  let savedFontSize = "normal";
  try {
    savedFontSize = localStorage.getItem(FONT_STORAGE_KEY) || "normal";
  } catch (e) {}
  setFontSize(savedFontSize);

  // Font size button clicks
  const fontButtons = document.querySelectorAll(".font-size-btn");
  fontButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const size = btn.getAttribute("data-size");
      setFontSize(size);
    });
  });

  // 2. Load High Contrast Preference
  let savedContrast = false;
  try {
    savedContrast = localStorage.getItem(CONTRAST_STORAGE_KEY) === "true";
  } catch (e) {}

  if (savedContrast) {
    document.documentElement.classList.add("high-contrast");
    updateContrastUI(true);
  } else {
    updateContrastUI(false);
  }

  // High contrast button clicks
  const contrastButtons = document.querySelectorAll(".btn-contrast-toggle");
  contrastButtons.forEach(btn => {
    btn.addEventListener("click", toggleHighContrast);
  });

  // 3. Audio Narration Controls
  const playSummaryBtn = document.getElementById("audioPlaySummaryBtn");
  if (playSummaryBtn) {
    playSummaryBtn.addEventListener("click", () => {
      if (isSpeaking && !isPaused) {
        pauseAudioNarration();
      } else if (isSpeaking && isPaused) {
        resumeAudioNarration();
      } else {
        narratePageSummary();
      }
    });
  }

  const pauseBtn = document.getElementById("audioPauseBtn");
  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      if (isPaused) {
        resumeAudioNarration();
      } else {
        pauseAudioNarration();
      }
    });
  }

  const stopBtn = document.getElementById("audioStopBtn");
  if (stopBtn) {
    stopBtn.addEventListener("click", stopAudioNarration);
  }

  const rateSelect = document.getElementById("speechRateSelect");
  if (rateSelect) {
    try {
      const savedRate = localStorage.getItem(SPEECH_RATE_KEY);
      if (savedRate) {
        speechRate = parseFloat(savedRate);
        rateSelect.value = savedRate;
      }
    } catch (e) {}

    rateSelect.addEventListener("change", (e) => {
      setSpeechRate(e.target.value);
    });
  }

  // Pre-load synth voices
  if (synth && synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => {
      // voices ready
    };
  }
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializeAccessibility);
