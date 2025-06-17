import express from 'express';

const router = express.Router();


import {
    createCategory,
    getCategories,
    deleteCategory,
} from '../controller/categoryController.js';

import { authenticateToken } from '../middleware/authenticateMiddlware.js';

// @route   POST http://localhost:5000/api/v1/categories
// @desc    Create a new category (admin only)
// @access  Private
router.post('/create-category', authenticateToken, createCategory);

// @route   GET http://localhost:5000/api/v1/categories
// @desc    Get all categories
// @access  Public or Private
router.get('/get-categories',authenticateToken, getCategories);

// @route   DELETE /api/v1/categories/:id
// @desc    Delete a category by ID (admin-only, must be owner)
// @access  Private
router.delete('/delete/:id', authenticateToken, deleteCategory);

export const categoryRouter = router;
