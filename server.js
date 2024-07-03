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
 *  Published URL: https://lego-mu-liart.vercel.app/
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
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/lego/sets", (req, res, next) => {
  let { theme } = req.query;
  if (theme) {
    legoData
      .getSetsByTheme(theme)
      .then((sets) => {
        if (sets.length === 0) {
          const err = new Error("No Sets found for a matching theme");
          err.status = 404;
          return next(err);
        }
        res.render("sets", { sets: sets });
      })
      .catch((err) => {
        next(err);
      });
  } else {
    legoData
      .getAllSets()
      .then((sets) => {
        res.render("sets", { sets: sets });
      })
      .catch((err) => {
        next(err);
      });
  }
});

app.get("/lego/sets/:num", (req, res, next) => {
  let { num } = req.params;
  legoData
    .getSetByNum(num)
    .then((set) => {
      if (!set) {
        const err = new Error("No Sets found for a specific set num");
        err.status = 404;
        next(err);
      } else {
        res.render("set", { set: set });
      }
    })
    .catch((err) => {
      next(err);
    });
});

app.use((req, res, next) => {
  const err = new Error("No view matched for a specific route ");
  err.status = 404;
  next(err);
});

// General error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render("404", {
    message: err.message || "An unexpected error occurred",
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
