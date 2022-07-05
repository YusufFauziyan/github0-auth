const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const {
  callback,
  repo,
  clone,
  checktoken,
  template,
  deployKubernetes,
  localKubernetes,
  ingressKubernetes,
  cloudflareAdd,
} = require("./controller/github");
const cors = require("cors");

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.set("view engine", "ejs");
app.get("/", (req, res) => {
  res.render("pages/index");
});
app.get("/github/callback", callback);
app.get("/user/repo/:token", repo);
app.get("/user/check/token/:token", checktoken);
app.post("/user/import", clone);
app.post("/user/template", template);
app.post("/user/deploy/kubernetes", deployKubernetes);
app.post("/user/local/kubernetes", localKubernetes);
app.post("/user/ingress/kubernetes", ingressKubernetes);
app.post("/user/deploy", cloudflareAdd);

const port = 9000;
app.listen(port, () => console.log("App listening on port " + port));
