require("dotenv").config(); //;ENV LINK
require("./models/connection"); // FILE CONNECTION LINK

var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const fileUpload = require("express-fileupload");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/user");
var rdvsRouter = require("./routes/rdv");
var carnetbebeRouter = require("./routes/carnetbebe");
var documentRouter = require("./routes/document");

var app = express();

const cors = require("cors"); // CORS INSTALL
app.use(cors());

app.use(logger("dev"));
app.use(express.json());
app.use(fileUpload());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/user", usersRouter);
app.use("/rdv", rdvsRouter);
app.use("/carnetbebe", carnetbebeRouter);
app.use("/document", documentRouter);

module.exports = app;
