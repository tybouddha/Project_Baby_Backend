var express = require("express");
var router = express.Router();
const User = require("../models/user");
const Project = require("../models/project");
const Document = require("../models/document");

router.get("/ca_marcher", (req, res) => {
  console.log("dans GET /documents/ca_marcher");
  res.json({ result: true });
});

router.post("/add", async (req, res) => {
  console.log("dans POST /documents/add");

  console.log(`parametres reçu: `);
  console.log(`token: ${req.body.token}`);
  console.log(`nom: ${req.body.nom}`);
  console.log(`practicien: ${req.body.practicien}`);
  console.log(`notes: ${req.body.notes}`);
  console.log(`photos: ${req.body.url}`);

  const userData = await User.findOne({ id: req.body.token });
  // .then((userData) => {
  //   console.log(`userData.username: ${userData.username}`);
  // });
  console.log(`userData.username: ${userData.username}`);

  const projectData = await Project.findOne({ id: req.body.tokenProject });
  // Project.findOne({ id: req.body.tokenProject }).then((projectData) => {
  // });
  console.log(`projectData.token: ${projectData.token}`);

  const newDocument = new Document({
    url: req.body.url,
    nom: req.body.nom,
    practicien: req.body.practicien,
    notes: req.body.notes,
    dateAjoute: new Date(),
    project: projectData._id,
  });

  const savedDocument = await newDocument.save();
  console.log("newDocument saved");
  projectData.document.push(savedDocument._id);
  await projectData.save();
  // Project.findOne({ token: req.body.tokenProject }).then((projectData) => {
  //   console.log("Found project");
  //   projectData.document.push(savedDocument._id);
  // });

  res.json({ result: true });
});

module.exports = router;
