const checkBody = (object) => {
    for (const element in object) {
        if (object[element] || object[element] != "") {
            return true
        } else {
            return false
        }
    }
}

module.exports = { checkBody } // Exports the function globally