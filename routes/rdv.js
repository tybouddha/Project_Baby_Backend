var express = require("express");
var router = express.Router();
require("../models/connection");
const Rdv = require("../models/rdv");
const Project = require("../models/project");
const User = require("../models/user");
const { checkBody } = require("../modules/checkBody");

//route post
router.post("/:userToken", async (req, res) => {
  const bodyFields = ["date", "pourQui", "lieu", "practicien"];

  // check if fiels are empty or misinformed
  if (!checkBody(req.body, bodyFields)) {
    res.json({
      result: false,
      error: "Champs manquant ou mal renseigné",
    });
  }

  try {
    // check if project exist with proprietaire user id
    const project = await Project.findOne()({
      proprietaire: req.body.proprietaire,
    });
    if (!project) {
      return res.json({ result: false, error: "Projet introuvable." });
    }

    // create new Rdv
    const newRdv = new Rdv({
      date: req.body.date,
      pourQui: req.body.pourQui,
      practicien: req.body.practicien,
      lieu: req.body.lieu,
      notes: req.body.notes,
    });

    // save it in bdd
    const savedRdv = await newRdv.save();
    project.rdv.push(savedRdv._id);
    await project.save();

    res.json({ result: true, rdv: newRdv });
  } catch (err) {
    console.log(err);
    res.json({ result: false, error: "Erreur interne du serveur" });
  }
});

module.exports = router;
