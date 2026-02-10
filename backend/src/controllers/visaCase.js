const path = require('path');
const fs = require('fs');
const { uploadDir } = require('../middleware/upload');
const VisaCase = require('../models/visaCase');

// Get the current user's visa cases
async function getMyVisaCases(req, res, next) {
    try {
        const userId = req.user._id;

        const visaCase = await VisaCase.findOneAndUpdate(
            { User: userId },
            { $setOnInsert: { User: userId, steps: [], documents: [] } },
            { new: true, upsert: true }
        ).lean();

        return res.status(200).json(visaCase);
    } catch (error) {
        return next(error);
    }
}

// Upload a new visa document for the current user
async function uploadVisaDocuments(req, res, next) {
    try {
        const userId = req.user._id;
        const { docType } = req.body || {};

        if (!docType) {
            return res.status(400).json({ message: 'docType is required' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'file is required' });
        }

        const newDocument = {
            docType: String(docType).trim(),
            originalName: String(req.file.originalname).trim(),
            storedName: String(req.file.filename).trim(),
            mimeType: String(req.file.mimetype).trim(),
            size: req.file.size || 0,
            status: 'pending',
            feedback: '',
            uploadedAt: new Date(),
        };

        const visaCaseDoc = await VisaCase.findOneAndUpdate(
            { User: userId },
            { $setOnInsert: { User: userId, steps: [], documents: [] } },
            { new: true, upsert: true }
        );

        const existingDocIndex = visaCaseDoc.documents.findIndex(doc => doc.docType === newDocument.docType);

        if (existingDocIndex >= 0) {
            const oldDoc = visaCaseDoc.documents[existingDocIndex];

            if (oldDoc.status !== 'rejected') {
                return res.status(400).json({ meesage: `Cannot re-upload while status is ${oldDoc.status}` });
            }

            try {
                fs.unlinkSync(path.join(uploadDir, oldDoc.storedName));
            } catch (_) { }

            visaCaseDoc.documents[existingDocIndex] = newDocument;
        } else {
            visaCaseDoc.documents.push(newDocument);
        };

        await visaCaseDoc.save();

        return res.status(201).json({
            message: 'Document uploaded successfully',
            visaCase: visaCaseDoc.toObject(),
        })
    } catch (error) {
        next(error);
    }
}

// Preview a visa document for the current user
async function previewVisaDocument(req, res, next) {
    try {
        const userId = req.user._id;
        const { docId } = req.params || {};

        const visaCase = await VisaCase.findOne({ User: userId });
        if (!visaCase) {
            return res.status(404).json({ message: 'Visa case not found' });
        }

        const document = visaCase.documents.id(docId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const filePath = path.join(uploadDir, document.storedName);
        res.setHeader('Content-Type', document.mimeType);
        res.setHeader('Content-Disposition', 'inline');
        return fs.createReadStream(filePath).pipe(res);
    } catch (error) {
        return next(error);
    }
}

// Download a visa document for the current user
async function downloadVisaDocument(req, res, next) {
    try {
        const userId = req.user._id;
        const { docId } = req.params || {};

        const visaCase = await VisaCase.findOne({ User: userId });
        if (!visaCase) {
            return res.status(404).json({ message: 'Visa case not found' });
        }

        const document = visaCase.documents.id(docId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const filePath = path.join(uploadDir, document.storedName);
        res.setHeader('Content-Type', document.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
        return fs.createReadStream(filePath).pipe(res);
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    getMyVisaCases,
    uploadVisaDocuments,
    previewVisaDocument,
    downloadVisaDocument,
};