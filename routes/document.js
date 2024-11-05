var express = require("express");
var router = express.Router();
const User = require("../models/user");
const Project = require("../models/project");
const Document = require("../models/document");
const { checkBody } = require("../modules/checkbody");

router.get("/ca_marcher", (req, res) => {
  console.log("dans GET /documents/ca_marcher");
  res.json({ result: true });
});

router.get("/:tokenProject", async (req, res) => {
  console.log("dans GET /documents/:tokenProject");

  console.log(`req.params.tokenProject: ${req.params.tokenProject}`);
  // check fields

  const projectData = await Project.findOne({ token: req.params.tokenProject });

  if (!projectData) {
    return res.json({ result: false, error: "Porject token rien trouve" });
  }

  const documentsData = await Document.find({ project: projectData._id });

  return res.json({ result: true, documentsData });
});

router.post("/add", async (req, res) => {
  console.log("dans POST /documents/add");

  // check fields
  if (!checkBody(req.body, ["token", "tokenProject"])) {
    return res.json({
      result: false,
      error: "Champs manquant ou mal renseigné",
    });
  }

  console.log("-- succesfully passed check");

  const userData = await User.findOne({ token: req.body.token });

  // This returns another user why ?????
  // const userData = await User.findOne({ id: req.body.token });

  const projectData = await Project.findOne({ token: req.body.tokenProject });

  if (!projectData) {
    return res.json({ result: false, error: "project non trouvé" });
  }

  const newDocument = new Document({
    url: req.body.url,
    nom: req.body.nom,
    practicien: req.body.practicien,
    notes: req.body.notes,
    dateAjoute: new Date(),
    project: projectData._id,
  });

  const savedDocument = await newDocument.save();
  projectData.document.push(savedDocument._id);
  await projectData.save();

  res.json({ result: true });
});

router.delete("/:documentId", async (req, res) => {
  console.log("dans Delete /documents/:documentId");

  const documentId = req.params.documentId;
  const documentData = await Document.findOne({ _id: documentId });

  if (!documentData) {
    return res.json({ result: false, error: "Document non trouve" });
  }
  const projectData = await Project.findOne({ document: documentData._id });

  console.log("------- projectData trouve ----------");

  // étape 1: supprimer documentId de le project dans le collection project
  projectData.document.pull(documentId);
  await projectData.save();

  // étape 2: supprimer document de collection document
  await Document.deleteOne({ _id: documentId });
  console.log("documentId supprimer: ", documentId);

  console.log(projectData);

  res.json({ result: true, documentId });
});

module.exports = router;
