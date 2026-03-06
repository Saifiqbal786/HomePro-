const express = require('express');
const router = express.Router();
const { upload, useCloudinary } = require('../config/upload.config');
const { verifyToken } = require('../middleware/auth.middleware');

// Upload a single image
router.post('/image', verifyToken, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        let imageUrl;
        if (useCloudinary) {
            imageUrl = req.file.path; // Cloudinary returns the full URL in path
        } else {
            // Local fallback -> return the path relative to server root 
            // the server will serve /uploads statically
            imageUrl = `/uploads/${req.file.filename}`;
        }

        res.status(200).json({
            message: 'Image uploaded successfully',
            url: imageUrl
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message || 'Error uploading image' });
    }
});

module.exports = router;
