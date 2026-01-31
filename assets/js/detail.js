document.addEventListener("DOMContentLoaded", async () => {
  const burgerId = new URLSearchParams(window.location.search).get("id");
  const detailDiv = document.getElementById("burger-detail");
  const btnRetour = document.getElementById("btnRetour");

  if (!detailDiv) return;

  try {
    const response = await fetch("assets/js/burgers.json");
    const burgers = await response.json();
    const burger = burgers.find(b => b.id == burgerId);

    if (!burger) {
      detailDiv.innerHTML = "<p>Burger non trouvé</p>";
      return;
    }

    window.currentBurger = burger;

    // Générer le HTML pour media (images et vidéos) — cliquables pour lightbox
    let mediaHTML = "";
    const mediaItems = burger.media || [];
    mediaItems.forEach((m, i) => {
      if (m.type === "image") {
        mediaHTML += `<div class="burger-media-item burger-media-image media-clickable" data-type="image" data-src="${m.src}" tabindex="0" role="button" aria-label="Voir l'image en grand">
          <img src="${m.src}" alt="${burger.nom}">
          <span class="media-zoom-hint">🔍</span>
        </div>`;
      } else if (m.type === "video") {
        mediaHTML += `<div class="burger-media-item burger-media-video media-clickable" data-type="video" data-src="${m.src}" tabindex="0" role="button" aria-label="Voir la vidéo en grand">
          <video src="${m.src}" playsinline muted loop></video>
          <span class="media-zoom-hint">▶</span>
        </div>`;
      }
    });

    // Injecter le HTML complet avec structure moderne et espacement user-friendly
    detailDiv.innerHTML = `
      <div class="burger-media-wrapper">
        ${mediaHTML}
      </div>
      <div class="burger-content">
        <h2>${burger.nom}</h2>
        <p class="description">${burger.description}</p>
        <div id="kilo-prices" class="kilo-prices"></div>
        <div class="contact-section">
          <p class="contact-label">Commander</p>
          <div id="contact-buttons" class="contact-buttons">
            <a class="contact-btn telegram" href="https://t.me/MrCs6868" target="_blank" rel="noopener">
              <span class="contact-emoji">✈️</span>
              <span>Telegram</span>
            </a>
            <a class="contact-btn snapchat" href="https://www.snapchat.com/add/lefact" target="_blank" rel="noopener">
              <span class="contact-emoji">👻</span>
              <span>Snapchat</span>
            </a>
            <a class="contact-btn snapchat-alt" href="https://www.snapchat.com/add/mrcs68000" target="_blank" rel="noopener">
              <span class="contact-emoji">👻</span>
              <span>Snap (secours)</span>
            </a>
          </div>
        </div>
      </div>
    `;

    // Récupérer les conteneurs après injection
    const kiloContainer = document.getElementById("kilo-prices");
    const contactContainer = document.getElementById("contact-buttons");

    // Ajouter les boutons kilo
    const kilos = burger.prix || [];
    kilos.forEach(k => {
      const btn = document.createElement("button");
      btn.textContent = `${k.poids}g - ${k.price}€`;
      // btn.addEventListener("click", () => {
      //   window.currentBurger.price = k.price;
      //   alert(`Commande pour ${k.poids}kg sélectionnée`);
      // });
      kiloContainer.appendChild(btn);
    });

    // Bouton retour
    if (btnRetour) {
      btnRetour.addEventListener("click", () => {
        window.location.href = "index.html";
      });
    }

    // Lightbox — clic sur image/vidéo pour voir en détail
    const lightbox = document.getElementById("media-lightbox");
    const lightboxImg = lightbox?.querySelector(".media-lightbox-img");
    const lightboxVideo = lightbox?.querySelector(".media-lightbox-video");
    const lightboxOverlay = lightbox?.querySelector(".media-lightbox-overlay");
    const lightboxClose = lightbox?.querySelector(".media-lightbox-close");

    function openLightbox(type, src) {
      if (!lightbox) return;
      lightboxImg.style.display = "none";
      lightboxVideo.style.display = "none";
      lightboxVideo.pause();
      if (type === "image") {
        lightboxImg.src = src;
        lightboxImg.alt = burger.nom;
        lightboxImg.style.display = "block";
      } else if (type === "video") {
        lightboxVideo.src = src;
        lightboxVideo.style.display = "block";
        lightboxVideo.play();
      }
      lightbox.classList.remove("is-closing");
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.classList.add("is-closing");
      lightboxVideo.pause();
      setTimeout(() => {
        lightbox.classList.remove("is-open", "is-closing");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
      }, 350);
    }

    detailDiv.querySelectorAll(".media-clickable").forEach(el => {
      el.addEventListener("click", () => {
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
    detailDiv.innerHTML = "<p>Erreur lors du chargement du burger.</p>";
  }
});
