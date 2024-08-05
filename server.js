/********************************************************************************
 *  WEB322 – Assignment 05
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: Tzu Han Chao Student ID: 151593225 Date: 2024.07.17
 *
 *  Published URL: https://lego-mu-liart.vercel.app/
 *
 ********************************************************************************/
const legoData = require("./modules/legoSets");
const authData = require("./modules/auth-service");

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const HTTP_PORT = 3000;

app.use(express.static(`${__dirname}/public`));
app.set("views", `${__dirname}/views`);
app.set("view engine", "ejs");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const clientSessions = require("client-sessions");
require("dotenv").config();
app.use(
  clientSessions({
    cookieName: "session",
    secret: process.env.SESSION_SECRET,
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60,
  })
);

// initialize the data service
legoData
  .initialize()
  .then(authData.initialize)
  .then(function () {
    app.listen(HTTP_PORT, function () {
      console.log(`app listening on: ${HTTP_PORT}`);
    });
  })
  .catch(function (err) {
    console.log(`unable to start server: ${err}`);
  });

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// auth routes
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/register", (req, res) => {
  res.render("register");
});
app.post("/register", (req, res) => {
  authData
    .registerUser(req.body)
    .then(() => {
      res.render("register", {
        successMessage: "User created",
      });
    })
    .catch((err) => {
      res.render("register", {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});
app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  authData
    .checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };
      res.redirect("/lego/sets");
    })
    .catch((err) => {
      res.render("login", {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});
app.get("/logout", ensureLogin, (req, res) => {
  req.session.reset();
  res.redirect("/");
});
app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory", { user: req.session.user });
});

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/lego/addSet", ensureLogin, (req, res) => {
  legoData
    .getAllThemes()
    .then((themes) => {
      res.render("addSet", { themes: themes });
    })
    .catch((err) => {
      next(err);
    });
});

app.get("/lego/editSet/:num", ensureLogin, (req, res) => {
  let { num } = req.params;
  legoData
    .getSetByNum(num)
    .then((set) => {
      if (!set) {
        res.render("404", { message: "No Sets found for a specific set num" });
      } else {
        legoData
          .getAllThemes()
          .then((themes) => {
            res.render("editSet", { set: set, themes: themes });
          })
          .catch((err) => {
            res.render("404", {
              message: "No Themes found for a specific set num",
            });
          });
      }
    })
    .catch((err) => {
      next(err);
    });
});

app.post("/lego/addSet", ensureLogin, (req, res) => {
  let { set_num, name, year, theme_id, num_parts, img_url } = req.body;
  legoData
    .addSet(set_num, name, year, theme_id, num_parts, img_url)
    .then(() => {
      res.redirect("/lego/sets");
    })
    .catch((err) => {
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
    });
});

app.post("/lego/editSet", ensureLogin, (req, res) => {
  let { set_num } = req.body;
  let setData = {
    name: req.body.name,
    year: req.body.year,
    theme_id: req.body.theme_id,
    num_parts: req.body.num_parts,
    img_url: req.body.img_url,
  };

  legoData
    .editSet(set_num, setData)
    .then(() => {
      res.redirect("/lego/sets");
    })
    .catch((err) => {
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
    });
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

app.get("/lego/deleteSet/:num", ensureLogin, (req, res) => {
  let { num } = req.params;
  legoData
    .deleteSet(num)
    .then(() => {
      res.redirect("/lego/sets");
    })
    .catch((err) => {
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
    });
});

app.use((req, res, next) => {
  const err = new Error("No view matched for a specific route ");
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render("404", {
    message: err.message || "An unexpected error occurred",
  });
});

// helper function to ensure the user is authenticated
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}
