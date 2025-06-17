import { DataTypes } from 'sequelize';

const Platform = (sequelize) => {
    const PlatformModel = sequelize.define('platforms', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });

    PlatformModel.associate = (models) => {
        PlatformModel.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'admin',
            onDelete: 'CASCADE'
        });
    };

    return PlatformModel;
};

export default Platform;
