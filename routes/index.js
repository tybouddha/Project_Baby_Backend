var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/ca-marche", (req, res) => {
  console.log("- dans GET /ca-marche");
  res.json({ result: "oui 🚀" });
});

module.exports = router;
