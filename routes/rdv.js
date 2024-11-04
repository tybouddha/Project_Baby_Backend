var express = require("express");
var router = express.Router();
require("../models/connection");
const Rdv = require("../models/rdv");
const Project = require("../models/project");
const { checkBody } = require("../modules/checkbody");

// route to create date
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

//route to get appointment
router.get("/:tokenProject", async (req, res) => {
  try {
    const project = await Project.findOne({
      token: req.params.tokenProject,
    }).populate("rdv");

    console.log("projet token ?", project);

    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    // const rdv = await Rdv.find({ rdv: project.rdv });

    res.json({
      result: true,
      message: "Les rdv ont bien été chargés",
      rdv: project.rdv,
    });
  } catch (error) {
    console.log(error);
    console.error("erreur lors de la récupération des données:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

//route put to update an appointment
router.put("/:tokenProject/:id", async (req, res) => {
  const { pourQui, practicien, lieu, notes, date, heure } = req.body;

  if (
    !checkBody(req.body, ["pourQui", "practicien", "lieu", "date", "heure"])
  ) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }

  try {
    const { tokenProject, id } = req.params; // Récupération du token et de l'ID du rendez-vous
    const project = await Project.findOne({ token: tokenProject });

    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    // Vérifie si le rendez-vous existe
    const rdv = await Rdv.findById(id);
    if (!rdv) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }

    // Met à jour le rendez-vous
    rdv.pourQui = pourQui;
    rdv.practicien = practicien;
    rdv.lieu = lieu;
    rdv.notes = notes;
    rdv.date = new Date(date);
    rdv.heure = heure;
    await rdv.save();

    res.json({
      result: true,
      message: "Rendez-vous modifié avec succès",
      rendezvous: rdv,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du rendez-vous :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

//route to delete an appointment
router.delete("/:tokenProject/:id", async (req, res) => {
  try {
    const { tokenProject, id } = req.params; // Récupération du token et de l'ID du rendez-vous
    const project = await Project.findOne({ token: tokenProject });
    // console.log(project);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }
    // Vérifie si le rendez-vous existe
    const rdv = await Rdv.findById(id);
    console.log(rdv);
    if (!rdv) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }
    // Supprime le rendez-vous du tableau rendez-vous
    await Rdv.deleteOne({ id });
    // Supprime le rendez-vous de la liste des rendez-vous du projet
    await Project.updateOne(
      { token: tokenProject },
      { $pull: { rdv: rdv._id } }
    );

    res.json({ result: true, message: "Rendez-nous supprimé" });
  } catch (error) {
    console.log(error);
    console.error("Erreur lors de la suppression du rendez-vous");
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
