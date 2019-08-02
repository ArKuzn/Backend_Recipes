var rimraf = require("rimraf");
var multer = require("multer");
var fs = require("fs");
const db = require("../models");
const hash = require("object-hash");
const rn = require("random-number");
const nodemailer = require("nodemailer");
let fileid = 0;
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
var hashFolder = hash(rn());
const testAccount = require('../config').email;
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

const recipeAddFavorites = async function (req, res, next) {
  db.users.findOne({
    where: { id: req.body.tokenId },
    include: [{
      model: db.recipes,
      through: {
        attributes: []
      },
      as: "favoritesTable",
    },]
  })
    .then(async (user) => {
      console.log(user);
      const favorite = await user.hasFavoritesTable(+req.params.id);
      if (favorite) {
        await user.removeFavoritesTable(req.params.id);
        return res.status(200).json({ msg: 'Recipe deleted from your favorites recipes', favorites: await user.getFavoritesTable(), error: false })
      }
      await user.addFavoritesTable(req.params.id);
      return res.status(200).json({ msg: 'Recipe added to your favorites recipes', favorites: await user.getFavoritesTable(), error: false })
    })
    .catch((err) => {
      return res.status(500).json({ msg: err.message, error: true })
    })
};

const emalNotification = async (author, title, idRecipe) => {
  try {
    const user = await db.users.findOne({
      where: { id: author },
      include: [{
        model: db.users,
        through: {
          attributes: []
        },
        as: "followers",
      }]
    }).catch((err) => {
      console.log(err)
    });
    let followers = await user.getFollowers();
    let loginFollowers = [];
    loginFollowers = followers.map(el => el.login)
    let transporter = nodemailer.createTransport({
      host: "smtp.yandex.ru",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass // generated ethereal password
      }
    });
    let sendemails = loginFollowers.map((email) => {
      transporter.sendMail({
        from: '<axkuz97@yandex.ru>', // sender address
        to: `${email}@yandex.ru`, // list of receivers
        subject: `New recipe from ${user.login}`, // Subject line
        text: "Hello world?", // plain text body
        html: `<a href="http://localhost:3001/recipes/${idRecipe}">${title}</a>` // html body
      });
    })
    await Promise.all(sendemails.map(function (email) {
      return email
        .catch(function (err) {
          console.log(err.message); // some coding error in handling happened
          return err
        });
    }))
  } catch (err) {
    console.log(err);
    return false
  }
}

const recipeCreate = async function (req, res, next) {
  //create
  fileid = 0;
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
      +stepImageIndex + (req.files.images.length + 1 || 1)
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
      emalNotification(req.body.author, req.body.title, rec.id);
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
  const pagination = req.query.page
    ?
    {
      limit: 10,
      offset: (req.query.page - 1) * 10 || 0,
    }
    : {}
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
          through: {
            attributes: []
          },
          as: "ingredientsTable",
          where: ingredientsSearchObj
        },
        {
          model: db.steps,
          as: "stepItem"
        },
        {
          model: db.users,
          as: "author_user"
        },
        {
          model: db.users,
          as: "favoritesTable",
          through: {
            attributes: []
          },
        },
      ],
      order: [[order_field, direction]],
      ...pagination
      // limit: req.query.page ? 10 : false,
      // offset: (req.query.page - 1) * 10 || 0,
    });
    return recipes;
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: error.message, error: true });
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
        },
        {
          model: db.ingredients,
          as: "ingredientsTable"
        },
        {
          model: db.users,
          as: "favoritesTable",
          through: {
            attributes: []
          },
        },
      ]
    })
    .then(recipe => {
      if (recipe) {
        return res.json(recipe);
      }
      return res.status(404).json({ msg: "recipe not found", error: true });
    })
    .catch(error => {
      return res.status(500).json({ msg: error, error: true });
    });
};


const updateIngredients = async function (ingredients, req) {
  await ingredients.map((ingredient, index) => {
    try {
      if (ingredient.recipes.length > 1) {
        return console.log("ingredient has a recipe");
      } else {
        return ingredient.destroy({});
      }
    } catch (err) {
      console.log(err);
      return null;
    }
  });
}



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
    if (!recipe) {
      return res.status(404).json({ msg: "Recipe not found", error: true });
    }
    if (recipe.author != req.body.tokenId) {
      return res.status(401).json({ msg: "Access error", error: true });
    }
    folder =
      recipe.images[0].split("/")[1] == "default"
        ? null
        : recipe.images[0].split("/")[1];
    let ingredients = recipe.ingredientsTable;
    await recipe.destroy({});
    console.log(`this is folder will be deleted ${folder}`);
    rimraf.sync(`./uploads/${folder}`);
    updateIngredients(ingredients);
    return res.status(200).json({ msg: "recipe deleted", error: false });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: error, error: true });
  }
};




const recipeIngredients = function (req, res, next) {
  //get ingredients
  db.ingredients.findAll({}).then(recipes => {
    return res.status(200).json({ recipes });
  }).catch((err) => {
    console.log(err);
    return res.status(500).json({ err: true });
  });
};

const updateSteps = async function (recipe, stepsimages, ImageNumber, stepsRecipe, Recipeid) {
  //update steps

  //get new step images
  let newimagesStep = [];
  for (let fileId in stepsimages) {
    newimagesStep[ImageNumber[fileId]] =
      stepsimages[fileId].path;
  }
  //get old step images
  let oldImages = stepsRecipe.split("|").map((step, id) => {
    return db.steps
      .findOne({
        //find old step
        where: {
          recipe_id: Recipeid,
          index: id
        }
      })
      .then(DBstep => {
        if (DBstep && DBstep.image) {
          return DBstep.image;
        }
        return "uploads/default/image.png";
      })
      .catch((err) => {
        console.log(err);
        return null;
      })
  });
  const oldImagesList = await Promise.all(oldImages);
  let steps = stepsRecipe.split("|").map((step, id) => {
    const queryObj = {
      text: step,
      index: id,
      image: newimagesStep[id] || oldImagesList[id]
    }
    return db.steps
      .findOrCreate({
        where: queryObj,
        defaults: queryObj
      })
      .then(DBstep => {
        return DBstep[0].id;
      })
      .catch((err) => {
        console.log(err);
        return null;
      })
  });
  const stepListIds = (await Promise.all(steps)) || [];
  recipe.setStepItem(stepListIds);

}

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
        },
        {
          model: db.ingredients,
          as: "ingredientsTable",
          include: [{ model: db.recipes }]
        }
      ]
    })
    .catch(error => {
      return res.status(404).json({ msg: "Recipe not found", error: true });
    });
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
      .catch((err) => {
        // return res.status(500).json({ msg: err.message, error: true });
        return null
      })
  });
  const ingredientListIds = await Promise.all(ingredients);
  recipe.setIngredientsTable(ingredientListIds);
  //update steps
  updateSteps(recipe, req.files.stepsimages, req.body.ImageNumber, req.body.steps, req.params.id);
  //update images
  const images = await db.recipes.findByPk(req.params.id).catch((err) => {
    console.log(err);
    return null;
  });
  let newImages = images.images;
  for (let newimageId in req.files.images) {
    newImages.push(req.files.images[newimageId].path);
  }
  let updateObj = {};
  updateObj.images = newImages;
  //update other fields
  oldIngredients = recipe.ingredientsTable;
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
  recipeIngredients,
  emalNotification
};
