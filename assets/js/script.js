/**
 * FoxFarm - Menu produits
 * Pour ajouter/modifier un produit : éditer assets/js/burgers.json
 * Structure : id, nom, description, prix[], categorie, Gamme, origine?, media[]
 * Affichage par défaut : ordre croissant des id (comme dans le JSON).
 */

document.addEventListener("DOMContentLoaded", () => {
  const REVIEWS_DATA_URL = "assets/data/reviews.json";
  const FAVORITES_OVERRIDE_STORAGE_KEY = "foxfarm_favorites_override_v1";
  const menuDiv = document.getElementById("menu");
  const selectCategorie = document.getElementById("categories");
  const selectGamme = document.getElementById("gamme");
  const selectOrigine = document.getElementById("origine");
  const selectPriceRange = document.getElementById("price-range");
  const selectSort = document.getElementById("sort");
  const inputSearch = document.getElementById("search");
  const filterSummary = document.getElementById("filter-summary");
  const resetFiltersBtn = document.getElementById("reset-filters");
  let burgersData = [];
  let reviewsData = {};
  let searchDebounce = null;

  const FILTERS_STORAGE_KEY = "foxfarm_filters_v1";

  // Config pour faciliter les ajouts/modifications
  const CONFIG = {
    imageDefault: "assets/images/a7f2e9d1.jpg",
    gammeLabels: {
      fresh_frozen: "Fresh Frozen",
      jaune_mousseaux: "Jaune Mousseux",
      x3: "X3",
      weed_us: "Weed US",
      weed_ca: "Weed CA",
      weed_es: "Weed ES",
      weed_nl: "Weed NL",
      caliplates: "Caliplates",
      piatella: "Piatella",
      coke_ecaille: "Coke Écaille",
      dry: "Dry",
      static: "Static",
      frozen_sift: "Frozen Sift",
      rosin: "Rosin",
      wax: "Wax",
      wpff: "Wpff",
      edibales: "Edibles"
    },
    prixSeuils: { abordable: 60, standard: 110 },
    skeletonCount: 6
  };

  function getImageSrc(product) {
    const media = product.media?.find(m => m.type === "image");
    if (!media?.src) return CONFIG.imageDefault;
    const src = media.src;
    if (src.endsWith(".mp4")) return CONFIG.imageDefault;
    return src;
  }

  function getPrixMin(product) {
    if (!product.prix?.length) return "-";
    const prix = product.prix.map(p => parseFloat(p.price)).filter(n => !isNaN(n));
    return prix.length ? Math.min(...prix) : "-";
  }

  function getPrixMax(product) {
    if (!product.prix?.length) return 0;
    const prix = product.prix.map(p => parseFloat(p.price)).filter(n => !isNaN(n));
    return prix.length ? Math.max(...prix) : 0;
  }

  function getProductSocialData(productId) {
    return reviewsData[String(productId)] || {};
  }

  function readReviews(productId) {
    const reviews = getProductSocialData(productId).reviews;
    if (!Array.isArray(reviews)) return [];
    return reviews.filter((item) => {
      const rating = Number(item?.rating);
      return rating >= 1 && rating <= 5;
    });
  }

  function getAverageRating(reviews) {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0);
    return total / reviews.length;
  }

  function readFavorites(productId) {
    const baseCount = Number.parseInt(getProductSocialData(productId).favorites || "0", 10);
    const safeBaseCount = Number.isNaN(baseCount) || baseCount < 0 ? 0 : baseCount;
    try {
      const raw = localStorage.getItem(FAVORITES_OVERRIDE_STORAGE_KEY);
      const overrides = JSON.parse(raw || "{}");
      const overrideCount = Number.parseInt(overrides?.[String(productId)] || safeBaseCount, 10);
      return Number.isNaN(overrideCount) || overrideCount < 0 ? safeBaseCount : overrideCount;
    } catch (_) {
      return safeBaseCount;
    }
  }

  function saveFavoriteOverride(productId, count) {
    try {
      const raw = localStorage.getItem(FAVORITES_OVERRIDE_STORAGE_KEY);
      const overrides = JSON.parse(raw || "{}");
      overrides[String(productId)] = Math.max(0, Number(count) || 0);
      localStorage.setItem(FAVORITES_OVERRIDE_STORAGE_KEY, JSON.stringify(overrides));
    } catch (_) {
      // no-op
    }
  }

  function renderRatingSummary(productId) {
    const reviews = readReviews(productId);
    if (!reviews.length) {
      return '<div class="burger-card-rating burger-card-rating--empty"><span class="burger-card-rating-text">Pas encore d’avis</span></div>';
    }

    const average = getAverageRating(reviews);
    const filledStars = Math.round(average);
    const stars = Array.from({ length: 5 }, (_, index) => (
      `<span class="burger-card-rating-star${index < filledStars ? " is-filled" : ""}">★</span>`
    )).join("");

    return `
      <div class="burger-card-rating" aria-label="Note moyenne ${average.toFixed(1)} sur 5">
        <div class="burger-card-rating-stars">${stars}</div>
        <span class="burger-card-rating-text">${average.toFixed(1)}/5 · ${reviews.length} avis</span>
      </div>
    `;
  }

  function normalizeValue(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function getOriginValue(product) {
    return normalizeValue(product.origine || "");
  }

  function getPriceThresholdValue(product) {
    const prixMin = getPrixMin(product);
    if (typeof prixMin !== "number") return null;
    return prixMin;
  }

  function setSummary(total, filtered) {
    if (!filterSummary) return;
    if (!total) {
      filterSummary.textContent = "Aucun produit disponible.";
      return;
    }
    if (filtered === total) {
      filterSummary.textContent = `${total} produit${total > 1 ? "s" : ""} affiché${total > 1 ? "s" : ""}.`;
      return;
    }
    filterSummary.textContent = `${filtered} produit${filtered > 1 ? "s" : ""} sur ${total} affiché${filtered > 1 ? "s" : ""}.`;
  }

  function populateOrigines(items) {
    if (!selectOrigine) return;
    const currentValue = selectOrigine.value || "all";
    const origins = [...new Set(
      (Array.isArray(items) ? items : [])
        .map((item) => item?.origine)
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

    selectOrigine.innerHTML = '<option value="all">🌍 Toutes</option>';

    origins.forEach((originLabel) => {
      const option = document.createElement("option");
      option.value = normalizeValue(originLabel);
      option.textContent = originLabel;
      selectOrigine.appendChild(option);
    });

    if (optionValueExists(selectOrigine, currentValue)) {
      selectOrigine.value = currentValue;
    }
  }

  function resetFilters() {
    if (selectCategorie) selectCategorie.value = "all";
    if (selectGamme) selectGamme.value = "all";
    if (selectOrigine) selectOrigine.value = "all";
    if (selectPriceRange) selectPriceRange.value = "all";
    if (selectSort) selectSort.value = "default";
    if (inputSearch) inputSearch.value = "";
    saveFilters();
    filtrerBurgers();
  }

  function getTags(product) {
    const cat = (product.categorie || "hash").toLowerCase();
    const catClass = ["hash", "weed", "festifs"].includes(cat) ? cat : "hash";
    const catLabel = { hash: "Hash", weed: "Weed", festifs: "Festifs" }[catClass] || "Produit";

    const gamme = (product.Gamme || "").toLowerCase().replace(/\s/g, "_");
    const gammeLabel = CONFIG.gammeLabels[gamme] || gamme.replace(/_/g, " ") || null;

    const origine = product.origine || null;
    const prixList = (product.prix || []).map(p => parseFloat(p.price)).filter(n => !isNaN(n));
    const prixMax = prixList.length ? Math.max(...prixList) : 0;
    let prixLabel = null;
    if (prixMax > 0) {
      if (prixMax <= CONFIG.prixSeuils.abordable) prixLabel = "Abordable";
      else if (prixMax <= CONFIG.prixSeuils.standard) prixLabel = "Standard";
      else prixLabel = "Premium";
    }

    const tagsContent = [gammeLabel, origine, prixLabel]
      .filter(Boolean)
      .map((label, i) => {
        const type = gammeLabel === label ? "tag-gamme" : (origine === label ? "tag-origin" : "tag-prix");
        return `<span class="product-tag ${type}">${label}</span>`;
      })
      .join("");

    return { catClass, catLabel, tagsContent };
  }

  function afficherBurgers(burgers) {
    menuDiv.innerHTML = "";
    if (!burgers?.length) {
      menuDiv.innerHTML = '<p class="menu-empty">Aucun produit ne correspond à vos filtres.</p>';
      return;
    }

    burgers.forEach((burger, index) => {
      const div = document.createElement("div");
      div.classList.add("burger-card");
      div.setAttribute("data-product-id", String(burger.id ?? ""));
      div.setAttribute("role", "link");
      div.setAttribute("tabindex", "0");
      div.setAttribute("aria-label", `Voir ${burger.nom || "le produit"}`);
      div.style.animationDelay = `${Math.min(index * 0.05, 0.3)}s`;

      const imgSrc = getImageSrc(burger);
      const prixMin = getPrixMin(burger);
      const { catClass, catLabel, tagsContent } = getTags(burger);
      const favoritesCount = readFavorites(burger.id);
      const favoriteBadge = `
        <button
          type="button"
          class="product-favorite-badge"
          data-favorite-button="true"
          aria-label="Ajouter un coup de cœur pour ${burger.nom || "ce produit"}"
        >
          <span class="product-favorite-icon" aria-hidden="true">❤</span>
          <span class="product-favorite-count">${favoritesCount}</span>
        </button>
      `;

      div.innerHTML = `
        <div class="burger-card-image">
          <div class="burger-card-tags">
            <span class="product-tag tag-cat ${catClass}">${catLabel}</span>
          </div>
          ${favoriteBadge}
          <img src="${imgSrc}" alt="${burger.nom}" loading="lazy">
        </div>
        <div class="burger-card-content">
          <h3>${burger.nom}</h3>
          ${tagsContent ? `<div class="burger-card-tags-content">${tagsContent}</div>` : ""}
          ${renderRatingSummary(burger.id)}
          <span class="burger-card-price">À partir de ${prixMin}€</span>
          <span class="burger-card-cta">Voir le produit <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
        </div>
      `;

      div.addEventListener("click", () => {
        const id = encodeURIComponent(String(burger.id));
        window.location.href = `burger.html?id=${id}`;
      });

      const favoriteButton = div.querySelector("[data-favorite-button='true']");
      favoriteButton?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const nextCount = readFavorites(burger.id) + 1;
        saveFavoriteOverride(burger.id, nextCount);
        const countEl = favoriteButton.querySelector(".product-favorite-count");
        if (countEl) countEl.textContent = String(nextCount);
        favoriteButton.classList.remove("is-popping");
        void favoriteButton.offsetWidth;
        favoriteButton.classList.add("is-popping");
      });

      menuDiv.appendChild(div);
    });
  }

  function afficherSkeletons(count = CONFIG.skeletonCount) {
    menuDiv.innerHTML = "";
    for (let i = 0; i < count; i += 1) {
      const skeleton = document.createElement("div");
      skeleton.className = "burger-card skeleton-card";
      skeleton.innerHTML = `
        <div class="burger-card-image skeleton-block"></div>
        <div class="burger-card-content">
          <div class="skeleton-line skeleton-line-title"></div>
          <div class="skeleton-line skeleton-line-tag"></div>
          <div class="skeleton-line skeleton-line-price"></div>
        </div>
      `;
      menuDiv.appendChild(skeleton);
    }
  }

  function saveFilters() {
    const state = {
      category: selectCategorie?.value || "all",
      gamme: selectGamme?.value || "all",
      origine: selectOrigine?.value || "all",
      priceRange: selectPriceRange?.value || "all",
      sort: selectSort?.value || "default",
      search: inputSearch?.value || ""
    };
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(state));
  }

  function optionValueExists(selectEl, value) {
    if (!selectEl || value == null || value === "") return false;
    return [...selectEl.options].some((o) => o.value === value);
  }

  function loadFilters() {
    try {
      const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state.category && selectCategorie && optionValueExists(selectCategorie, state.category)) {
        selectCategorie.value = state.category;
      }
      if (state.gamme && selectGamme && optionValueExists(selectGamme, state.gamme)) {
        selectGamme.value = state.gamme;
      } else if (selectGamme) {
        /* Valeur inconnue (ex. ancienne option supprimée) → tout afficher */
        selectGamme.value = "all";
      }
      if (state.origine && selectOrigine && optionValueExists(selectOrigine, state.origine)) {
        selectOrigine.value = state.origine;
      } else if (selectOrigine) {
        selectOrigine.value = "all";
      }
      if (state.priceRange && selectPriceRange && optionValueExists(selectPriceRange, state.priceRange)) {
        selectPriceRange.value = state.priceRange;
      } else if (selectPriceRange) {
        selectPriceRange.value = "all";
      }
      if (state.sort && selectSort && optionValueExists(selectSort, state.sort)) {
        selectSort.value = state.sort;
      }
      if (typeof state.search === "string" && inputSearch) inputSearch.value = state.search;
    } catch (_) {
      // no-op
    }
  }

  /** Tri par id numérique (ordre d’apparition logique du catalogue) */
  function compareById(a, b) {
    const idA = Number(a.id);
    const idB = Number(b.id);
    if (!Number.isNaN(idA) && !Number.isNaN(idB)) return idA - idB;
    return String(a.id ?? "").localeCompare(String(b.id ?? ""));
  }

  /** Avertit en console si deux produits partagent le même id (détail = toujours le 1er trouvé). */
  function warnDuplicateProductIds(items) {
    if (!Array.isArray(items)) return;
    const seen = new Map();
    items.forEach((b, i) => {
      if (b == null || b.id == null || String(b.id).trim() === "") return;
      const k = String(b.id);
      if (seen.has(k)) {
        console.warn(
          `[FoxFarm] id dupliqué "${k}" : entrées aux indices ${seen.get(k)} et ${i} du JSON`
        );
      } else {
        seen.set(k, i);
      }
    });
  }

  function trierBurgers(items, sortValue) {
    const arr = [...items];
    if (sortValue === "price_asc") {
      arr.sort((a, b) => getPrixMin(a) - getPrixMin(b));
    } else if (sortValue === "price_desc") {
      arr.sort((a, b) => getPrixMax(b) - getPrixMax(a));
    } else if (sortValue === "name_asc") {
      arr.sort((a, b) => (a.nom || "").localeCompare((b.nom || ""), "fr", { sensitivity: "base" }));
    } else {
      /* Pertinence = ordre des id (croissant) */
      arr.sort(compareById);
    }
    return arr;
  }

  function filtrerBurgers() {
    const cat = selectCategorie.value;
    const gamme = selectGamme.value;
    const origine = selectOrigine?.value || "all";
    const priceRange = selectPriceRange?.value || "all";
    const sort = selectSort?.value || "default";
    const q = (inputSearch?.value || "").trim().toLowerCase();
    let filtres = [...burgersData];

    if (cat !== "all") {
      filtres = filtres.filter(
        (b) => (b.categorie || "").toLowerCase() === cat
      );
    }

    if (gamme !== "all") {
      filtres = filtres.filter(b => {
        const g = gamme.toLowerCase();
        const gammeList = ["dry", "static", "frozen_sift", "fresh_frozen", "jaune_mousseaux", "caliplates", "rosin", "wax", "wpff", "piatella", "edibales", "weed_es", "weed_nl", "weed_us","weed_ca", "coke_ecaille", "x3"];
        if (gammeList.includes(g)) {
          return (b.Gamme || "").toLowerCase().replace(/\s/g, "_") === g;
        }
        return false;
      });
    }

    if (origine !== "all") {
      filtres = filtres.filter((b) => getOriginValue(b) === origine);
    }

    if (priceRange !== "all") {
      const minPrice = Number(priceRange);
      filtres = filtres.filter((b) => {
        const entryPrice = getPriceThresholdValue(b);
        return typeof entryPrice === "number" && entryPrice >= minPrice;
      });
    }

    if (q) {
      filtres = filtres.filter((b) => {
        const searchable = `${b.nom || ""} ${b.description || ""} ${b.Gamme || ""} ${b.categorie || ""} ${b.origine || ""}`.toLowerCase();
        return searchable.includes(q);
      });
    }

    filtres = trierBurgers(filtres, sort);
    saveFilters();
    setSummary(burgersData.length, filtres.length);
    afficherBurgers(filtres);
  }

  async function chargerMenu() {
    try {
      afficherSkeletons();
      /* no-store : évite un vieux JSON en cache après édition du fichier */
      const [productsResponse, reviewsResponse] = await Promise.all([
        fetch("assets/js/burgers.json", { cache: "no-store" }),
        fetch(REVIEWS_DATA_URL, { cache: "no-store" })
      ]);
      burgersData = await productsResponse.json();
      reviewsData = reviewsResponse.ok ? await reviewsResponse.json() : {};
      warnDuplicateProductIds(burgersData);
      if (Array.isArray(burgersData) && burgersData.length) {
        burgersData.sort(compareById);
      }
      populateOrigines(burgersData);
      loadFilters();
      filtrerBurgers();
    } catch (err) {
      menuDiv.innerHTML = "<p class='loader'>Impossible de charger les produits.</p>";
      setSummary(0, 0);
    }
  }

  selectCategorie.addEventListener("change", filtrerBurgers);
  selectGamme.addEventListener("change", filtrerBurgers);
  selectOrigine?.addEventListener("change", filtrerBurgers);
  selectPriceRange?.addEventListener("change", filtrerBurgers);
  selectSort?.addEventListener("change", filtrerBurgers);
  inputSearch?.addEventListener("input", () => {
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(filtrerBurgers, 150);
  });
  resetFiltersBtn?.addEventListener("click", resetFilters);

  /** Un seul listener : l’id vient toujours de la carte cliquée (data-product-id) */
  function goToProductDetail(card) {
    const rawId = card.getAttribute("data-product-id");
    if (rawId == null || rawId === "") return;
    const url = new URL("burger.html", window.location.href);
    url.searchParams.set("id", rawId);
    window.location.assign(url.href);
  }

  menuDiv.addEventListener("click", (e) => {
    const card = e.target.closest(".burger-card");
    if (!card || card.classList.contains("skeleton-card")) return;
    goToProductDetail(card);
  });

  menuDiv.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".burger-card");
    if (!card || card.classList.contains("skeleton-card")) return;
    e.preventDefault();
    goToProductDetail(card);
  });

  chargerMenu();
});

// Il y a rien pour toi ici, va voir ailleurs :)
