'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('ingredientsrecipes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      recipe_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "recipes",
          key: "id"
        },
        onDelete: 'CASCADE'
      },
      ingredient_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "ingredients",
          key: "id"
        },
        onDelete: 'CASCADE'
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ingredientsRecipes');
  }
};