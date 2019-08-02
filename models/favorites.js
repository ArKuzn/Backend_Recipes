'use strict';
module.exports = (sequelize, DataTypes) => {
  const favorites = sequelize.define('favorites', {
    user_id: {
      type: DataTypes.INTEGER
    },
    recipe_id: {
      type: DataTypes.INTEGER
    },
  });
  favorites.associate = function (models) {
    models.favorites.belongsTo(models.recipes, {
      foreignKey: 'recipe_id',
    });
  };
  return favorites;
};