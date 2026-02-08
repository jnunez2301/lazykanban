'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add owner_id column
    await queryInterface.addColumn('tasks', 'owner_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    });

    // Add assignee_id column
    await queryInterface.addColumn('tasks', 'assignee_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    });

    // Update existing tasks to set owner_id from project owner
    await queryInterface.sequelize.query(`
      UPDATE tasks t
      JOIN projects p ON t.project_id = p.id
      SET t.owner_id = p.owner_id, t.assignee_id = p.owner_id
      WHERE t.owner_id = 1
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tasks', 'assignee_id');
    await queryInterface.removeColumn('tasks', 'owner_id');
  }
};
