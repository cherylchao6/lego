require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define the schema
let Schema = mongoose.Schema;

let userSchema = new Schema({
  userName: {
    type: String,
    unique: true,
  },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

let User;

function initialize() {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(process.env.MONGO_URI);
    db.on("error", (err) => {
      reject(err); // reject the promise with the provided error
    });
    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
}

function registerUser(userData) {
  let { userName, userAgent, email, password, password2 } = userData;

  if (password !== password2) {
    return Promise.reject("Passwords do not match");
  }

  return bcrypt
    .hash(password, 10)
    .then((hash) => {
      // Hash the password using a Salt that was generated using 10 rounds
      let newUser = new User({
        userName,
        password: hash,
        email,
        loginHistory: [{ dateTime: new Date(), userAgent }],
      });

      return newUser.save();
    })
    .then(() => {
      console.log("User created");
      return Promise.resolve();
    })
    .catch((err) => {
      console.log(`Error creating user: ${err}`);
      if (err.code === 11000) {
        return Promise.reject("User Name already taken");
      } else {
        return Promise.reject(`There was an error creating the user: ${err}`);
      }
    });
}

function checkUser(userData) {
  let { userName, password, userAgent } = userData;

  return User.find({ userName })
    .exec()
    .then((users) => {
      if (users.length === 0) {
        return Promise.reject(`Unable to find user: ${userName}`);
      }

      return bcrypt.compare(password, users[0].password).then((result) => {
        if (!result) {
          return Promise.reject(`Invalid password for user: ${userName}`);
        }

        // update the login history
        // 8 is the maximum number of login history entries
        if (users[0].loginHistory.length === 8) {
          users[0].loginHistory.pop();
        }
        users[0].loginHistory.unshift({
          dateTime: new Date().toString(),
          userAgent,
        });

        return User.updateOne(
          { userName },
          { $set: { loginHistory: users[0].loginHistory } }
        )
          .exec()
          .then(() => {
            return users[0];
          })
          .catch((err) => {
            return Promise.reject(
              `There was an error verifying the user: ${err}`
            );
          });
      });
    })
    .catch((err) => {
      return Promise.reject(`Unable to find user: ${userName}`);
    });
}

module.exports = {
  initialize,
  registerUser,
  checkUser,
};
