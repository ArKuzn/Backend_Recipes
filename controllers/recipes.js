var rimraf = require("rimraf");
var multer = require("multer");
var fs = require("fs");
const db = require("../models");
const jwt = require("jsonwebtoken");
const jwtsecret = "mysecretkey";
const hash = require("object-hash");
const rn = require("random-number");
const recipeCtrl = require("../controllers/recipes");
const AuthMiddl = require("../middlewares/Authentication");
var dir;
let currentId = 0;
let fileid = 0;
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
var hashFolder = hash(rn());
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let rec = `uploads/${hashFolder}`;
    if (!fs.existsSync(rec)) {
      fs.mkdirSync(rec);
    }
    cb(null, `uploads/${hashFolder}`);
  },
  filename: function (req, file, cb) {
    cb(null, `${(fileid = +fileid + 1)}` + ".jpg");
  }
});

const recipeAddFavorites = function (req, res, next) {
  //add to favorite recipe AuthRecipe
  console.log(`token id is ${req.body.tokenId}`);
  db.users
    .findByPk(req.body.tokenId)
    .then(user => {
      console.log(`this is user ${user}`);

      if (!user) {
        return res.status(404).json({ msg: "user not found", error: true });
      }
      let { favorites } = user;
      console.log(`favorites before ${favorites}`);
      for (let recipeId in favorites) {
        if (favorites[recipeId] == req.params.id) {
          favorites.splice(recipeId, 1);
          return updateFavorites(favorites, req, res);
        }
      }
      favorites.push(req.params.id);
      return updateFavorites(favorites, req, res);
    })
    .catch(error => {
      console.log(error);
      return res.status(500).json({ msg: error.message, error: true });
    });
};
const updateFavorites = function (favorites, req, res) {
  db.users
    .update({ favorites: favorites }, { where: { id: req.body.tokenId } })
    .then(user => {
      console.log(user);
      if (user > 0) {
        return res.status(200).json({
          msg: "Recipe added to your favorites recipes",
          error: false
        });
      }
      return res.status(500).json({ msg: "Update error", error: true });
    });
};

const recipeCreate = async function (req, res, next) {
  //create
  fileid = 0;
  debugger;
  if (!req.body.ingredients) {
    return res.status(400).json({ msg: "request haven't ingredients" });
  }
  let ingredients = req.body.ingredients.split("|");
  if (!req.body.steps) {
    return res.status(400).json({ msg: "request haven't steps" });
  }
  let steps = [];
  steps = req.body.steps.split("|");
  let imgs = [];
  for (let i in req.files.images) {
    imgs.push(`uploads/${hashFolder}/${+i + 1}.jpg`);
  }

  let ImagesforSteps = [];
  for (let stepImageIndex in req.files.stepsimages) {
    ImagesforSteps.push(
      `uploads/${hashFolder}/${
      +stepImageIndex + req.files.images ? +req.files.images.length : 0 + 1
      }.jpg`
    );
  }
  let DBingredientsIds = [];
  const getIingredientsListIds = ingredients.map(item => {
    return db.ingredients
      .findOrCreate({ where: { title: item } })
      .then(ingredient => {
        return ingredient[0].id;
      })
      .catch(error => {
        console.log(error);
        return res.status(500).json({ msg: error.message, error: true });
      });
  });
  const ingredientsListIds = await Promise.all(getIingredientsListIds);
  ingredientsListIds.forEach(id => {
    DBingredientsIds.push(id);
  });

  let recipeId;
  debugger;
  await db.recipes
    .create({
      title: req.body.title,
      ingredients: ingredients,
      steps: steps,
      images: imgs.length > 0 ? imgs : ["uploads/default/image.png"],
      calories: req.body.calories || 0,
      difficult: !req.body.difficult
        ? 1
        : req.body.difficult > 5
          ? 5
          : req.body.difficult < 1
            ? 1
            : req.body.difficult,
      time: req.body.time,
      duration: req.body.duration || 1,
      author: req.body.author
    })
    .then(rec => {
      recipeId = rec.id;
    })
    .catch(error => {
      console.log(error);
      return res.status(500).json({ msg: error.message, error: true });
    });

  steps.map((step, index) => {
    db.steps
      .create({
        recipe_id: recipeId,
        index: index,
        text: step,
        image: ImagesforSteps[index] || "uploads/default/image.png"
      })
      .catch(error => {
        console.log(error);
        return res.status(500).json({ msg: error.message, error: true });
      });
  });

  for (ingredientId of DBingredientsIds) {
    db.ingredientsrecipes
      .create({ recipe_id: recipeId, ingredient_id: ingredientId })
      .catch(err => console.log("create error", err));
  }
  hashFolder = hash(rn());
  return res.status(200).json({ msg: "recipe created", error: false });
};

const filter = async function (req, res) {
  let duration = req.query.duration || "1-999";
  duration = duration.split("-");
  let ingredients = req.query.ingredients || "";
  let direction = req.query.direction || "ASC";
  let order_field = req.query.order_field || "title";
  ingredientsSearchObj = {};

  if (ingredients.split("-").length > 1) {
    ingredientsSearchObj.title = ingredients.split("-");
  } else {
    if (ingredients.length > 0) {
      ingredientsSearchObj.title = ingredients;
    }
  }
  try {
    const recipes = await db.recipes.findAll({
      where: {
        duration: {
          [Op.between]: [+duration[0], +duration[1]]
        }
      },
      include: [
        {
          model: db.ingredients,
          as: "ingredientsTable",
          where: ingredientsSearchObj
        },
        {
          model: db.steps,
          as: "stepItem"
          // order: [['index', 'ASC']]
        }
      ],
      order: [[order_field, direction]]
    });
    return recipes;
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error.message, error: true });
  }
};
const recipeFilter = async function (req, res, next) {
  //show all filtred recipes
  let result = await filter(req, res);
  return res.send(result);
};

const recipeShow = function (req, res, next) {
  //show recipe
  db.recipes
    .findOne({
      where: { id: req.params.id },
      include: [
        {
          model: db.steps,
          as: "stepItem"
          // order: [['index', 'ASC']]
        },
        {
          model: db.ingredients,
          as: "ingredientsTable"
        }
      ]
    })
    .then(recipe => {
      if (recipe) {
        return res.json(recipe);
      }
      return res.status(404).json({ msg: "recipe not found", error: true });
    })
    .catch(error => {
      res.status(500).json({ msg: error, error: true });
    });
};

const recipeDel = async function (req, res, next) {
  //delete
  let folder;
  try {
    let recipe = await db.recipes
      .findOne({
        where: { id: req.params.id },
        include: [
          {
            model: db.steps,
            as: "stepItem"
          },
          {
            model: db.ingredients,
            as: "ingredientsTable",
            include: [{ model: db.recipes }]
          }
        ]
      })
      .catch(err => {
        res.status(404).json({ msg: "Recipe not found", error: true });
      });
    if (!recipe) {
      return res.status(404).json({ msg: "Recipe not found", error: true });
    }
    if (recipe.author != req.body.tokenId) {
      return res.status(401).json({ msg: "Access error", error: true });
    }
    console.log(recipe.images[0].split("/")[1]);
    // let test = recipe.images[0].split("/");
    folder =
      recipe.images[0].split("/")[1] == "default"
        ? null
        : recipe.images[0].split("/")[1];
    // let ingredients = await recipe.getIngredientsTable();
    let ingredients = recipe.ingredientsTable;
    await recipe.destroy({});
    console.log(`this is folder will be deleted ${folder}`);
    rimraf.sync(`./uploads/${folder}`);

    await ingredients.map((ingredient, index) => {
      if (ingredient.recipes.length > 1) {
        return console.log("ingredient has a recipe");
      } else {
        return ingredient.destroy({});
      }
    });
    return res.status(200).json({ msg: "recipe deleted", error: false });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: error, error: true });
  }
};

const recipeIngredients = function (req, res, next) {
  //get ingredients
  db.ingredients.findAll({}).then(recipes => {
    return res.status(200).json({ recipes });
  });
};
// const testing = async function (recipe) {
//   await recipe.setIngredientsTable([])
//   console.log(recipe)
// }
const recipeUpdate = async function (req, res, next) {
  //update recipe

  let idRecipe = req.params.id;
  const recipe = await db.recipes
    .findOne({
      where: {
        id: req.params.id
      },
      include: [
        {
          model: db.steps,
          as: "stepItem",
          where: {
            // "recipe_id": req.params.id
          }
          // order: [['index', 'DESC']]
        },
        {
          model: db.ingredients,
          as: "ingredientsTable"
        }
      ]
    })
    .catch(error => {
      console.log(error);
    });
  console.log(recipe);
  console.log(req);

  //update ingredients
  let ingredients = req.body.ingredients.split("|").map(ingredient => {
    return db.ingredients
      .findOrCreate({
        where: {
          title: ingredient
        }
      })
      .then(DBingredient => {
        return DBingredient[0].id;
      })
    // .catch(err => {
    //   errorArray.push(err)
    //   return null
    // });
  });
  const ingredientListIds = await Promise.all(ingredients);
  // [1, null, 3, 4, null]
  recipe.setIngredientsTable(ingredientListIds);

  //update steps

  //get new step images
  let newimagesStep = [];
  for (let fileId in req.files.stepsimages) {
    newimagesStep[req.body.ImageNumber[fileId]] =
      req.files.stepsimages[fileId].path;
  }
  //get old step images
  let oldImages = req.body.steps.split("|").map((step, id) => {
    return db.steps
      .findOne({
        //find old step
        where: {
          [Op.and]: [{ recipe_id: req.params.id }, { index: id }]
        }
      })
      .then(DBstep => {
        try {
          return DBstep.image;
        } catch {
          return "uploads/default/image.png";
        }
      });
  });
  const oldImagesList = await Promise.all(oldImages);
  let steps = req.body.steps.split("|").map((step, id) => {
    return db.steps
      .findOrCreate({
        where: {
          [Op.and]: [
            { text: step },
            { index: id },
            { image: newimagesStep[id] || oldImagesList[id] }
          ]
        },
        defaults: {
          text: step,
          index: id,
          image: newimagesStep[id] || oldImagesList[id]
        }
      })
      .then(DBstep => {
        return DBstep[0].id;
      });
  });
  const stepListIds = (await Promise.all(steps)) || [];
  recipe.setStepItem(stepListIds);
  //update images
  const images = await db.recipes.findByPk(req.params.id);
  let newImages = images.images;
  for (let newimageId in req.files.images) {
    newImages.push(req.files.images[newimageId].path);
  }
  let updateObj = {};
  updateObj.images = newImages;
  //update other fields

  updateObj.title = req.body.title;
  updateObj.calories = req.body.calories;
  updateObj.difficult =
    req.body.difficult > 5 || req.body.difficult < 0 ? 5 : req.body.difficult;
  updateObj.duration = req.body.duration;
  db.recipes
    .update(updateObj, { where: { id: req.params.id } })
    .then(recipe => {
      console.log(recipe);
      if (recipe > 0) {
        return res.status(200).json({ msg: "Recipe updated", error: false });
      }
      return res.status(404).json({ msg: "Recipe not found", error: true });
    })
    .catch(error => {
      return res.status(404).json({ msg: error, error: true });
    });
};
module.exports = {
  recipeAddFavorites,
  recipeShow,
  recipeDel,
  recipeUpdate,
  recipeCreate,
  storage,
  recipeFilter,
  // getSteps,
  recipeIngredients
};
