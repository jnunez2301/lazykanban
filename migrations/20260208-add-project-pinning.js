'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('projects', 'is_pinned', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'description'
    });

    await queryInterface.addColumn('projects', 'pinned_at', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'is_pinned'
    });

    // Add index for better query performance when sorting by pinned status
    await queryInterface.addIndex('projects', ['is_pinned', 'name'], {
      name: 'idx_projects_pinned_name'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('projects', 'idx_projects_pinned_name');
    await queryInterface.removeColumn('projects', 'pinned_at');
    await queryInterface.removeColumn('projects', 'is_pinned');
  }
};
