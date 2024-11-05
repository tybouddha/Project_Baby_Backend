var express = require("express");
var router = express.Router();
const User = require("../models/user");
const Project = require("../models/project");
const Document = require("../models/document");
const { checkBody } = require("../modules/checkbody");

const cloudinary = require("cloudinary").v2;
const fs = require("fs");

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

router.post("/uploadPhoto", async (req, res) => {
  console.log("dans POST /documents/uploadPhoto");

  if (!req.files?.photoFromFront) {
    console.log("- il n'y a pas de bon truc dedans");
    console.log("req.files: ", req.files);
    return res.json({ result: false, message: "no file" });
  }
  console.log(
    `recieved photoFromFront (name): ${req.files.photoFromFront.name}`
  );
  // console.log(`formData: ${req.body.formData}`);
  // console.log(`photo name: ${req.body.formData.name}`);

  const photoPath = `./tmp/${req.files.photoFromFront.name}`;
  console.log(`- photoPath: ${photoPath}`);
  // const photoPath = `./tmp/photo.jpg`;
  const resultMove = await req.files.photoFromFront.mv(photoPath);
  console.log(`- supprimer de ${photoPath}`);
  if (!resultMove) {
    // on s'attendre que resultMove est undefinied
    const resultCloudinary = await cloudinary.uploader.upload(photoPath);

    fs.unlinkSync(photoPath);

    console.log(`resultCloudinary.secure_url: ${resultCloudinary.secure_url}`);

    res.json({ result: true, url: resultCloudinary.secure_url });
  } else {
    res.json({ result: false, error: resultCopy });
  }
});

module.exports = router;
