
import PlatformFn from '../models/Platform.js';
import User from '../models/User.js';
import sequelize from '../utils/database.js';

// Initialize model
const Platform = PlatformFn(sequelize);

// Associate with User
Platform.associate({ User });
User.hasMany(Platform, { foreignKey: 'userId', as: 'platforms' });

// Add a new platform (admin-only)
export const addPlatform = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;


    if (!name) {
      return res.status(400).json({ success: false, message: 'Platform name is required' });
    }

    const existing = await Platform.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Platform already exists' });
    }

    const newPlatform = await Platform.create({ name, userId });

    return res.status(201).json({ success: true, platform: newPlatform });
  } catch (error) {
    console.error('Add Platform Error:', error);
    res.status(500).json({ success: false, message: 'Server error while adding platform' });
  }
};

// Get all platforms (with admin who created them)
export const getPlatforms = async (req, res) => {
  try {
    const platforms = await Platform.findAll({
      include: {
        model: User,
        as: 'admin',
        attributes: ['id', 'name', 'email'],
      },
      order: [['name', 'ASC']]
    });

    res.status(200).json({ success: true, platforms });
  } catch (error) {
    console.error('Fetch Platforms Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch platforms' });
  }
};

// Optional: Delete a platform
export const deletePlatform = async (req, res) => {
  try {
    const platformId = req.params.id;
    const userId = req.user.id;

    const platform = await Platform.findOne({ where: { id: platformId, userId } });
    if (!platform) {
      return res.status(404).json({ success: false, message: 'Platform not found or not owned by you' });
    }

    await platform.destroy();
    res.status(200).json({ success: true, message: 'Platform deleted' });
  } catch (error) {
    console.error('Delete Platform Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete platform' });
  }
};
