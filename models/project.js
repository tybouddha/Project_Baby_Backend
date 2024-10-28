const mongoose = require("mongoose");



const projectSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
})

const Project = mongoose.model("projects", userSchema)

module.exports = Project