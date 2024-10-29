var express = require('express');
var router = express.Router();
require('../models/connection');
const User = require('../models/user');
const { checkBody } = require('../modules/checkBody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');



//route signUp, check if is an invite
router.post('/signup/:source?/:role?', (req, res) => {
    const isInviteLink = req.params.source || null;
    const role = req.params.role || null;
    let bodyFields = ['prenom', 'nomDeFamille', 'email', 'username', 'password'];
    

// Check if role is 'lecteur' or 'editeur' with an invite link
    if (isInviteLink && role === null) {
        res.json({result: false, error: 'Vous avez un lien sans rôle attribué'})
    }
// check role
        if(isInviteLink){
        if (role === 'lecteur' || role === 'editeur') {
            //check if empty or misinformed fiel
            if (!checkBody(req.body, bodyFields)) {
                bodyFields = ['username', 'password']; // bodyField change depending on source
                //message in error case
                res.json({ result: false, error: 'Champs manquant ou mal renseigné' });
                return;
            }
            // check if user already exist
            User.findOne({ username: req.body.username }).then(data => {
                if (data === null) {
                    const hash = bcrypt.hashSync(req.body.password, 10);
                    const newUser = new User({
                        username: req.body.username,
                        password: hash,
                        token: uid2(32),
                        proprietaire: false,
                        role: role // Use the role from params
                    });
// save user
                    newUser.save().then(newUser => {
                        res.json({ result: true });
                    });
                } else {
//message in error case
                    res.json({ result: false, error: 'Utilisateur existe déjà!' });
                }
            });
            return; // Prevent further execution
        }
    }
// Handle case with no invite link and no role
    if (isInviteLink === null && role === null) {
//check if empty or misinformed fiel
        if (!checkBody(req.body, bodyFields)) {
//message in error case
            res.json({ result: false, error: 'Missing or empty fields' });
            return;
        }
        // Check if the user has not already been registered
        User.findOne({ username: req.body.username }).then(data => {
            if (data === null) {
                const hash = bcrypt.hashSync(req.body.password, 10);
                const derniereMenstruation = req.body.derniereMenstruation ? new Date(req.body.derniereMenstruation) : null;
                const dateDebutGrossesse = req.body.dateDeDebutGrossesse ? new Date(req.body.dateDeDebutGrossesse) : null;
                const regExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                const email = req.body.email;
//check if two date are completed
                if (derniereMenstruation && dateDebutGrossesse) {
                    return res.json({ result: false, error: "Les deux dates ne peuvent pas être fournies en même temps." });
                }
//check if email are in a good format
                if (!regExp.test(email)) {
                    return res.json({ result: false, error: "Ce n'est pas le bon format d'email." });
                }
//creat a new owner
                const newUser = new User({
                    prenom: req.body.prenom,
                    nomDeFamille: req.body.nomDeFamille,
                    username: req.body.username,
                    password: hash,
                    derniereMenstruation,
                    dateDebutGrossesse,
                    email,
                    token: uid2(32),
                    proprietaire : true,
                    role: null,
                });
//save new owner
                newUser.save().then(newUser => {
                    res.json({ result: true, token: newUser.token });
                });
            } else {
// User already exists in database
                res.json({ result: false, error: 'Utilisateur existe déjà!' });
            } 
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







