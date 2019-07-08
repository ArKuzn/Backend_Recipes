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
    const recipe = sequelize.define('recipes', {
        title: {
            type: DataTypes.STRING
        },
        ingredients: {
            type: DataTypes.ARRAY(DataTypes.STRING)
        },

        steps: {
            type: DataTypes.ARRAY(DataTypes.STRING)
        },

        images: {
            type: DataTypes.ARRAY(DataTypes.STRING)
        },

        calories: {
            type: DataTypes.REAL
        },

        difficult: {
            type: DataTypes.REAL
        },

        duration: {
            type: DataTypes.STRING
        },
        author: {
            type: DataTypes.INTEGER
        },
    });
    recipe.associate = function (models) {
        // associations can be defined here
        models.recipes.belongsToMany(models.ingredients, {
            as: 'ingredientsTable',
            through: {
                model: models.ingredientsrecipes,
                unique: true
            },
            foreignKey: 'recipe_id',
        });
        models.recipes.hasMany(models.steps, {
            as: 'stepItem',
            foreignKey: 'recipe_id',
        });
    };
    // recipe.associate = function (models) {
    //     // associations can be defined here
    //     models.recipes.hasMany(models.steps, {
    //         as: 'stepItem',
    //         foreignKey: 'recipe_id',
    //     });
    // };
    return recipe;
};