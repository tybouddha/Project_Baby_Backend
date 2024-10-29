var express = require('express');
var router = express.Router();
require('../models/connection');
const User = require('../models/user');
const Project = require('../models/project')
const Document = require('../models/document');
const CarnetBebe = require('../models/carnetBebe');
const Enfant = require('../models/enfant');
const Rdv = require('../models/rdv');
const { checkBody } = require('../modules/checkBody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');



//route signUp, check if is an invite
router.post('/signup/:source?', async (req, res) => {
    const isInviteLink = req.params.source || null;
    let bodyFields = ['prenom', 'nomDeFamille', 'email', 'username', 'password'];

    try {
        // check if invite exist
        if (isInviteLink) {
            bodyFields = ['username', 'password'];

            // check required fields
            if (!checkBody(req.body, bodyFields)) {
                return res.json({ result: false, error: 'Champs manquant ou mal renseigné' });
            }

            // check if user already exists
            const existingUser = await User.findOne({ username: req.body.username });
            if (!existingUser) {
                const hash = bcrypt.hashSync(req.body.password, 10);
                const newUser = new User({
                    username: req.body.username,
                    password: hash,
                    token: uid2(32),
                });

                // save user
                await newUser.save();
                return res.json({ result: true, token: newUser.token });
            } else {
                return res.json({ result: false, error: 'Utilisateur existe déjà!' });
            }
        }

        // case not invite link
        if (isInviteLink === null) {
            // check required fields
            if (!checkBody(req.body, bodyFields)) {
                return res.json({ result: false, error: 'Champs manquant ou mal renseigné' });
            }

            // check if user already exists
            const existingUser = await User.findOne({ username: req.body.username });
            if (!existingUser) {
                const hash = bcrypt.hashSync(req.body.password, 10);
                const derniereMenstruation = req.body.derniereMenstruation ? new Date(req.body.derniereMenstruation) : null;
                const dateDebutGrossesse = req.body.dateDeDebutGrossesse ? new Date(req.body.dateDeDebutGrossesse) : null;
                const regExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                const email = req.body.email;

                // check if two dates are provided at the same time
                if (derniereMenstruation && dateDebutGrossesse) {
                    return res.json({ result: false, error: "Les deux dates ne peuvent pas être fournies en même temps." });
                }

                // check email format
                if (!regExp.test(email)) {
                    return res.json({ result: false, error: "Ce n'est pas le bon format d'email." });
                }

                // Create new user
                const newUser = new User({
                    prenom: req.body.prenom,
                    nomDeFamille: req.body.nomDeFamille,
                    username: req.body.username,
                    password: hash,
                    derniereMenstruation,
                    dateDebutGrossesse,
                    email,
                    token: uid2(32),
                });

                // save user
                const savedUser = await newUser.save();

                // Create new project
                const newProject = new Project({ proprietaire: savedUser._id });
                const savedProject = await newProject.save();

                return res.json({ result: true, newProject: savedProject, token: newUser.token, newUser: newUser });
            } else {
                return res.json({ result: false, error: 'Utilisateur existe déjà!' });
            }
        }

    } catch (err) {
        return res.json({ result: false, error: 'Erreur interne du serveur.' });
    }
});



//route signIn to log in ,retake all project 's data 
router.post('/signin', (req, res) => {
    // check require fields
    if (!checkBody(req.body, ['username', 'password'])) {
        return res.json({ result: false, error: 'Missing or empty fields' });
    }

    // find user with the username in User collection
    User.findOne({ username: req.body.username })
        .then(user => {
            if (!user) {
                return res.json({ result: false, error: 'Utilisateur non trouvé' });
            }

            // check password
            if (!bcrypt.compareSync(req.body.password, user.password)) {
                return res.json({ result: false, error: 'Mot de passe erroné' });
            }

            // find project in the Project Collection
            Project.findOne({ proprietaire: user._id })
                .populate('proprietaire') // to show owner
                .then(project => {
                    if (!project) {
                        return res.json({ result: false, error: 'Aucun projet trouvé' });
                    }

                    const responseData = {
                        result: true,
                        data: project,
                        editeurLecteur: project.editeurLecteur,
                        lecteur: project.lecteur,
                    };

                    // find all information of the project in differents collections
                    return Promise.all([
                        CarnetBebe.findOne({ carnetBebe: project.carnetBebe }).populate('carnetBebe'),
                        Rdv.findOne({ rdv: project.rdv }).populate('rdv'),
                        Document.findOne({ document: project.document }).populate('document'),
                        Enfant.findOne({ document: project.enfant }).populate('enfant')
                    ])
                    .then(([carnetBebeData, rdvData, documentData, enfantData]) => {
                        responseData.carnetBebeArr = carnetBebeData ? carnetBebeData.carnetBebe : [];
                        responseData.rdvArr = rdvData ? rdvData.rdv : [];
                        responseData.documentArr = documentData ? documentData.document : [];
                        responseData.enfantArr = enfantData ? enfantData.enfant : [];

                        res.json(responseData);
                    });
                })
                .catch(error => {
                    console.error(error);
                    res.json({ result: false, error: 'Erreur lors de la recherche du projet' });
                });
        })
        .catch(error => {
            console.error(error);
            res.json({ result: false, error: 'Erreur lors de la recherche de l\'utilisateur' });
        });
});



//route to delete an user (not owner of project)
router.delete("/delete", (req, res) => {

    User.findOne({ username: req.body.username }).then((userFound) => {
        if (userFound) {
            User.deleteOne({ username: req.body.username }).then((userDeleted) => {
                return res.json({ result: true })
            })
        } else {
            return res.json({ result: false, error: "Utilisateur non trouvé" })
        }
    })
})



module.exports = router;







