var express = require("express"); // Importe le module Express pour créer des routes HTTP.
var router = express.Router(); // Initialise un objet routeur pour définir des routes spécifiques à ce fichier.

/* GET home page. */
router.get("/", function (req, res, next) {
  // Définit une route GET sur la racine ("/").
  res.render("index", { title: "Express" });
  // Utilise le moteur de rendu (comme EJS ou Pug) pour afficher une vue appelée "index".
  // Passe un objet `{ title: "Express" }` à la vue, qui peut être utilisé pour afficher des données dynamiques.
});

router.get("/ca-marche", (req, res) => {
  // Définit une route GET sur "/ca-marche".
  res.json({ result: "oui 🚀" });
  // Retourne une réponse JSON contenant un objet avec une clé `result` et sa valeur "oui 🚀".
});

module.exports = router;
