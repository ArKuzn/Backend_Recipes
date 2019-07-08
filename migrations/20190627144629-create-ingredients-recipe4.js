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
        }
      },
      ingredient_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "ingredients",
          key: "id"
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ingredientsRecipes');
  }
};