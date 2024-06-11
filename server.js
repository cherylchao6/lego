/********************************************************************************
 *  WEB322 – Assignment 03
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: Tzu Han Chao Student ID: 151593225 Date: 2024.06.20
 *
 *  Published URL: ___________________________________________________________
 *
 ********************************************************************************/

const legoData = require("./modules/legoSets");
const path = require("path");

legoData
  .initialize()
  .then(() => {
    console.log("Lego data initialized");
  })
  .catch((err) => {
    throw new Error(err);
  });

const express = require("express");
const app = express();
const port = 3000;
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/home.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/about.html"));
});

app.get("/lego/sets", (req, res) => {
  let { theme } = req.query;
  if (theme) {
    console.log(theme);
    legoData
      .getSetsByTheme(theme)
      .then((sets) => {
        res.send(sets);
      })
      .catch((err) => {
        res.status(404).send("Theme not found");
      });
  } else {
    legoData
      .getAllSets()
      .then((sets) => {
        res.send(sets);
      })
      .catch((err) => {
        res.status(404).send("Sets not found");
      });
  }
});

app.get("/lego/sets/:num", (req, res) => {
  let { num } = req.params;
  legoData
    .getSetByNum(num)
    .then((set) => {
      console.log(set);
      res.send(set);
    })
    .catch((err) => {
      res.status(404).send("Set not found");
      throw new Error(err);
    });
});

app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, "/views/404.html"));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
