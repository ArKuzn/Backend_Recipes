'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('recipes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING
      },
      ingredients: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },

      steps: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },

      images: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },

      calories: {
        type: Sequelize.REAL
      },

      difficult: {
        type: Sequelize.REAL
      },

      duration: {
        type: Sequelize.INTEGER
      },
      author: {
        type: Sequelize.INTEGER
      }
    });

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('recipes');
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
