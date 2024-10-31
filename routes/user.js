var express = require("express");
var router = express.Router();
require("../models/connection");
const User = require("../models/user");
const Project = require("../models/project");
const Document = require("../models/document");
const CarnetBebe = require("../models/carnetBebe");
const Enfant = require("../models/enfant");
const Rdv = require("../models/rdv");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

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
      carnetBebe: req.body.carnetBebe || null,
      rdv: req.body.rdv || null,
      document: req.body.document || null,
      enfant: req.body.enfant || null,
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
    });
  } catch (err) {
    return res.json({ result: false, error: "Erreur interne du serveur." });
  }
});

// Route to generate invit link
router.post("/invite", async (req, res) => {
  const { projectId, role } = req.body;
  const validRoles = ["lecteur", "editeur"];

  if (!validRoles.includes(role)) {
    return res.json({
      result: false,
      error: "Le rôle doit être 'lecteur' ou 'editeur'.",
    });
  }

  try {
    // check if project already exist
    const project = await Project.findById(projectId);
    if (!project) {
      return res.json({ result: false, error: "Projet introuvable." });
    }

    // generate invit token
    const inviteToken = uid2(32);

    // add token and role to project
    //project.invitations.push({ token: inviteToken, role });
    //await project.save();

    const inviteLink = `${process.env.FRONTEND_URL}/signup/${inviteToken}`;
    console.log(inviteLink);

    // config nodemailer to send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // email option
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: req.body.email,
      subject: "Invitation au Projet Baby ",
      text: `Vous avez été invité à rejoindre le Projet Baby en tant que ${role}. Cliquez sur le lien suivant pour vous inscrire : ${inviteLink}`,
    };

    // email send
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.json({
          result: false,
          error: "Erreur lors de l'envoi de l'email d'invitation.",
        });
      } else {
        return res.json({ result: true, inviteLink, role });
      }
    });
  } catch (err) {
    return res.json({ result: false, error: "Erreur interne du serveur." });
  }
});

//route signup with invit
router.post("/signup/:invitToken", async (req, res) => {
  const { invitToken } = req.params;
  const bodyFields = ["username", "password"];

  try {
    // find project with the invit token
    const project = await Project.findOne({ "invitations.token": invitToken });
    if (!project) {
      return res.json({
        result: false,
        error: "Invitation invalide ou expirée.",
      });
    }

    // Retrieving the role associated with the token
    const invitation = project.invitations.find(
      (inv) => inv.token === invitToken
    );
    if (!invitation) {
      return res.json({
        result: false,
        error: "Le rôle associé à l'invitation est introuvable.",
      });
    }
    const role = invitation.role;

    // check if empty or misinformed fields
    if (!checkBody(req.body, bodyFields)) {
      return res.json({
        result: false,
        error: "Champs manquant ou mal renseigné",
      });
    }

    // check if user already exist
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.json({ result: false, error: "Utilisateur existe déjà!" });
    }

    // create new user
    const hash = bcrypt.hashSync(req.body.password, 10);
    const newUser = new User({
      username: req.body.username,
      password: hash,
      token: uid2(32),
    });
    const savedUser = await newUser.save();

    // add user in project property in function of role
    if (role === "lecteur") {
      if (!project.lecteurs.includes(savedUser._id)) {
        project.lecteurs.push(savedUser._id);
      } else {
        return res.json({
          result: false,
          error: "Cet utilisateur est déjà lecteur du projet.",
        });
      }
    } else if (role === "editeur") {
      if (!project.editeurs.includes(savedUser._id)) {
        project.editeurs.push(savedUser._id);
      } else {
        return res.json({
          result: false,
          error: "Cet utilisateur est déjà éditeur du projet.",
        });
      }
    }

    // save project change
    await project.save();

    return res.json({
      result: true,
      message: "Inscription réussie.",
      token: savedUser.token,
      role,
    });
  } catch (err) {
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

      // find project in the Project Collection
      Project.findOne({ proprietaire: user._id })
        .populate("proprietaire") // to show owner
        .then((project) => {
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
              "carnetBebe"
            ),
            Rdv.findOne({ rdv: project.rdv }).populate("rdv"),
            Document.findOne({ document: project.document }).populate(
              "document"
            ),
            Enfant.findOne({ document: project.enfant }).populate("enfant"),
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

            // Reponse s'addendu par Redux:
            // {user_token, project.id,username,prenom, documentsArr, carnetBebeArr, rdvArr}
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

router.get("/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((UserData) => {
    if (!UserData) {
      return res.json({ result: false, error: "Utilisateur non trouvé" });
    } else {
      res.json({ result: true, user: UserData });
    }
  });
});
router.post("/:token", (req, res) => {
  User.updateMany(
    { Username: `${Username}` },
    { email: `${email}`, dateDebutGrossesse: `${grossesse}` },
    { dateDebutGrossesse: `${grossesse}` },
    { derniereMenstruation: `${menstruation}` },
    { password: `${password2}` }
  ).then(() => {
    User.find().then((data) => {
      console.log(data);
    });
  });
});
module.exports = router;
