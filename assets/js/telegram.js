// Initialisation Telegram Web App
const tg = window.Telegram.WebApp;

// Signale que la Web App est prête
tg.ready();

// Récupérer les infos utilisateur
function getUserInfo() {
  return {
    id: tg.initDataUnsafe.user?.id || null,
    first_name: tg.initDataUnsafe.user?.first_name || "",
    username: tg.initDataUnsafe.user?.username || "",
  };
}

// Envoyer des données au bot
function envoyerCommande(data) {
  tg.sendData(JSON.stringify(data));
}

// Configurer le bouton principal de Telegram
tg.MainButton.setText("Commander maintenant");
tg.MainButton.onClick(() => {
  if (window.currentBurger) {
    envoyerCommande({
      burger: window.currentBurger,
      user: getUserInfo()
    });
    // alert("Commande envoyée au bot !");
  }
});
