const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'visaDocs');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || '');
        const safeExt = ext ? ext.toLowerCase() : '';
        const name = `visa_${Date.now()}_${Math.round(Math.random() * 1E9)}${safeExt}`;
        cb(null, name);
    }
});

function fileFilter(req, file, cb) {
    const ok = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype);
    cb(ok ? null : new Error('Only PDF, JPEG, and PNG files are allowed'), ok);
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = { upload, uploadDir };