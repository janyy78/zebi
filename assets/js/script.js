/**
 * FoxFarm - Menu produits
 * Pour ajouter/modifier un produit : éditer assets/js/burgers.json
 * Structure : id, nom, description, prix[], categorie, Gamme, origine?, media[]
 */

document.addEventListener("DOMContentLoaded", () => {
  const menuDiv = document.getElementById("menu");
  const selectCategorie = document.getElementById("categories");
  const selectGamme = document.getElementById("gamme");
  let burgersData = [];

  // Config pour faciliter les ajouts/modifications
  const CONFIG = {
    imageDefault: "assets/images/a7f2e9d1.jpg",
    gammeLabels: {
      fresh_frozen: "Fresh Frozen",
      jaune_mousseaux: "Jaune Mousseux",
      x3: "X3",
      weed_us: "Weed US",
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
    prixSeuils: { abordable: 60, standard: 110 }
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
      div.style.animationDelay = `${Math.min(index * 0.05, 0.3)}s`;

      const imgSrc = getImageSrc(burger);
      const prixMin = getPrixMin(burger);
      const { catClass, catLabel, tagsContent } = getTags(burger);

      div.innerHTML = `
        <div class="burger-card-image">
          <div class="burger-card-tags">
            <span class="product-tag tag-cat ${catClass}">${catLabel}</span>
          </div>
          <img src="${imgSrc}" alt="${burger.nom}" loading="lazy">
        </div>
        <div class="burger-card-content">
          <h3>${burger.nom}</h3>
          ${tagsContent ? `<div class="burger-card-tags-content">${tagsContent}</div>` : ""}
          <span class="burger-card-price">À partir de ${prixMin}€</span>
          <span class="burger-card-cta">Voir le produit <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
        </div>
      `;

      div.addEventListener("click", () => {
        window.location.href = `burger.html?id=${burger.id}`;
      });

      menuDiv.appendChild(div);
    });
  }

  function filtrerBurgers() {
    const cat = selectCategorie.value;
    const gamme = selectGamme.value;
    let filtres = [...burgersData];

    if (cat !== "all") {
      filtres = filtres.filter(b => b.categorie === cat);
    }

    if (gamme !== "all") {
      filtres = filtres.filter(b => {
        if (!b.prix?.length) return false;
        const g = gamme.toLowerCase();
        const gammeList = ["dry", "static", "frozen_sift", "fresh_frozen", "jaune_mousseaux", "caliplates", "rosin", "wax", "wpff", "piatella", "edibales", "weed_es", "weed_nl", "weed_us", "coke_ecaille", "x3"];
        if (gammeList.includes(g)) {
          return (b.Gamme || "").toLowerCase().replace(/\s/g, "_") === g;
        }
        const prixMax = parseFloat(b.prix[0]?.price || 0);
        if (g === "low") return prixMax <= 60;
        if (g === "mid") return prixMax > 60 && prixMax <= 110;
        if (g === "high") return prixMax > 110;
        return false;
      });
    }

    afficherBurgers(filtres);
  }

  async function chargerMenu() {
    try {
      const response = await fetch("assets/js/burgers.json");
      burgersData = await response.json();
      if (Array.isArray(burgersData) && burgersData.length) {
        burgersData.sort((a, b) => (a.ordre || a.id) - (b.ordre || b.id));
      }
      filtrerBurgers();
    } catch (err) {
      menuDiv.innerHTML = "<p class='loader'>Impossible de charger les produits.</p>";
    }
  }

  selectCategorie.addEventListener("change", filtrerBurgers);
  selectGamme.addEventListener("change", filtrerBurgers);

  chargerMenu();
});
