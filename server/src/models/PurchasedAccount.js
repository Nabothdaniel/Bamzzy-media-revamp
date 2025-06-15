import { DataTypes } from 'sequelize';

const PurchasedAccount = (sequelize) => {
    const PurchasedAccountModel = sequelize.define('purchased_accounts', {
        platform: {
            type: DataTypes.STRING,
            allowNull: false
        },
        accountType: {
            type: DataTypes.STRING,
            allowNull: false
        },
        login: {
            type: DataTypes.STRING,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        transactionId: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });

    // Define associations
    PurchasedAccountModel.associate = (models) => {
        // Belongs to a User
        PurchasedAccountModel.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user',
            onDelete: 'CASCADE'
        });

        // Belongs to a Transaction (optional, if you want to access the related transaction)
        PurchasedAccountModel.belongsTo(models.Transaction, {
            foreignKey: 'transactionId',
            targetKey: 'transactionId', // Because it's not the default `id`
            as: 'transaction',
            onDelete: 'CASCADE'
        });
    };

    return PurchasedAccountModel;
};

export default PurchasedAccount;
