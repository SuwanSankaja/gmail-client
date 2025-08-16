'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Find and delete all records where messageId is NULL
    await queryInterface.bulkDelete('EmailMetadata', {
      messageId: null
    });
  },

  async down (queryInterface, Sequelize) {
    // This operation cannot be easily undone, so we'll leave the down method empty.
    console.log("Cannot undo deletion of null messageIds.");
  }
};