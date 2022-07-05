const axios = require("axios");
const childProcess = require("child_process");
const clientID = "ac09e028a8c511af62d2";
const clientSecret = "b205786aa8e3d83787b7e8e759fd341b3eebf4bf";
const fs = require("fs");

exports.callback = async (req, res) => {
  try {
    const requestToken = req.query.code;
    let response = await axios.post(
      `https://github.com/login/oauth/access_token?client_id=${clientID}&client_secret=${clientSecret}&code=${requestToken}`,
      {
        headers: {
          accept: "application/json",
        },
      }
    );
    let token = response.data
      .replace("access_token=", "")
      .replace("&scope=repo&token_type=bearer", "");
    console.log(token);
    let data = await axios.get(`https://api.github.com/user`, {
      headers: {
        Authorization: "token " + token,
      },
    });
    res.cookie("token", token);
    res.cookie("username", data.data.login);
    res.redirect("http://localhost:3000/dashboard");
  } catch (error) {
    // console.log(error);
    return res.status(500).json({
      message: "error token invalid",
    });
  }
};

exports.checktoken = async (req, res) => {
  try {
    let response = await axios.get("https://api.github.com/user/repos", {
      headers: {
        Authorization: "token " + req.params.token,
      },
    });
    if (response.data[0].id) {
      return res.status(200).json({
        message: "token still valid",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "error token invalid",
    });
  }
};

exports.repo = async (req, res) => {
  try {
    let response = await axios.get("https://api.github.com/user/repos", {
      headers: {
        Authorization: "token " + req.params.token,
      },
    });
    return res.status(200).json({
      data: response.data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "error token invalid",
    });
  }
};

exports.clone = async (req, res) => {
  try {
    let replaceRepo = req.body.repo.replace(
      `github.com/${req.body.usernameGithub}/`,
      ""
    );
    let nameRepo = replaceRepo.replace(".git", "").replace("-", "");
    let path = `upload/repos/${req.body.usernameGithub}/${replaceRepo}`;
    // check repo exist
    if (fs.existsSync(path)) {
      return res.status(500).json({
        message: "failed repo exist",
      });
    }
    // clone
    childProcess.execSync(
      `cd upload && git clone https://${req.body.usernameGithub}:${req.body.tokenGithub}@github.com/${req.body.usernameGithub}/${replaceRepo} repos/${req.body.usernameGithub}/${replaceRepo}`
    );
    // add dockerfile and github action
    if (req.body.service === "react") {
      // copy nginx conf React
      childProcess.execSync(
        `cp template/react/reactjstemplate/nginx.conf upload/repos/${req.body.usernameGithub}/${replaceRepo}`
      );
      // copy Dockerfile React
      childProcess.execSync(
        `cp template/react/reactjstemplate/Dockerfile upload/repos/${req.body.usernameGithub}/${replaceRepo}`
      );
      // make github workflows React
      childProcess.execSync(
        `cd upload/repos/${req.body.usernameGithub}/${replaceRepo} && mkdir .github && cd .github && mkdir workflows`
      );
      fs.readFile("template/github/main.yaml", "utf8", (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        let replaceDocker = data.replace(
          "jamstack/demo-react-jamstack",
          `jamstack/${nameRepo}`
        );
        fs.writeFile(
          `./upload/repos/${req.body.usernameGithub}/${replaceRepo}/.github/workflows/main.yaml`,
          replaceDocker,
          "utf-8",
          function (err) {
            console.log(err);
          }
        );
      });
    }
    // push to admin
    // await axios.post(
    //   "https://api.github.com/user/repos",
    //   {
    //     name: nameRepo,
    //   },
    //   {
    //     headers: {
    //       Authorization: "token ghp_MEVoGhQcdU5CCi4vM9JDOBtBO2cs51jgON7",
    //       "Content-Type": "application/x-www-form-urlencoded",
    //     },
    //   }
    // );
    // childProcess.execSync(
    //   `cd upload/repos/${req.body.usernameGithub}/${replaceRepo} && rm -rf .git && git init && git add . && git commit -m "first commit" && git branch -M main && git remote add origin https://github.com/DevKayangan/${nameRepo} && git remote set-url origin https://DevKayangan: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@github.com/DevKayangan/${nameRepo} && git push --set-upstream origin main`
    // );
    // let counter = setInterval(async () => {
    //   console.log("onprogress");
    // res.status(200).json({
    //   nameApp: `${nameRepo}`,
    //   message: "onprogress",
    // });
    //   let dataWorkflows = await axios.get(
    //     `https://api.github.com/repos/DevKayangan/${nameRepo}/actions/runs`,
    //     {
    //       headers: {
    //         Authorization: "token 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",
    //         Accept: "application/vnd.github.v3+json",
    //       },
    //     }
    //   );
    //   if (dataWorkflows.data.workflow_runs[0].status === "completed") {
    //     console.log("completed");
    //     clearInterval(counter);
    //     return res.status(200).json({
    //       nameApp: `${nameRepo}`,
    //       message: "completed",
    //     });
    //   }
    // }, 10000);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "error",
    });
  }
};

exports.template = async (req, res) => {
  try {
    let rand = Math.floor(Math.random() * 100);
    let nameRepo =
      req.body.usernameGithub +
      "-" +
      req.body.nameApp +
      "-reactjs-" +
      String(rand);
    if (req.body.service === "React.js") {
      fs.readFile("template/github/main.yaml", "utf8", (err, data) => {
        if (err) {
          console.log(err);
        }
        let replaceDocker = data.replace(
          "jamstack/demo-react-jamstack",
          `jamstack/${nameRepo.toLowerCase()}`
        );
        fs.writeFile(
          `template/react/reactjstemplate/.github/workflows/main.yaml`,
          replaceDocker,
          "utf-8",
          function (err) {
            console.log(err);
          }
        );
      });
      // push admin from template
      // await axios.post(
      //   "https://api.github.com/user/repos",
      //   {
      //     name: nameRepo,
      //     private: true,
      //   },
      //   {
      //     headers: {
      //       Authorization: "token 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",
      //       "Content-Type": "application/x-www-form-urlencoded",
      //     },
      //   }
      // );
      // childProcess.execSync(
      //   `cd template/react/reactjstemplate && git init && git add . && git commit -m "first commit" && git branch -M main && git remote add origin https://github.com/DevKayangan/${nameRepo} && git remote set-url origin https://DevKayangan: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@github.com/DevKayangan/${nameRepo} && git push --set-upstream origin main && rm -rf .git`
      // );
      // push user from template
      await axios.post(
        "https://api.github.com/user/repos",
        {
          name: nameRepo,
        },
        {
          headers: {
            Authorization: `token ${req.body.tokenGithub}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      childProcess.execSync(
        `cd template/react/reactjstemplate && git init && git add . && git reset -- .github/* Dockerfile nginx.conf && git commit -m "first commit" && git branch -M main && git remote add origin https://github.com/${req.body.usernameGithub}/${nameRepo} && git remote set-url origin https://${req.body.usernameGithub}:${req.body.tokenGithub}@github.com/${req.body.usernameGithub}/${nameRepo} && git push --set-upstream origin main && rm -rf .git && cd .github && cd workflows && rm -rf main.yaml`
      );
      // check build success or not
      // let counter = setInterval(async () => {
      //   console.log("onprogress");
      //   // res.status(200).json({
      //   //   nameApp: `${nameRepo}`,
      //   //   message: "onprogress",
      //   // });
      //   let dataWorkflows = await axios.get(
      //     `https://api.github.com/repos/DevKayangan/${nameRepo}/actions/runs`,
      //     {
      //       headers: {
      //         Authorization: "token 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",
      //         Accept: "application/vnd.github.v3+json",
      //       },
      //     }
      //   );
      //   if (dataWorkflows.data.workflow_runs[0].status === "completed") {
      //     console.log("completed");
      //     clearInterval(counter);
      //     return res.status(200).json({
      //       nameApp: `${nameRepo}`,
      //       message: "completed",
      //     });
      //   }
      // }, 10000);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "error",
    });
  }
};

exports.deployKubernetes = async (req, res) => {
  try {
    let deploy = await axios.post(
      "https://rancher-holywings.carakan.id/k8s/clusters/c-m-7cslml8q/apis/apps/v1/namespaces/jamstack-dev/deployments",
      {
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: {
          namespace: "jamstack-dev",
          name: `${req.body.nameApp.toLowerCase()}`,
        },
        spec: {
          selector: {
            matchLabels: {
              run: `${req.body.nameApp.toLowerCase()}`,
            },
          },
          replicas: 1,
          template: {
            metadata: {
              labels: {
                run: `${req.body.nameApp.toLowerCase()}`,
              },
            },
            spec: {
              containers: [
                {
                  name: `${req.body.nameApp.toLowerCase()}`,
                  image: `registry.carakan.id/jamstack/${req.body.nameApp.toLowerCase()}:latest`,
                  ports: [
                    {
                      containerPort: 80,
                    },
                  ],
                },
              ],
              imagePullSecrets: [
                {
                  name: "registry-carakan",
                },
              ],
            },
          },
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer kubeconfig-user-z6mbjpkbhs:4cbv59prrbp4xvvn458rnxrz8bg95vfk9vmlb96spnh57ztxllx7ws",
        },
      }
    );
    return res.status(200).json({
      message: "success",
      status: deploy.status,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "error",
    });
  }
};

exports.localKubernetes = async (req, res) => {
  try {
    let local = await axios.post(
      "https://rancher-holywings.carakan.id/k8s/clusters/c-m-7cslml8q/api/v1/namespaces/jamstack-dev/services",
      {
        apiVersion: "v1",
        kind: "Service",
        metadata: {
          namespace: "jamstack-dev",
          name: `${req.body.nameApp.toLowerCase()}-service`,
        },
        spec: {
          selector: {
            run: `${req.body.nameApp.toLowerCase()}`,
          },
          ports: [
            {
              port: 80,
            },
          ],
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer kubeconfig-user-z6mbjpkbhs:4cbv59prrbp4xvvn458rnxrz8bg95vfk9vmlb96spnh57ztxllx7ws",
        },
      }
    );
    return res.status(200).json({
      message: "success",
      status: local.status,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "error",
    });
  }
};

exports.ingressKubernetes = async (req, res) => {
  try {
    let ingress = await axios.post(
      "https://rancher-holywings.carakan.id/k8s/clusters/c-m-7cslml8q/apis/networking.k8s.io/v1/namespaces/jamstack-dev/ingresses",
      {
        apiVersion: "networking.k8s.io/v1",
        kind: "Ingress",
        metadata: {
          name: `${req.body.nameApp.toLowerCase()}-ingress`,
        },
        spec: {
          tls: [
            {
              hosts: [`${req.body.nameApp.toLowerCase()}.khayangan.id`],
              secretName: "wildcard-ssl-khayangan-id",
            },
          ],
          rules: [
            {
              host: `${req.body.nameApp.toLowerCase()}.khayangan.id`,
              http: {
                paths: [
                  {
                    path: "/",
                    pathType: "Prefix",
                    backend: {
                      service: {
                        name: `${req.body.nameApp.toLowerCase()}-service`,
                        port: {
                          number: 80,
                        },
                      },
                    },
                  },
                ],
              },
            },
          ],
          ingressClassName: "nginx",
        },
      },
      {
        headers: {
          Authorization:
            "Bearer kubeconfig-user-z6mbjpkbhs:4cbv59prrbp4xvvn458rnxrz8bg95vfk9vmlb96spnh57ztxllx7ws",
          "Content-Type": "application/json",
        },
      }
    );
    return res.status(200).json({
      message: "success",
      status: ingress.status,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "error",
    });
  }
};

exports.cloudflareAdd = async (req, res) => {
  try {
    let addCloudflare = await axios.post(
      "https://api.cloudflare.com/client/v4/zones/d03cd6fa54af5f936ba9dac1e275d958/dns_records",
      {
        type: "A",
        name: `${req.body.nameApp.toLowerCase()}.khayangan.id`,
        content: "10.10.28.205",
        ttl: 3600,
        priority: 10,
        proxied: false,
      },
      {
        headers: {
          Authorization: "Bearer 9aCTjjCy28fF22G0jxxciVBMuoZ_PFPd1Lm3r12Z",
          "Content-Type": "application/json",
        },
      }
    );
    console.log(addCloudflare);
    return res.status(200).json({
      message: "success",
      url: addCloudflare.data.result.name,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "error",
    });
  }
};
