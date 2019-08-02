'use strict';

module.exports = (sequelize, DataTypes) => {
  const recipe = sequelize.define('recipes', {
    title: {
      type: DataTypes.STRING
    },
    ingredients: {
      type: DataTypes.ARRAY(DataTypes.STRING)
    },

    steps: {
      type: DataTypes.ARRAY(DataTypes.STRING)
    },

    images: {
      type: DataTypes.ARRAY(DataTypes.STRING)
    },

    calories: {
      type: DataTypes.REAL
    },

    difficult: {
      type: DataTypes.REAL
    },

    duration: {
      type: DataTypes.STRING
    },
    author: {
      type: DataTypes.INTEGER
    },
  });

  recipe.associate = function (models) {
    // associations can be defined here
    models.recipes.belongsToMany(models.ingredients, {
      as: 'ingredientsTable',
      through: {
        model: models.ingredientsrecipes,
      },
      foreignKey: 'recipe_id',
      onDelete: "CASCADE"

    });
    models.recipes.hasMany(models.steps, {
      as: 'stepItem',
      foreignKey: 'recipe_id',
      onDelete: "CASCADE"
    });
    models.recipes.belongsTo(models.users, {
      as: 'author_user',
      foreignKey: 'author',
    });
    models.recipes.belongsToMany(models.users, {
      as: 'favoritesTable',
      through: {
        model: models.favorites,
      },
      foreignKey: 'recipe_id',
      onDelete: "CASCADE"

    });
  };
  return recipe;
};
