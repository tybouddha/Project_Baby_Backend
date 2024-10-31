# Project Baby Backend

![Project Baby Logo](/docs/images/logo128.png)

## Description

Project Baby est une application qui rassemblera une feuille de route des rendez-vous médicaux, un calendrier avec un agenda connecté afin de créer des rappels et un carnet pour noter les informations concernant l’enfant allant du début de grossesse jusqu’au 2ème anniversaire de l’enfant ainsi que des informations afin de rassurer les “jeunes” parents durant cette aventure...

## Installation

Suivez les étapes ci-dessous pour installer et configurer ce projet en local.

1. Clonez le dépôt :  
   Clonez le dépôt GitHub en utilisant la commande suivante :

```bash
git clone https://github.com/tybouddha/Project_Baby_Backend.git
```

2. Installez les dépendances :
   Assurez-vous que toutes les dépendances du projet sont installées en exécutant la commande suivante : `yarn install`
3. Lancez le serveur :
   Pour démarrer l’application en mode de développement, utilisez la commande suivante : `yarn start`
   - Le serveur devrait être accessible à l’adresse http://localhost:3000, ou à un autre port si vous l’avez configuré différemment.

## Configurer les variables d’environnement :

Créez un fichier .env dans le répertoire racine du projet et ajoutez les variables d’environnement nécessaires. Voici un exemple :

```env
DB_CONNECTION_STRING=mongodb+srv://<username>:<key>@cluster0.8puct.mongodb.net/project_baby
```

## Pile Technologique

Ce projet utilise les technologies suivantes :

- Express : Framework pour créer une API backend en Node.js.
- MongoDB et Mongoose : MongoDB est utilisé pour stocker les données, et Mongoose pour gérer les modèles et les opérations sur la base de données.
- dotenv : Permet de gérer les variables d'environnement de manière sécurisée.
- bcrypt : Utilisé pour hasher les mots de passe des utilisateurs et assurer une meilleure sécurité.
