'use strict';
module.exports = (sequelize, DataTypes) => {
  const ingredientsRecipes = sequelize.define('ingredientsrecipes', {
    recipe_id: DataTypes.INTEGER,
    ingredient_id: DataTypes.INTEGER,
  }, {});
  ingredientsRecipes.associate = function (models) {
    models.ingredientsrecipes.belongsTo(models.ingredients, {
      foreignKey: "ingredient_id",
      onDelete: "CASCADE",
    });
  };
  return ingredientsRecipes;
};