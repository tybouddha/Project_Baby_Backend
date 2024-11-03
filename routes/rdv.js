var express = require("express");
var router = express.Router();
require("../models/connection");
const Rdv = require("../models/rdv");
const Project = require("../models/project");
const { checkBody } = require("../modules/checkbody");

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
    // const rdvInstant = await Rdv.findOne({ _id: savedRdv._id });
    // console.log("BIYR", rdvInstant);
    // const tempRdv = [...project.rdv, savedRdv._id];
    // console.log(tempRdv);

    // if (rdvInstant) {
    //   const updatedProject = await Project.updateOne(
    //     { token: req.params.tokenProject },
    //     { rdv: tempRdv }
    //   );
    // }
    // console.log("updated project :", updatedProject);

    // save project maj
    // await project.save();

    res.json({ message: "Rendez-vous ajouté avec succès", rendezvous: newRdv });
  } catch (error) {
    console.log(error);
    console.error("Erreur lors de l'ajout du rendez-vous :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// futur route pour telecharger les données rdv dan les onglets agendas

router.get("/:years/:month", (req, res) => {
  Rdv.find({ years: req.params.years, month: req.params.month }).then(
    (rdvData) => {
      if (!rdvData) {
        return res.json({ result: false, error: "Utilisateur non trouvé" });
      } else {
        res.json({ result: true, rdv: rdvData });
      }
      console.log(rdvData);
    }
  );
});
module.exports = router;
