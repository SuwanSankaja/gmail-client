'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EmailMetadata extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Each email metadata record belongs to one user.
      EmailMetadata.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE' // If a user is deleted, their email metadata is also deleted.
      });
    }
  }
  EmailMetadata.init({
    messageId: DataTypes.STRING,
    subject: DataTypes.STRING,
    from: DataTypes.STRING,
    date: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'EmailMetadata',
  });
  return EmailMetadata;
};
