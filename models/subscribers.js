'use strict';
module.exports = (sequelize, DataTypes) => {
  const subscribers = sequelize.define('subscribers', {
    user_id: {
      type: DataTypes.INTEGER
    },
    subscriber_id: {
      type: DataTypes.INTEGER
    },
  });
  subscribers.associate = function (models) {
    // associations can be defined here
    models.subscribers.belongsTo(models.users, {
      foreignKey: 'user_id',
      foreignKey: 'subscriber_id',
    });
  };
  return subscribers;
};