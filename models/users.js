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
    // associations can be defined here
  };
  return users;
};