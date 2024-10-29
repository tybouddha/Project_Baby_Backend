var express = require('express');
var router = express.Router();
require('../models/connection');
const User = require('../models/user');
const Project = require('../models/project')
const { checkBody } = require('../modules/checkBody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');



//route signUp, check if is an invite
router.post('/signup/:source?', (req, res) => {
    const isInviteLink = req.params.source || null;
    let bodyFields = ['prenom', 'nomDeFamille', 'email', 'username', 'password'];
    // check if invite exist
    if (isInviteLink) {
        bodyFields = ['username', 'password']; 
        // check require fields
        if (!checkBody(req.body, bodyFields)) {
            return res.json({ result: false, error: 'Champs manquant ou mal renseigné' });
        }
        // check if user already exist
        User.findOne({ username: req.body.username }).then(data => {
            if (data === null) {
                const hash = bcrypt.hashSync(req.body.password, 10);
                const newUser = new User({
                    username: req.body.username,
                    password: hash,
                    token: uid2(32),
                });
                // user save
                newUser.save().then(newUser => {
                    return res.json({ result: true, token: newUser.token });
                });
            } else {
                // erro if user already exist
                return res.json({ result: false, error: 'Utilisateur existe déjà!' });
            }
        }).catch(err => {
            return res.json({ result: false, error: 'Erreur interne du serveur.' });
        });
        return;
    }
    // case not invit link
    if (isInviteLink === null) {
        // check require fields
        if (!checkBody(req.body, bodyFields)) {
            return res.json({ result: false, error: 'Champs manquant ou mal renseigné' });
        }
        // check if user already exist
        User.findOne({ username: req.body.username }).then(data => {
            if (data === null) {
                const hash = bcrypt.hashSync(req.body.password, 10);
                const derniereMenstruation = req.body.derniereMenstruation ? new Date(req.body.derniereMenstruation) : null;
                const dateDebutGrossesse = req.body.dateDeDebutGrossesse ? new Date(req.body.dateDeDebutGrossesse) : null;
                const regExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                const email = req.body.email;
                // check if two date is informed in same time
                if (derniereMenstruation && dateDebutGrossesse) {
                    return res.json({ result: false, error: "Les deux dates ne peuvent pas être fournies en même temps." });
                }
                // check format email
                if (!regExp.test(email)) {
                    return res.json({ result: false, error: "Ce n'est pas le bon format d'email." });
                }
                // Crate new user
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
                newUser.save()
                .then(newUser => {
                        const newProject = new Project({ proprietaire: newUser._id});
                        newProject.save()
                        .then(newProject =>{
                            return res.json({result : true, newProject})
                        })

                    })
            } else {
                // check if user already exist
                return res.json({ result: false, error: 'Utilisateur existe déjà!' });
            }
        }).catch(err => {
            return res.json({ result: false, error: 'Erreur interne du serveur.' });
        });
    }
});


//route signIn to log in ,retake all project 's data 
router.post('/signin', (req, res) => {
//to check if field correctly completed
    if (!checkBody(req.body, ['username', 'password'])) {
        res.json({ result: false, error: 'Missing or empty fields' });
        return;
    }
    User.findOne({ username: req.body.username }).then(data => {
        if (data && bcrypt.compareSync(req.body.password, data.password)) {
        res.json({ result: true, token: data.token });
        } else {
        res.json({ result: false, error: 'Utilisateur non trouvé ou mot de passe erroné' });
        }
    });
});


//route to delete an user (not owner of project)
router.delete("/delete", (req, res) => {

User.findOne({username: req.body.username}).then((userFound) => {
    if (userFound) {
        User.deleteOne({username: req.body.username }).then((userDeleted) => {
            return res.json({ result: true })
        })
    } else {
        return res.json({ result: false, error: "Utilisateur non trouvé" })
    }
})
})






module.exports = router;







