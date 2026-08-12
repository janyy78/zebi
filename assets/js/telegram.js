// Initialisation Telegram Web App (ne doit pas planter hors Telegram / si API absente)
(function initTelegramWebApp() {
  const tg = window.Telegram?.WebApp;
  if (!tg || typeof tg.ready !== "function") return;

  try {
    tg.ready();
  } catch (e) {
    console.warn("Telegram WebApp ready:", e);
    return;
  }

  function getUserInfo() {
    return {
      id: tg.initDataUnsafe?.user?.id ?? null,
      first_name: tg.initDataUnsafe?.user?.first_name ?? "",
      username: tg.initDataUnsafe?.user?.username ?? "",
    };
  }

  function envoyerCommande(data) {
    if (typeof tg.sendData === "function") tg.sendData(JSON.stringify(data));
  }

  if (tg.MainButton && typeof tg.MainButton.setText === "function") {
    try {
      tg.MainButton.setText("Commander maintenant");
      tg.MainButton.onClick(() => {
        if (window.currentBurger) {
          envoyerCommande({
            burger: window.currentBurger,
            user: getUserInfo(),
          });
        }
      });
    } catch (e) {
      console.warn("Telegram MainButton:", e);
    }
  }
})();
