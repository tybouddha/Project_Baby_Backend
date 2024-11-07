var express = require("express");
var router = express.Router();
require("../models/connection");
const User = require("../models/user");
const Project = require("../models/project");
const Document = require("../models/document");
const CarnetBebe = require("../models/carnetBebe");
const Enfant = require("../models/enfant");
const Rdv = require("../models/rdv");
const { checkBody } = require("../modules/checkbody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

//Route signup without invit
router.post("/signupProject", async (req, res) => {
  console.log("- dans POST /signupProject 📌");
  const bodyFields = [
    "prenom",
    "nomDeFamille",
    "email",
    "username",
    "password",
  ];

  // check fields
  if (!checkBody(req.body, bodyFields)) {
    return res.json({
      result: false,
      error: "Champs manquant ou mal renseigné",
    });
  }
  //regex to check email format
  const emailRegExp =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!emailRegExp.test(req.body.email)) {
    return res.json({ result: false, error: "Format d'email invalide." });
  }
  try {
    //check if user already exist
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.json({ result: false, error: "Utilisateur existe déjà!" });
    }
    const dateDebutGrossesse = req.body.dateDebutGrossesse;
    const derniereMenstruation = req.body.derniereMenstruation;
    const hash = bcrypt.hashSync(req.body.password, 10);

    //create new user
    const newUser = new User({
      prenom: req.body.prenom,
      nomDeFamille: req.body.nomDeFamille,
      username: req.body.username,
      derniereMenstruation,
      dateDebutGrossesse,
      password: hash,
      email: req.body.email,
      token: uid2(32),
    });
    //save user
    const savedUser = await newUser.save();
    //create new project
    const newProject = new Project({
      proprietaire: savedUser._id,
      token: uid2(32),
      carnetBebe: req.body.carnetBebe || [],
      rdv: req.body.rdv || [],
      document: req.body.document || [],
      enfant: req.body.enfant || [],
    });
    //save project
    const savedProject = await newProject.save();

    // Réponse attendue par Redux:
    // {user_token, project.id,username,prenom, documentsArr, carnetBebeArr, rdvArr}

    return res.json({
      result: true,
      message: "Projet créé avec succès.",
      project: savedProject,
      token: savedUser.token,
      rdvArr: [],
      documentArr: [],
      carnetBebArr: [],
      username: savedUser.username,
      prenom: savedUser.prenom,
      email: savedUser.email,
      role: "propriétaire",
    });
  } catch (err) {
    console.log(err.message);

    return res.json({ result: false, error: "Erreur interne du serveur." });
  }
});

//route signIn to log in ,retake all project 's data
router.post("/signin", (req, res) => {
  // check require fields
  if (!checkBody(req.body, ["username", "password"])) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }

  // find user with the username in User collection
  User.findOne({ username: req.body.username })
    .then((user) => {
      if (!user) {
        return res.json({ result: false, error: "Utilisateur non trouvé" });
      }

      // check password
      if (!bcrypt.compareSync(req.body.password, user.password)) {
        return res.json({ result: false, error: "Mot de passe erroné" });
      }
      // console.log(user._id);
      // find project in the Project Collection
      Project.findOne({
        $or: [
          { proprietaire: user._id },
          { editeur: user._id },
          { lecteur: user._id },
        ],
      })
        .then((project) => {
          // console.log("test");
          // console.log(project);
          if (!project) {
            return res.json({ result: false, error: "Aucun projet trouvé" });
          }

          const responseData = {
            result: true,
            project: project,
            editeurLecteur: project.editeurLecteur,
            lecteur: project.lecteur,
          };

          // find all information of the project in differents collections
          return Promise.all([
            CarnetBebe.findOne({ carnetBebe: project.carnetBebe }).populate(
              "project"
            ),
            Rdv.findOne({ rdv: project.rdv }).populate("project"),
            Document.findOne({ document: project.document }).populate(
              "project"
            ),
            Enfant.findOne({ document: project.enfant }).populate("project"),
          ]).then(([carnetBebeData, rdvData, documentData, enfantData]) => {
            responseData.carnetBebeArr = carnetBebeData
              ? carnetBebeData.carnetBebe
              : [];
            responseData.rdvArr = rdvData ? rdvData.rdv : [];
            responseData.documentArr = documentData
              ? documentData.document
              : [];
            responseData.enfantArr = enfantData ? enfantData.enfant : [];
            responseData.project = project;
            responseData.token = user.token;
            responseData.username = user.username;
            res.json(responseData);
          });
        })
        .catch((error) => {
          console.error(error);
          res.json({
            result: false,
            error: "Erreur lors de la recherche du projet",
          });
        });
    })
    .catch((error) => {
      console.error(error);
      res.json({
        result: false,
        error: "Erreur lors de la recherche de l'utilisateur",
      });
    });
});

//route to delete an user (not owner of project)
router.delete("/delete", (req, res) => {
  User.findOne({ username: req.body.username }).then((userFound) => {
    if (userFound) {
      User.deleteOne({ username: req.body.username }).then((userDeleted) => {
        return res.json({ result: true });
      });
    } else {
      return res.json({ result: false, error: "Utilisateur non trouvé" });
    }
  });
});

// route to get user's data
router.get("/:token", (req, res) => {
  Project.findOne({ token: req.params.token })
    .then((projectData) => {
      if (!projectData) {
        return res.json({ result: false, error: "Projet non trouvé" });
      } else {
        User.findOne({ _id: projectData.proprietaire[0] })
          .then((userData) => {
            if (!userData) {
              return res.json({
                result: false,
                error: "Utilisateur non trouvé",
              });
            }
            res.json({ result: true, user: userData });
          })
          .catch((error) => {
            res.json({
              result: false,
              error: "Erreur lors de la recherche de l'utilisateur",
            });
          });
      }
    })
    .catch((error) => {
      res.json({
        result: false,
        error: "Erreur lors de la recherche du projet",
      });
    });
});

//route invit
router.post("/invites/:tokenProject/:roles", async (req, res) => {
  const roles = ["lecteur", "editeur"];
  const bodyInfo = ["username", "password"];
  if (!checkBody(req.body, bodyInfo)) {
    return res.json({
      result: false,
      error: "Champs manquant ou mal renseigné",
    });
  }
  const hash = await bcrypt.hash(req.body.password, 10);

  try {
    const newUser = await new User({
      username: req.body.username,
      password: hash,
      token: uid2(32),
    });
    //save user invite
    await newUser.save();
    const inviteId = newUser._id;

    const project = await Project.findOne({ token: req.params.tokenProject });
    if (!project) {
      return res.json({
        result: false,
        error: "Projet non trouvé", // Si le projet n'existe pas
      });
    }

    if (req.params.roles === "lecteur") {
      await Project.updateOne(
        { token: req.params.tokenProject },
        { $push: { lecteur: inviteId } }
      );
      const data = {
        tokenProject: project.token,
        tokenUser: saveInvite.token,
        role: "lecteur",
      };
      res.json({
        result: true,
        message: "compte invite lecteur crée",
        data: data,
      });
    } else if (req.params.roles === "editeur") {
      await Project.updateOne(
        { token: req.params.tokenProject },
        { $push: { editeur: inviteId } }
      );
      const data2 = {
        tokenProject: project.token,
        TokenUser: saveInvite.token,
        role: "editeur",
      };
      res.json({
        result: true,
        message: "compte invité editeur crée",
        data: data2,
      });
    }
  } catch (error) {
    console.error(error);
    res.json({
      result: false,
      error: `Erreur lors de la création de l'invité: ${error.message}`, // Detailed error message
    });
  }
});

//route put to update an user
router.put("/:tokenProject/:tokenUser", async (req, res) => {
  // console.log("in the route");

  const { username, email, derniereMenstruation, dateDebutGrossesse } =
    req.body;
  // console.log({ username, email, derniereMenstruation, dateDebutGrossesse });

  if (!checkBody(req.body, ["username", "email"])) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }

  try {
    const { tokenProject, tokenUser } = req.params; // Récupération du token et de l'ID du propirétaire
    const project = await Project.findOne({ token: tokenProject });

    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    // Vérifie si l'utilisateur existe
    const user = await User.findOne({ token: tokenUser });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    await User.findByIdAndUpdate(
      user._id,
      // Met à jour le propriétaire à jour

      {
        username: username,
        email: email,
        derniereMenstruation: derniereMenstruation,
        dateDebutGrossesse: dateDebutGrossesse,
      }
    );

    res.json({
      result: true,
      message: "Utilisateur modifié avec succès",
      proprietaire: user,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

//route put to update password
router.put("/password/:tokenProject/:tokenUser", async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!checkBody(req.body, ["oldPassword", "newPassword"])) {
    // console.log("missing field");

    return res.json({ result: false, error: "Missing or empty fields" });
  }

  try {
    const { tokenProject, tokenUser } = req.params;
    const project = await Project.findOne({ token: tokenProject });
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    const user = await User.findOne({ token: tokenUser });
    // console.log("user:", user);
    if (!user) {
      return res
        .status(404)
        .json({ result: false, error: "Utilisateur non trouvé" });
    }

    // Vérifier si l'ancien mot de passe est correct
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ result: false, error: "Ancien mot de passe incorrect" });
    }

    // Hacher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe de l'utilisateur
    user.password = hashedPassword;
    await user.save();

    res.json({ result: true, message: "Mot de passe mis à jour avec succès" });
  } catch (error) {
    res
      .status(500)
      .json({ result: false, error: "Erreur serveur:" + error.message });
  }
});

module.exports = router;
