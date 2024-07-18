require("dotenv").config();
const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.log("Unable to connect to the database:", err);
  });

// Define a "Theme" model
const Theme = sequelize.define(
  "Theme",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: Sequelize.STRING,
  },
  {
    createdAt: false, // disable createdAt
    updatedAt: false, // disable updatedAt
  }
);

// Define a "Set" model
const Set = sequelize.define(
  "Set",
  {
    set_num: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    name: Sequelize.STRING,
    year: Sequelize.INTEGER,
    theme_id: Sequelize.INTEGER,
    num_parts: Sequelize.INTEGER,
    img_url: Sequelize.STRING,
  },
  {
    createdAt: false, // disable createdAt
    updatedAt: false, // disable updatedAt
  }
);

// Define the relationship between the two models
Set.belongsTo(Theme, { foreignKey: "theme_id" });

// invoke sequelize.sync().  If sequelize.sync() resolves successfully,
// then we can resolve the returned Promise, otherwise reject the returned Promise with the error.
function initialize() {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getAllSets() {
  return new Promise((resolve, reject) => {
    Set.findAll({
      include: [
        {
          model: Theme,
          attributes: ["name"],
        },
      ],
    })
      .then((sets) => {
        resolve(sets);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getAllThemes() {
  return new Promise((resolve, reject) => {
    try {
      Theme.findAll().then((themes) => {
        resolve(themes);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function getSetByNum(setNum) {
  return new Promise((resolve, reject) => {
    try {
      Set.findOne({
        where: { set_num: setNum },
        include: [
          {
            model: Theme,
            attributes: ["name"],
          },
        ],
      }).then((set) => {
        resolve(set);
      });
    } catch (error) {
      reject("Unable to find requested set");
    }
  });
}

function getSetsByTheme(theme) {
  return new Promise((resolve, reject) => {
    Set.findAll({
      include: [
        {
          model: Theme,
          attributes: ["name"],
        },
      ],
      where: {
        "$Theme.name$": {
          [Sequelize.Op.iLike]: `%${theme}%`,
        },
      },
    })
      .then((sets) => {
        resolve(sets);
      })
      .catch((error) => {
        reject("Unable to find requested sets");
      });
  });
}

function addSet(set_num, name, year, theme_id, num_parts, img_url) {
  return new Promise((resolve, reject) => {
    Set.create({
      set_num: set_num,
      name: name,
      year: year,
      theme_id: theme_id,
      num_parts: num_parts,
      img_url: img_url,
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error.errors[0].message);
      });
  });
}

function editSet(set_num, setData) {
  return new Promise((resolve, reject) => {
    Set.update(setData, {
      where: {
        set_num: set_num,
      },
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error.errors[0].message);
      });
  });
}

function deleteSet(set_num) {
  return new Promise((resolve, reject) => {
    Set.destroy({
      where: {
        set_num: set_num,
      },
    })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error.errors[0].message);
      });
  });
}

module.exports = {
  initialize,
  getAllSets,
  getSetByNum,
  getSetsByTheme,
  getAllThemes,
  addSet,
  editSet,
  deleteSet,
};
