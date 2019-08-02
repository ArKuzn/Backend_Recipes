'use strict';
// var Sequelize = require('sequelize');
// // const sequelize = new Sequelize('postgres://postgres:postgres@localhost:5432/Users');
// var db = {};
// const env = process.env.NODE_ENV || 'development';
// const config = require(__dirname + '/../config/config.json')[env];


// // let sequelize;

// //   let sequelize = new Sequelize("Users", "postgres", "postgres",{host:'localhost', dialect:'postgres'});

// var sequelize;
// if (config.use_env_variable) {
//   sequelize = new Sequelize(process.env[config.use_env_variable], config);
// } else {
//   sequelize = new Sequelize(config.database, config.username, config.password, config);
// }

// db.sequelize = sequelize;
// db.Sequelize = Sequelize;
module.exports = (sequelize, DataTypes) => {
  const steps = sequelize.define('steps', {
    image: {
      type: DataTypes.STRING
    },
    index: {
      type: DataTypes.INTEGER
    },
    text: {
      type: DataTypes.STRING
    },
    recipe_id: {
      type: DataTypes.INTEGER
    },
  });
  steps.associate = function (models) {
    // associations can be defined here
    models.steps.belongsTo(models.recipes, {
      foreignKey: 'id',
    });
  };
  return steps;
};