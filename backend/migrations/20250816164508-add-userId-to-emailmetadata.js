'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('EmailMetadata', 'userId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Users', // This is the name of the table
        key: 'id',      // This is the column in the Users table
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('EmailMetadata', 'userId');
  }
};