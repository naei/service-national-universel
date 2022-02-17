require("dotenv").config({ path: "./.env-staging" });

const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const helmet = require("helmet");
const logger = require("morgan");
const passport = require("passport");
require("./mongo");

const { PORT, APP_URL, ADMIN_URL, SUPPORT_URL, KNOWLEDGEBASE_URL, ENVIRONMENT } = require("./config.js");

if (process.env.NODE_ENV !== "test") {
  console.log("APP_URL", APP_URL);
  console.log("ADMIN_URL", ADMIN_URL);
  console.log("SUPPORT_URL", SUPPORT_URL);
  console.log("KNOWLEDGEBASE_URL", KNOWLEDGEBASE_URL);
  console.log("ENVIRONMENT: ", ENVIRONMENT);
}

const app = express();
app.use(helmet());

if (ENVIRONMENT === "development") {
  app.use(logger("dev"));
}

const origin = [APP_URL, ADMIN_URL, SUPPORT_URL, KNOWLEDGEBASE_URL, "https://inscription.snu.gouv.fr"];

app.use(cors({ credentials: true, origin }));
app.use(bodyParser.json());
app.use(bodyParser.text({ type: "application/x-ndjson" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(fileUpload({ limits: { fileSize: 10 * 1024 * 1024 } })); // 10 Mo
app.use(express.static(__dirname + "/../public"));

app.use(passport.initialize());

app.use("/user", require("./controllers/user"));
// app.use("/ticket", require("./controllers/ticket"));
// app.use("/knowledge-base", require("./controllers/knowledgeBase"));

app.get("/", async (req, res) => {
  const d = new Date();
  res.status(200).send("SNU " + d.toLocaleString());
});

require("./passport")();

app.listen(PORT, () => console.log("Listening on port " + PORT));
