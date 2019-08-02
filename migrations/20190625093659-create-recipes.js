'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */

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
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id"
        },
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
