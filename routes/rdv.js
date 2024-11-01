var express = require("express");
var router = express.Router();
require("../models/connection");
const Rdv = require("../models/rdv");
const Project = require("../models/project");
const { checkBody } = require("../modules/checkBody");

// rout to create date
router.post("/:tokenProject", async (req, res) => {
  const { pourQui, practicien, lieu, notes, date, heure } = req.body;

  if (
    !checkBody(req.body, ["pourQui", "practicien", "lieu", "date", "heure"])
  ) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }

  try {
    // find project with token project
    const project = await Project.findOne({ token: req.params.tokenProject });
    console.log(project);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }
    // create new rdv
    const newRdv = new Rdv({
      pourQui,
      practicien,
      lieu,
      notes,
      date: new Date(date),
      heure,
    });
    const savedRdv = await newRdv.save();
    project.rdv.push(savedRdv._id);
    await project.save();
    res.json({ message: "Rendez-vous ajouté avec succès", rendezvous: newRdv });
  } catch (error) {
    console.log(error);
    console.error("Erreur lors de l'ajout du rendez-vous :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

//route get pour rechercher un rendez-vous par practicien
router.get("/:tokenProject", async (req, res) => {
  try {
    const project = await Project.findOne({ token: req.params.tokenProject });
    console.log(project);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }
    const rdv = await Rdv.find({ rdv: project.rdv });
    res.json({
      result: true,
      message: "Les rdv ont bien étaient chargés",
      rdv: rdv,
    });
  } catch (error) {
    console.log(error);
    console.error("erreur lors de la récupération des données:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
