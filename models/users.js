'use strict';
module.exports = (sequelize, DataTypes) => {
  const users = sequelize.define('users', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    login: {
      type: DataTypes.STRING
    },
    password: {
      type: DataTypes.STRING
    },
    favorites: {
      type: DataTypes.ARRAY(DataTypes.INTEGER)
    },
    avatar: {
      type: DataTypes.STRING
    },
    name: {
      type: DataTypes.STRING
    },
    about: {
      type: DataTypes.TEXT
    }
  }, {});

  users.associate = function (models) {
    models.users.hasMany(models.recipes, {
      foreignKey: 'id'
    });

    models.users.belongsToMany(models.users, {
      through: {
        model: models.subscribers,
      },
      foreignKey: 'user_id',
      as: 'followers',
    });

    models.users.belongsToMany(models.users, {
      through: {
        model: models.subscribers,
      },
      foreignKey: 'subscriber_id',
      as: 'subscribs',
    });

    models.users.belongsToMany(models.recipes, {
      as: 'favoritesTable',
      through: {
        model: models.favorites,
      },
      foreignKey: 'user_id',
    });
  };
  return users;
};