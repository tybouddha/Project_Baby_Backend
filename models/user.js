const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  prenom: String,
  nomDeFamille: String,
  username: String,
  derniereMenstruation: String || Boolean,
  dateDebutGrossesse: String || Boolean,
  email: String,
  password: String,
  token: String,
});

const User = mongoose.model("users", userSchema);

module.exports = User;
