var express = require("express"); // Importe le framework Express pour gérer les routes et requêtes HTTP.
var router = express.Router(); // Initialise un routeur Express pour définir des routes spécifiques à ce fichier.
const User = require("../models/user"); // Importe le modèle `User` pour gérer les utilisateurs.
const Project = require("../models/project"); // Importe le modèle `Project` pour interagir avec les projets.
const Document = require("../models/document"); // Importe le modèle `Document` pour gérer les documents associés à des projets.
const { checkBody } = require("../modules/checkbody"); // Importe une fonction utilitaire pour vérifier les champs du corps des requêtes.

const cloudinary = require("cloudinary").v2; // Importe le SDK de Cloudinary pour gérer les téléchargements d'images.
const fs = require("fs"); // Importe le module de gestion de fichiers pour manipuler les fichiers sur le système.

router.get("/ca_marcher", (req, res) => {
  // Route GET simple pour vérifier le bon fonctionnement de l'API.
  res.json({ result: true }); // Retourne une réponse indiquant que l'API est opérationnelle.
});

router.get("/:tokenProject", async (req, res) => {
  // Route GET pour récupérer les documents associés à un projet via son token.
  const projectData = await Project.findOne({ token: req.params.tokenProject }); // Recherche le projet correspondant au `tokenProject`.

  if (!projectData) {
    // Si aucun projet n'est trouvé...
    return res.json({ result: false, error: "Project token rien trouvé" }); // Retourne une erreur.
  }

  const documentsData = await Document.find({ project: projectData._id }); // Recherche les documents associés au projet trouvé.
  return res.json({ result: true, documentsData }); // Retourne les documents trouvés.
});

router.post("/add", async (req, res) => {
  // Route POST pour ajouter un nouveau document à un projet.
  if (!checkBody(req.body, ["token", "tokenProject"])) {
    // Vérifie que les champs `token` et `tokenProject` sont présents.
    return res.json({
      result: false,
      error: "Champs manquant ou mal renseigné",
    }); // Retourne une erreur si un champ est manquant.
  }

  const userData = await User.findOne({ token: req.body.token }); // Vérifie si l'utilisateur existe.
  const projectData = await Project.findOne({ token: req.body.tokenProject }); // Recherche le projet correspondant au `tokenProject`.

  if (!projectData) {
    // Si le projet n'est pas trouvé...
    return res.json({ result: false, error: "Project non trouvé" }); // Retourne une erreur.
  }

  const newDocument = new Document({
    // Crée un nouveau document avec les données reçues.
    url: req.body.url,
    nom: req.body.nom,
    practicien: req.body.practicien,
    notes: req.body.notes,
    dateAjoute: new Date(),
    project: projectData._id, // Associe le document au projet.
  });

  const savedDocument = await newDocument.save(); // Sauvegarde le document dans la base de données.
  projectData.document.push(savedDocument._id); // Ajoute le document au tableau `document` du projet.
  await projectData.save(); // Sauvegarde le projet mis à jour.
  res.json({ result: true }); // Retourne une réponse de succès.
});

router.delete("/:documentId", async (req, res) => {
  // Route DELETE pour supprimer un document via son ID.
  const documentId = req.params.documentId; // Récupère l'ID du document depuis les paramètres.
  const documentData = await Document.findOne({ _id: documentId }); // Recherche le document correspondant à l'ID.

  if (!documentData) {
    // Si le document n'existe pas...
    return res.json({ result: false, error: "Document non trouvé" }); // Retourne une erreur.
  }

  const projectData = await Project.findOne({ document: documentData._id }); // Recherche le projet associé au document.
  projectData.document.pull(documentId); // Supprime la référence du document du tableau `document` du projet.
  await projectData.save(); // Sauvegarde le projet mis à jour.

  await Document.deleteOne({ _id: documentId }); // Supprime le document de la base de données.
  res.json({ result: true, documentId }); // Retourne une réponse de succès avec l'ID du document supprimé.
});

router.post("/uploadPhoto", async (req, res) => {
  // Route POST pour gérer le téléchargement d'une image.
  if (!req.files?.photoFromFront) {
    // Vérifie qu'un fichier nommé `photoFromFront` est présent.
    return res.json({ result: false, message: "no file" }); // Retourne une erreur si aucun fichier n'est trouvé.
  }

  const photoPath = `./tmp/${req.files.photoFromFront.name}`; // Définit le chemin temporaire pour stocker le fichier.
  const resultMove = await req.files.photoFromFront.mv(photoPath); // Déplace le fichier vers le chemin temporaire.

  if (!resultMove) {
    // Si le déplacement a réussi...
    const resultCloudinary = await cloudinary.uploader.upload(photoPath); // Télécharge l'image vers Cloudinary.
    fs.unlinkSync(photoPath); // Supprime le fichier temporaire après le téléchargement.
    res.json({ result: true, url: resultCloudinary.secure_url }); // Retourne l'URL de l'image hébergée sur Cloudinary.
  } else {
    res.json({ result: false, error: resultMove }); // Retourne une erreur si le déplacement a échoué.
  }
});

module.exports = router;
