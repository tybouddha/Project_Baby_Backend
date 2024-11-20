var express = require("express");
var router = express.Router();
<<<<<<< HEAD

const Rdv = require("../models/rdv");
const Project = require("../models/project");
const { checkBody } = require("../modules/checkbody");
=======
require("../models/connection"); // Assure que la connexion à la base de données MongoDB est établie.
const Rdv = require("../models/rdv"); // Importe le modèle `Rdv` pour gérer les rendez-vous.
const Project = require("../models/project"); // Importe le modèle `Project` pour gérer les projets.
const { checkBody } = require("../modules/checkbody"); // Importe une fonction pour vérifier la présence des champs nécessaires.
>>>>>>> dev

// route to create appointment
router.post("/:tokenProject", async (req, res) => {
  const { pourQui, practicien, lieu, notes, date, heure } = req.body;
  // Déstructure les données envoyées par le client dans le corps de la requête.

  if (
    !checkBody(req.body, ["pourQui", "practicien", "lieu", "date", "heure"])
  ) {
    // Vérifie que tous les champs requis sont présents.
    return res.json({ result: false, error: "Missing or empty fields" });
  }

  try {
    const project = await Project.findOne({ token: req.params.tokenProject });
    // Recherche un projet correspondant au token fourni dans l'URL.
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    const newRdv = new Rdv({
      pourQui,
      practicien,
      lieu,
      notes,
      date: new Date(date), // Transforme la date en un objet Date valide.
      heure,
    }); // Crée un nouvel objet rendez-vous.

    const savedRdv = await newRdv.save();
    // Sauvegarde le rendez-vous dans la collection `rdv`.
    project.rdv.push(savedRdv._id);
    // Ajoute l'ID du rendez-vous sauvegardé à la liste des rendez-vous du projet.
    await project.save();
    // Sauvegarde les modifications dans le document projet.

    res.json({ message: "Rendez-vous ajouté avec succès", rendezvous: newRdv });
  } catch (error) {
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
    // Recherche un projet et récupère les informations des rendez-vous associés avec `.populate`.

    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    res.json({
      result: true,
      message: "Les rdv ont bien été chargés",
      rdv: project.rdv,
      // Retourne les rendez-vous associés au projet.
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

//route put to update an appointment
router.put("/:tokenProject/:id", async (req, res) => {
  const { pourQui, practicien, lieu, notes, heure } = req.body;

  if (
    !checkBody(req.body, ["pourQui", "practicien", "lieu", "notes", "heure"])
  ) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }

  try {
    const { tokenProject, id } = req.params;
    // Récupère le token du projet et l'ID du rendez-vous dans les paramètres de l'URL.

    const project = await Project.findOne({ token: tokenProject });
    // Vérifie que le projet existe.
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    const rdv = await Rdv.findById(id);
    // Recherche le rendez-vous par son ID.
    if (!rdv) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }

    await Rdv.findByIdAndUpdate(id, {
      pourQui,
      practicien,
      lieu,
      notes,
      heure,
    });
    // Met à jour le rendez-vous avec les nouvelles données.

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
    const { tokenProject, id } = req.params;
    // Récupère le token du projet et l'ID du rendez-vous.

    const project = await Project.findOne({ token: tokenProject });
    // Recherche le projet correspondant.
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    const rdv = await Rdv.findById(id);
    // Recherche le rendez-vous correspondant.
    if (!rdv) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }

    await Rdv.deleteOne({ _id: rdv._id });
    // Supprime le rendez-vous de la collection `rdv`.

    await Project.updateOne(
      { token: tokenProject },
      { $pull: { rdv: rdv._id } }
    );
    // Retire l'ID du rendez-vous supprimé de la liste des rendez-vous du projet.

    res.json({ result: true, message: "Rendez-vous supprimé" });
  } catch (error) {
    console.error("Erreur lors de la suppression du rendez-vous");
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
