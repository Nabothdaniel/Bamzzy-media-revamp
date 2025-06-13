
import Message from '../models/Message.js';

const addMessage = async (req, res) => {
  const { userId, title, content } = req.body;

  if (!userId || !title || !content) {
    return res.status(400).json({ message: 'userId, title, and content are required.' });
  }

  try {
    const message = await Message.create({
      userId,
      title,
      content
    });

    res.status(201).json({ data: message });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ message: 'Failed to add message' });
  }
};

const getMessages = async (req, res) => {
  const userId = req.user.id;

  try {
    const messages = await Message.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ data: messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};


export {addMessage,getMessages }