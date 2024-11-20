var express = require("express"); // Importe le module Express pour créer des routes et gérer les requêtes HTTP.
var router = express.Router(); // Crée un routeur pour définir des routes associées à ce fichier.
const { checkBody } = require("../modules/checkbody"); // Importe une fonction utilitaire pour vérifier les champs du corps des requêtes.
const carnetBebe = require("../models/carnetBebe"); // Importe le modèle `carnetBebe` pour manipuler les données correspondantes dans la base de données.
const Project = require("../models/project"); // Importe le modèle `Project` pour manipuler les projets dans la base de données.
const User = require("../models/user"); // Importe le modèle `User` pour gérer les utilisateurs dans la base de données.

/* GET home page. */
router.get("/:tokenProject", (req, res) => {
  // Définition d'une route GET pour récupérer les données associées à un projet via son token.
  Project.findOne({ token: req.params.tokenProject }) // Recherche un projet dans la collection `Project` en fonction du `tokenProject` fourni.
    .populate("carnetBebe") // Charge les documents associés de la collection `carnetBebe` grâce à une référence.
    .then((projectdata) => {
      // Une fois les données trouvées...
      if (!projectdata) {
        // Si aucun projet n'est trouvé...
        res.json({ result: false, error: "projectbaby inexistant" }); // Retourne une réponse indiquant que le projet n'existe pas.
      } else {
        // Si le projet existe...
        carnetBebe.find({}).then((carnetData) => {
          // Recherche tous les documents dans la collection `carnetBebe`.
          if (!carnetData) {
            // Si aucun document n'est trouvé...
            return res.json({
              result: false,
              message: "pas d'information dans carnet bébé",
            }); // Retourne une réponse indiquant qu'aucune donnée n'est disponible.
          } else {
            // Si des documents sont trouvés...
            res.json({ result: true, infos: carnetData }); // Retourne les données trouvées.
          }
        });
      }
    });
});

router.post("/ajout/:tokenProject", async (req, res) => {
  // Route POST pour ajouter des informations à un projet spécifique.
  if (!checkBody(req.body, "username")) {
    // Vérifie si le champ `username` est présent dans le corps de la requête.
    return res.json({ result: false, error: "Missing or empty fields" }); // Retourne une erreur si le champ est manquant.
  }
  try {
    const user = await User.findOne({ username: req.body.username }); // Recherche l'utilisateur correspondant au `username` fourni.
    if (user) {
      // Si un utilisateur est trouvé...
      const project = await Project.findOne({
        proprietaire: user._id,
      }).populate("proprietaire"); // Recherche un projet dont l'utilisateur est le propriétaire.
      if (project) {
        // Si un projet est trouvé...
        const newDocCarnetBebe = new carnetBebe({
          // Crée un nouveau document `carnetBebe` avec les données du corps de la requête.
          date: req.body.date,
          heureCoucher: req.body.heureCoucher,
          repas: req.body.repas,
          selle: req.body.selle,
          couleurSelle: req.body.couleurSelle,
          notes: req.body.notes,
        });
        const saveNewDoc = await newDocCarnetBebe.save(); // Sauvegarde le nouveau document dans la base de données.
        project.carnetBebe.push(saveNewDoc); // Ajoute le document `carnetBebe` au projet en cours.
        await project.save(); // Sauvegarde le projet mis à jour.
        res.json({
          message: "mise à jour carnet bébé",
          carnetBebe: saveNewDoc, // Retourne le document ajouté en réponse.
        });
      }
    }
  } catch (error) {
    // Si une erreur survient...
    console.error("Erreur lors de l'ajout du doc bebe :", error); // Affiche l'erreur dans la console pour debug.
    res.status(500).json({ message: "Erreur serveur" }); // Retourne une erreur serveur en réponse.
  }
});

router.delete("/:tokenProject/:id", async (req, res) => {
  // Route DELETE pour supprimer un document `carnetBebe` spécifique.
  try {
    const { tokenProject, id } = req.params; // Récupère le `tokenProject` et l'ID du document à supprimer depuis les paramètres de la requête.
    const project = await Project.findOne({ token: tokenProject }); // Recherche le projet correspondant au `tokenProject`.
    if (!project) {
      // Si le projet n'est pas trouvé...
      return res.status(404).json({ message: "Projet non trouvé" }); // Retourne une erreur indiquant que le projet n'existe pas.
    }
    const docBebe = await carnetBebe.findById(id); // Recherche le document `carnetBebe` correspondant à l'ID.
    if (!docBebe) {
      // Si le document n'est pas trouvé...
      return res.status(404).json({ message: "Rendez-vous non trouvé" }); // Retourne une erreur indiquant que le document n'existe pas.
    }
    await carnetBebe.deleteOne({ _id: docBebe._id }); // Supprime le document de la collection `carnetBebe`.
    await Project.updateOne(
      { token: tokenProject },
      { $pull: { docBebe: docBebe._id } } // Supprime la référence du document dans le projet.
    );
    res.json({ result: true, message: "Document carnetBebe supprimé" }); // Retourne une réponse confirmant la suppression.
  } catch (error) {
    // Si une erreur survient...
    console.error(
      "Erreur lors de la suppression du document carnetBebe",
      error
    ); // Affiche l'erreur dans la console pour debug.
    res.status(500).json({ message: "Erreur serveur" }); // Retourne une erreur serveur en réponse.
  }
});

module.exports = router;
