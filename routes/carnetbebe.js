var express = require("express");
var router = express.Router();
const { checkBody } = require("../modules/checkbody");
const carnetBebe = require("../models/carnetBebe");
const Project = require("../models/project");
const enfant = require("../models/enfant");
const User = require("../models/user");

/* GET home page. */
router.get("/:tokenProject", (req, res) => {
  Project.findOne({ token: req.params.tokenProject })
    .populate("carnetBebe")
    .then((projectdata) => {
      console.log("test5", projectdata);
      if (!projectdata) {
        res.json({ result: false, error: "projectbaby inexistant" });
      } else {
        carnetBebe.find({}).then((carnetData) => {
          if (!carnetData) {
            return res.json({
              result: false,
              message: "pas d'information dans carnet bébé",
            });
          } else {
            res.json({ result: true, infos: carnetData });
          }
        });
      }
    });
});

router.post("/ajout/:tokenProject", async (req, res) => {
  if (!checkBody(req.body, "username")) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }
  try {
    //check si proprietaire du projet pour creer doc
    const user = await User.findOne({ username: req.body.username });
    console.log("voila user", user);
    if (user) {
      const project = await Project.findOne({
        proprietaire: user._id,
      }).populate("proprietaire");
      console.log("test", project);
      if (project) {
        // res.json({ result: true, response: "vous etes propriétaire" });

        const newDocCarnetBebe = new carnetBebe({
          date: req.body.date,
          heureCoucher: req.body.heureCoucher,
          repas: req.body.repas,
          selle: req.body.selle,
          couleurSelle: req.body.couleurSelle,
          notes: req.body.notes,
        });
        //save nouveau document carnet bebe
        const saveNewDoc = await newDocCarnetBebe.save();
        console.log("check new doc", saveNewDoc);
        //ajout du document dans la collection du projet
        project.carnetBebe.push(saveNewDoc);
        await project.save();
        res.json({
          message: "mise à jour carnet bébé",
          carnetBebe: saveNewDoc,
        });
        console.log(saveNewDoc);
      }
    }
  } catch (error) {
    console.log(error);
    console.error("Erreur lors de l'ajout du doc bebe :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
router.delete("/:tokenProject/:id", async (req, res) => {
  try {
    const { tokenProject, id } = req.params; // Récupération du token et de l'ID du rendez-vous
    const project = await Project.findOne({ token: tokenProject });
    // console.log(project);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }
    // Vérifie si le rendez-vous existe
    const docBebe = await carnetBebe.findById(id);
    // console.log(rdv);
    if (!docBebe) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }
    // Supprime le rendez-vous du tableau rendez-vous
    await carnetBebe.deleteOne({ _id: docBebe._id });
    // Supprime le rendez-vous de la liste des rendez-vous du projet
    await Project.updateOne(
      { token: tokenProject },
      { $pull: { docBebe: docBebe._id } }
    );

    res.json({ result: true, message: "Document carnetBebe supprimé" });
  } catch (error) {
    // console.log(error);
    console.error(
      "Erreur lors de la suppression du document carnetBebe",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
