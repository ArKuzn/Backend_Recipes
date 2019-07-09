'use strict';
module.exports = (sequelize, DataTypes) => {
    const ingredientsRecipes = sequelize.define('ingredientsrecipes', {
        recipe_id: DataTypes.INTEGER,
        ingredient_id: DataTypes.INTEGER,
    }, {});
    ingredientsRecipes.associate = function (models) {
        // associations can be defined here

        models.ingredientsrecipes.belongsTo(models.ingredients, {
            foreignKey: "ingredient_id",
            // foreignKeyConstraint: true,
            onDelete: "CASCADE",
        });
    };
    return ingredientsRecipes;
};