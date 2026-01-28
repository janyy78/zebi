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

    // Générer le HTML pour media (images et vidéos)
    let mediaHTML = "";
    burger.media.forEach(m => {
      if (m.type === "image") {
        mediaHTML += `<img src="${m.src}" alt="${burger.nom}">`;
      } else if (m.type === "video") {
        mediaHTML += `<video src="${m.src}" controls></video>`;
      }
    });

    // Injecter le HTML complet
    detailDiv.innerHTML = `
      <div class="burger-media">${mediaHTML}</div>
      <h2>${burger.nom}</h2>
      <p class="description">${burger.description}</p>
      <div id="kilo-prices" class="kilo-prices"></div>
      <div id="contact-buttons" class="contact-buttons">
        <a class="telegram" href="https://t.me/MrCs6868">Telegram</a>
        <a class="snapchat" href="https://www.snapchat.com/add/lefact" target="_blank">Snapchat</a>
        <a class="snapchat" href="https://www.snapchat.com/add/mrcs68000" target="_blank">Snapchat (Compte secours)</a>
      </div>
    `;

    // Récupérer les conteneurs après injection
    const kiloContainer = document.getElementById("kilo-prices");
    const contactContainer = document.getElementById("contact-buttons");

    // Ajouter les boutons kilo
    const kilos = burger.prix

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


  } catch (err) {
    console.error(err);
    detailDiv.innerHTML = "<p>Erreur lors du chargement du burger.</p>";
  }
});
