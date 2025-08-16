'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A user can have many email metadata records.
      // The foreign key 'userId' will be added to the EmailMetadata model.
      User.hasMany(models.EmailMetadata, {
        foreignKey: 'userId',
        as: 'emailMetadata'
      });
    }
  }
  User.init({
    googleId: DataTypes.STRING,
    email: DataTypes.STRING,
    accessToken: DataTypes.TEXT,
    refreshToken: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};
