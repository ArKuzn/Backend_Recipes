'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'ingredientsrecipes',
      'recipe_id',
      {

        type: Sequelize.INTEGER,
        references: {
          model: "recipes",
          key: "id"
        },
        onDelete: 'CASCADE'

      },
    ).then(() => {
      return queryInterface.changeColumn(
        'ingredientsrecipes',
        'ingredient_id',
        {

          type: Sequelize.INTEGER,
          references: {
            model: "ingredients",
            key: "id"
          },
          onDelete: 'CASCADE'

        },
      )
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'ingredientsrecipes',
      'recipe_id',
      {

        type: Sequelize.INTEGER,
        references: {
          model: "recipes",
          key: "id"
        },
      },
    );
  }
};