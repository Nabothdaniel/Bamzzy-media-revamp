import CategoryFn from '../models/Category.js';
import User from '../models/User.js';
import sequelize from '../utils/database.js';

// Initialize model
const Category = CategoryFn(sequelize);

// Associate with User
Category.associate?.({ User });
User.hasMany(Category, { foreignKey: 'userId', as: 'categories' });
Category.belongsTo(User, { foreignKey: 'userId', as: 'admin' });

// ✅ Add new category (admin only)
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const existing = await Category.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Category already exists' });
    }

    const newCategory = await Category.create({ name, userId });

    res.status(201).json({ success: true, category: newCategory });
  } catch (error) {
    console.error('Create Category Error:', error);
    res.status(500).json({ success: false, message: 'Server error while adding category' });
  }
};

// ✅ Get all categories with admin info
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: {
        model: User,
        as: 'admin',
        attributes: ['id', 'name', 'email'],
      },
      order: [['name', 'ASC']],
    });

    res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error('Fetch Categories Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

// ✅ Delete a category (admin only, owns it)
export const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const userId = req.user.id;

    const category = await Category.findOne({ where: { id: categoryId, userId } });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found or not owned by you' });
    }

    await category.destroy();
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete Category Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};
