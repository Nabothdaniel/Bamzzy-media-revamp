import { DataTypes } from 'sequelize';

const Category = (sequelize) => {
  const CategoryModel = sequelize.define('category', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  return CategoryModel;
};

export default Category;
