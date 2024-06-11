const setData = require("../data/setData.json");
const themData = require("../data/themeData.json");

let sets = [];

function initialize() {
  return new Promise((resolve, reject) => {
    try {
      setData.map((set) => {
        let theme = themData.find((theme) => theme.id === set.theme_id);
        sets.push({
          set_num: set.set_num,
          name: set.name,
          year: set.year,
          theme_id: set.theme_id,
          num_parts: set.num_parts,
          theme: theme.name,
        });
      });

      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function getAllSets() {
  return new Promise((resolve, reject) => {
    try {
      resolve(sets);
    } catch (error) {
      reject(error);
    }
  });
}

function getSetByNum(setNum) {
  return new Promise((resolve, reject) => {
    try {
      resolve(sets.find((set) => set.set_num === setNum));
    } catch (error) {
      reject(error);
    }
  });
}

function getSetsByTheme(theme) {
  return new Promise((resolve, reject) => {
    try {
      resolve(
        sets.filter((set) => set.theme.toUpperCase() === theme.toUpperCase())
      );
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme };
