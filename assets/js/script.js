document.addEventListener("DOMContentLoaded", () => {
  const menuDiv = document.getElementById("menu");
  const selectCategorie = document.getElementById("categories");
  const selectGamme = document.getElementById("gamme");
  let burgersData = [];

  async function chargerMenu() {
    try {
      const response = await fetch("assets/js/burgers.json");
      burgersData = await response.json();
      afficherBurgers(burgersData);
    } catch (err) {
      menuDiv.innerHTML = "<p class='loader'>Impossible de charger les burgers.</p>";
    }
  }

 function afficherBurgers(burgers) {
    menuDiv.innerHTML = "";
    burgers.forEach(burger => {
        const div = document.createElement("div");
        div.classList.add("burger-card");

        // On prend la première image disponible dans le tableau media
        const mediaImage = burger.media?.find(m => m.type === "image");
        const imgSrc = mediaImage ? mediaImage.src : "assets/images/default.jpg";

        // Vérification que le tableau prix existe et n'est pas vide
        let price_one = "-";
        let price_last = "-";
        if (burger.prix && burger.prix.length > 0) {
            price_one = burger.prix[0].price;
            price_last = burger.prix[burger.prix.length - 1].price;
        }

        div.innerHTML = `
            <img src="${imgSrc}" alt="${burger.nom}">
            <h3>${burger.nom}</h3>
            <p> à partir de ${price_last}€</p>
        `;

        div.addEventListener("click", () => {
            window.location.href = `burger.html?id=${burger.id}`;
        });

        menuDiv.appendChild(div);
    });
}

  selectCategorie.addEventListener("change", () => {
    filtrerBurgers();
  });

  selectGamme.addEventListener("change", () => {
    filtrerBurgers();
  });

 function filtrerBurgers() {
    const cat = selectCategorie.value;
    const gamme = selectGamme.value;
    let filtres = burgersData;

    // Filtre par catégorie
    if (cat !== "all") {
        filtres = filtres.filter(b => b.categorie === cat);
        console.log(cat);
    }

    // Filtre par gamme
    if (gamme !== "all") {
        filtres = filtres.filter(b => {
            // Vérification que le tableau prix existe et n'est pas vide
            if (!b.prix || b.prix.length === 0) return false;

            // Si la gamme est définie par JSON (hash, weed, extract)
            if (["dry", "static", "frozen_sift", "fresh_frozen", "jaune_mousseaux", "extract", "caliplates","rosin", "wax", "wpff", "piatella", "edibales", "weed_es", "weed_nl", "coke_ecaille", "x3"].includes(gamme.toLowerCase())) {
                return b.Gamme?.toLowerCase() === gamme.toLowerCase();
            }

            // Si la gamme est définie par prix (low/mid/high)
            const prixMax = parseFloat(b.prix[0]?.price || 0);   // prix le plus élevé
            if (gamme === "low") return prixMax <= 60;
            if (gamme === "mid") return prixMax > 60 && prixMax <= 110;
            if (gamme === "high") return prixMax > 110;

            return false; // par défaut
        });
    }

    afficherBurgers(filtres);
}



  chargerMenu();
});
