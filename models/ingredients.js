'use strict';
module.exports = (sequelize, DataTypes) => {
  const ingredients = sequelize.define('ingredients', {
    title: {
      type: DataTypes.STRING,
      unique: true
    }
  }, {});
  ingredients.associate = function (models) {
    models.ingredients.belongsToMany(models.recipes, {
      through: {
        model: models.ingredientsrecipes,
      },
      foreignKey: 'ingredient_id',
    });
  };
  return ingredients;
};