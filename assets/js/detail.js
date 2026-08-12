/**
 * Page détail produit — burger.html?id=
 */

const CONTACT_SNAPCHAT_LOGO_URL = "https://static.snapchat.com/images/favicon/favicon-192x192.png";
const CONTACT_LUFFA_LOGO_URL = "https://luffa.im/images/logo_pic.png";
const REVIEWS_DATA_URL = "assets/data/reviews.json";

function escapeHtml(text) {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/'/g, "&#39;");
}

function findBurgerById(burgers, rawId) {
  if (rawId == null || String(rawId).trim() === "") return null;
  if (!Array.isArray(burgers)) return null;
  const s = String(rawId).trim();
  const n = Number(s);
  const hasNum = !Number.isNaN(n) && s !== "";
  return (
    burgers.find((b) => {
      if (b == null || b.id == null) return false;
      if (hasNum && Number(b.id) === n) return true;
      return String(b.id) === s;
    }) || null
  );
}

async function loadSocialsFile(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const parts = line.split("|");
      if (parts.length < 2) return null;
      const title = parts[0].trim();
      const urlPart = parts.slice(1).join("|").trim();
      if (!title || !urlPart) return null;
      return { title, url: urlPart };
    })
    .filter(Boolean);
}

function socialMeta(title) {
  const normalized = String(title || "").toLowerCase();
  if (normalized.includes("telegram")) {
    return { className: "telegram", icon: "telegram.svg", isLuffa: false };
  }
  if (normalized.includes("luffa")) {
    return { className: "luffa", icon: null, isLuffa: true };
  }
  if (normalized.includes("signal")) {
    return { className: "signal", icon: "signal.svg", isLuffa: false };
  }
  if (normalized.includes("snapchat")) {
    return { className: "snapchat", icon: CONTACT_SNAPCHAT_LOGO_URL, isLuffa: true };
  }
  return { className: "telegram", icon: "telegram.svg", isLuffa: false };
}

async function loadReviewsFile(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data && typeof data === "object" ? data : {};
}

function readReviews(reviewsData, productId) {
  const reviews = reviewsData?.[String(productId)]?.reviews;
  if (!Array.isArray(reviews)) return [];
  return reviews.filter((item) => {
    const rating = Number(item?.rating);
    const comment = String(item?.comment || "").trim();
    return rating >= 1 && rating <= 5 && (comment || item?.comment === "");
  });
}

function formatReviewDate(value) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date(value));
  } catch (_) {
    return "";
  }
}

function getAverageRating(reviews) {
  if (!reviews.length) return 0;
  const total = reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0);
  return total / reviews.length;
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  return Array.from({ length: 5 }, (_, index) => (
    `<span class="review-star${index < safeRating ? " is-filled" : ""}">★</span>`
  )).join("");
}

function renderReviewList(listEl, reviews) {
  if (!listEl) return;
  if (!reviews.length) {
    listEl.innerHTML = '<p class="reviews-empty">Aucun avis pour le moment. Sois le premier à en laisser un.</p>';
    return;
  }

  listEl.innerHTML = reviews
    .slice()
    .reverse()
    .map((review) => `
      <article class="review-item">
        <div class="review-item-head">
          <div class="review-item-stars" aria-label="Note ${Number(review.rating)} sur 5">
            ${renderStars(Number(review.rating))}
          </div>
          <time class="review-item-date">${escapeHtml(formatReviewDate(review.date || review.createdAt))}</time>
        </div>
        ${String(review.comment || "").trim()
          ? `<p class="review-item-text">${escapeHtml(review.comment)}</p>`
          : '<p class="review-item-text review-item-text--muted">Avis sans commentaire.</p>'}
      </article>
    `)
    .join("");
}

function updateReviewSummary(summaryEl, reviews) {
  if (!summaryEl) return;
  const count = reviews.length;
  const average = getAverageRating(reviews);
  if (!count) {
    summaryEl.innerHTML = `
      <strong>Pas encore de note</strong>
    `;
    return;
  }

  summaryEl.innerHTML = `
    <strong>${average.toFixed(1)}/5</strong>
    <span>${count} avis enregistr${count > 1 ? "és" : "é"} pour ce produit.</span>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const burgerId = params.get("id");
  const detailDiv = document.getElementById("burger-detail");
  const btnRetour = document.getElementById("btnRetour");

  if (!detailDiv) return;

  if (burgerId == null || String(burgerId).trim() === "") {
    detailDiv.innerHTML =
      '<p class="detail-error">Produit introuvable : aucun identifiant dans l’URL. <a href="index.html">Retour au catalogue</a></p>';
    return;
  }

  const jsonUrl = new URL("assets/js/burgers.json", window.location.href).href;

  try {
    const reviewsUrl = new URL(REVIEWS_DATA_URL, window.location.href).href;
    const [response, reviewsData] = await Promise.all([
      fetch(jsonUrl, { cache: "no-store" }),
      loadReviewsFile(reviewsUrl).catch(() => ({}))
    ]);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const burgers = await response.json();
    window.foxfarmReviewsData = reviewsData;
    const burger = findBurgerById(burgers, burgerId);

    if (!burger) {
      detailDiv.innerHTML =
        '<p class="detail-error">Ce produit n’existe pas (id : ' +
        escapeHtml(burgerId) +
        '). <a href="index.html">Retour au catalogue</a></p>';
      return;
    }

    window.currentBurger = burger;

    const nomSafe = escapeHtml(burger.nom);
    const descSafe = escapeHtml(burger.description);

    const brandIcon = (file) =>
      escapeAttr(new URL(`assets/images/brands/${file}`, window.location.href).href);
    const socialsUrl = new URL("assets/data/socials.txt", window.location.href).href;
    let socials = [];
    try {
      socials = await loadSocialsFile(socialsUrl);
    } catch (e) {
      console.warn("Impossible de charger assets/data/socials.txt", e);
    }

    const contactButtonsHtml = socials
      .map((social) => {
        const meta = socialMeta(social.title);
        const safeTitle = escapeHtml(social.title);
        const safeHref = escapeAttr(social.url);
        if (meta.isLuffa) {
          return `<a class="contact-btn ${meta.className}" href="${safeHref}" target="_blank" rel="noopener noreferrer">
              <span class="contact-btn-icon-slot contact-btn-icon-slot--luffa" aria-hidden="true">
                <img class="contact-app-icon contact-app-icon--luffa" src="${escapeAttr(meta.icon || CONTACT_LUFFA_LOGO_URL)}" width="26" height="26" alt="" decoding="async" referrerpolicy="no-referrer">
              </span>
              <span>${safeTitle}</span>
            </a>`;
        }
        return `<a class="contact-btn ${meta.className}" href="${safeHref}" target="_blank" rel="noopener noreferrer">
              <span class="contact-btn-icon-slot" aria-hidden="true">
                <img class="contact-app-icon" src="${brandIcon(meta.icon)}" width="24" height="24" alt="" decoding="async">
              </span>
              <span>${safeTitle}</span>
            </a>`;
      })
      .join("");

    let mediaHTML = "";
    const mediaItems = burger.media || [];
    mediaItems.forEach((m) => {
      if (!m || !m.src) return;
      const srcAttr = escapeAttr(m.src);
      if (m.type === "image") {
        mediaHTML += `<div class="burger-media-item burger-media-image media-clickable" data-type="image" data-src="${srcAttr}" tabindex="0" role="button" aria-label="Voir l'image en grand">
          <img src="${srcAttr}" alt="${nomSafe}">
          <span class="media-zoom-hint">🔍</span>
        </div>`;
      } else if (m.type === "video") {
        mediaHTML += `<div class="burger-media-item burger-media-video media-clickable" data-type="video" data-src="${srcAttr}" tabindex="0" role="button" aria-label="Voir la vidéo en grand">
          <video src="${srcAttr}" playsinline webkit-playsinline preload="metadata" controls></video>
          <span class="media-zoom-hint">🔍</span>
        </div>`;
      }
    });

    detailDiv.innerHTML = `
      <div class="burger-media-wrapper">
        ${mediaHTML}
      </div>
      <div class="burger-content">
        <h2>${nomSafe}</h2>
        <p class="description">${descSafe}</p>
        <div id="kilo-prices" class="kilo-prices"></div>
        <div class="contact-section">
          <p class="contact-label">Commander</p>
          <div id="contact-buttons" class="contact-buttons">
            ${contactButtonsHtml}
          </div>
        </div>
        <section class="reviews-section" aria-labelledby="reviews-title">
          <div class="reviews-head">
            <div>
              <p class="contact-label">Avis clients</p>
              <h3 id="reviews-title" class="reviews-title">Ton avis sur ce produit</h3>
            </div>
            <div id="reviews-summary" class="reviews-summary"></div>
          </div>
          <div id="reviews-list" class="reviews-list"></div>
        </section>
      </div>
    `;

    const kiloContainer = document.getElementById("kilo-prices");
    const kilos = burger.prix || [];
    if (kiloContainer) {
      kilos.forEach((k) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = `${k.poids}g - ${k.price}€`;
        kiloContainer.appendChild(btn);
      });
    }

    if (btnRetour) {
      btnRetour.href = new URL("index.html", window.location.href).href;
    }

    const reviewList = document.getElementById("reviews-list");
    const reviewsSummary = document.getElementById("reviews-summary");

    function refreshReviews() {
      const reviews = readReviews(window.foxfarmReviewsData || {}, burger.id);
      updateReviewSummary(reviewsSummary, reviews);
      renderReviewList(reviewList, reviews);
    }

    refreshReviews();

    const lightbox = document.getElementById("media-lightbox");
    const lightboxImg = lightbox?.querySelector(".media-lightbox-img");
    const lightboxVideo = lightbox?.querySelector(".media-lightbox-video");
    const lightboxOverlay = lightbox?.querySelector(".media-lightbox-overlay");
    const lightboxClose = lightbox?.querySelector(".media-lightbox-close");

    function openLightbox(type, src) {
      if (!lightbox) return;
      if (lightboxImg) lightboxImg.style.display = "none";
      if (lightboxVideo) {
        lightboxVideo.style.display = "none";
        lightboxVideo.pause();
      }
      if (type === "image" && lightboxImg) {
        lightboxImg.src = src;
        lightboxImg.alt = burger.nom || "";
        lightboxImg.style.display = "block";
      } else if (type === "video" && lightboxVideo) {
        lightboxVideo.src = src;
        lightboxVideo.style.display = "block";
        lightboxVideo.play()?.catch(() => {});
      }
      lightbox.classList.remove("is-closing");
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.classList.add("is-closing");
      lightboxVideo?.pause();
      setTimeout(() => {
        lightbox.classList.remove("is-open", "is-closing");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
      }, 350);
    }

    detailDiv.querySelectorAll(".media-clickable").forEach((el) => {
      const videoEl = el.querySelector("video");
      if (videoEl) {
        videoEl.addEventListener("click", (e) => e.stopPropagation());
      }
      el.addEventListener("click", (e) => {
        if (e.target.closest("video")) return;
        const type = el.dataset.type;
        const src = el.dataset.src;
        if (type && src) openLightbox(type, src);
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          el.click();
        }
      });
    });

    lightboxOverlay?.addEventListener("click", closeLightbox);
    lightboxClose?.addEventListener("click", closeLightbox);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox?.classList.contains("is-open")) closeLightbox();
    });
  } catch (err) {
    console.error(err);
    detailDiv.innerHTML =
      '<p class="detail-error">Impossible de charger ce produit. Vérifie ta connexion puis <a href="index.html">retourne au catalogue</a>.</p>';
  }
});
