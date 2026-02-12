const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'onboardingDocs');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (_, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        cb(null, `onboarding_${Date.now()}_${Math.round(Math.random() * 1E9)}${ext}`);
    }
});

function fileFilter(req, file, cb) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype);
    cb(allowedTypes ? null : new Error('Only PDF, JPEG, and PNG files are allowed'), allowedTypes);
}

const uploadOnboarding = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = { uploadOnboarding, uploadDir };

