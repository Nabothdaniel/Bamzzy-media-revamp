'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('accounts', 'followers', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('accounts', 'followers');
  }
};
