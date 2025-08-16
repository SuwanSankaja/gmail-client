'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    try {
      // Add an index to the 'from' column for faster searching
      await queryInterface.addIndex('EmailMetadata', ['from'], {
        name: 'idx_emailmetadata_from'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        throw error;
      }
      console.log('Index idx_emailmetadata_from already exists, skipping...');
    }

    try {
      // Add an index to the 'subject' column for faster searching
      await queryInterface.addIndex('EmailMetadata', ['subject'], {
        name: 'idx_emailmetadata_subject'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        throw error;
      }
      console.log('Index idx_emailmetadata_subject already exists, skipping...');
    }

    try {
      // Add a unique index to 'messageId' to prevent duplicates and speed up lookups
      await queryInterface.addIndex('EmailMetadata', ['messageId'], {
        unique: true,
        name: 'idx_emailmetadata_messageid_unique'
      });
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        throw error;
      }
      console.log('Index idx_emailmetadata_messageid_unique already exists, skipping...');
    }
  },

  async down (queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('EmailMetadata', 'idx_emailmetadata_from');
    } catch (error) {
      console.log('Index idx_emailmetadata_from not found, skipping removal...');
    }

    try {
      await queryInterface.removeIndex('EmailMetadata', 'idx_emailmetadata_subject');
    } catch (error) {
      console.log('Index idx_emailmetadata_subject not found, skipping removal...');
    }

    try {
      await queryInterface.removeIndex('EmailMetadata', 'idx_emailmetadata_messageid_unique');
    } catch (error) {
      console.log('Index idx_emailmetadata_messageid_unique not found, skipping removal...');
    }
  }
};