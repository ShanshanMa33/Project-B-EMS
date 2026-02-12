const path = require('path');
const fs = require('fs');
const OnboardingApplication = require('../models/onboardingApplication');
const { uploadOnboarding, uploadDir } = require('../middleware/uploadOnboarding');
const {
    canEmployeeEditOnboarding,
    canEmployeeSubmitOnboarding,
} = require('../utils/onboardingStatusTransitions');

async function findMyApplication(userId) {
    return OnboardingApplication.findOne({
        $or: [{ employee: userId }, { User: userId }],
    });
}

async function normalizeApplicationOwner(app, user) {
    if (!app) return null;
    let changed = false;
    if (!app.employee) {
        app.employee = user.id || user._id;
        changed = true;
    }
    if (!app.User) {
        app.User = user.id || user._id;
        changed = true;
    }
    if (!app.email && user.email) {
        app.email = user.email;
        changed = true;
    }
    if (changed) await app.save();
    return app;
}


// Get the current user's onboarding application
exports.getMyApplication = async (req, res, next) => {
    try {
        const application = await normalizeApplicationOwner(await findMyApplication(req.user.id), req.user);
        res.json(application || null);
    } catch (err) {
        next(err);
    }
}

// Create or update the current user's onboarding application
exports.createOrUpdateMyApplication = async (req, res, next) => {
    try {
        const existing = await normalizeApplicationOwner(await findMyApplication(req.user.id), req.user);
        if (existing) return res.status(200).json(existing); // Return existing application if found

        const app = await OnboardingApplication.create({
            employee: req.user.id,
            User: req.user.id,
            email: req.user.email,
            status: "in_progress",
            emergencyContact: { firstName: '', lastName: '', relationship: '', phone: '' },
        });
        res.status(201).json(app);
    } catch (err) {
        next(err);
    }
}

// Update the current user's onboarding application
exports.updateMyOnboardingApplication = async (req, res, next) => {
    try {
        let app = await normalizeApplicationOwner(await findMyApplication(req.user.id), req.user);
        if (!app) {
            app = await OnboardingApplication.create({
                employee: req.user.id,
                User: req.user.id,
                email: req.user.email,
                status: "in_progress",
                emergencyContact: { firstName: '', lastName: '', relationship: '', phone: '' },
            });
        }

        if (!canEmployeeEditOnboarding(app.status)) {
            return res.status(400).json({ message: 'Invalid state to edit' });
        }

        const payload = { ...req.body }
        delete payload.email;
        delete payload.status;
        delete payload.action;

        Object.assign(app, payload);

        if (req.body.action === 'submit' || req.body.action === 'resubmit') {
            if (!canEmployeeSubmitOnboarding(app.status)) {
                return res.status(400).json({ message: 'Invalid state transition for submit/resubmit' });
            }
            app.status = 'pending';
            app.rejectionFeedback = '';
        }

        await app.save();
        res.json(app);
    } catch (err) {
        next(err);
    }
}

// Upload a document for onboarding application
exports.uploadOnboardingDoc = async (req, res, next) => {
    try {
        // Validate file and docType
        if (!req.file) {
            return res.status(400).json({ message: 'no file uploaded' });
        }
        // docType is required in the body
        if (!req.body.docType) {
            return res.status(400).json({ message: 'docType is required' });
        }
        let app = await normalizeApplicationOwner(await findMyApplication(req.user.id), req.user);
        if (!app) {
            app = await OnboardingApplication.create({
                employee: req.user.id,
                User: req.user.id,
                email: req.user.email,
                status: "in_progress",
                emergencyContact: { firstName: '', lastName: '', relationship: '', phone: '' },
            });
        }

        if (!canEmployeeEditOnboarding(app.status)) {
            return res.status(400).json({ message: 'Current onboarding status does not allow document upload' });
        }

        const doc = {
            docType: req.body.docType,
            originalName: req.file.originalname,
            fileName: req.file.filename,
            mimeType: req.file.mimetype,
            size: req.file.size,
        }

        app.uploadedDocs.push(doc);
        // save the uploaded doc id to the workAuth.optReceiptDocId field if docType is OPT_RECEIPT, so we can easily find it later for EAD application
        const createdDocId = app.uploadedDocs[app.uploadedDocs.length - 1]._id;

        if (req.body.docType === 'OPT_RECEIPT') {
            app.workAuth.optReceiptDocId = createdDocId;
        }

        await app.save();
        res.status(201).json(app);
    } catch (err) {
        next(err);
    }
}

// Download a document
exports.downloadOnboardingDoc = async (req, res, next) => {
    try {
        const app = await normalizeApplicationOwner(await findMyApplication(req.user.id), req.user);
        if (!app) return res.status(404).json({ message: 'Onboarding application not found' });

        const doc = app.uploadedDocs.find(d => d._id === req.params.docId);
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        const absolutePath = path.join(uploadDir, doc.fileName);
        res.download(absolutePath, doc.originalName || doc.fileName);
    } catch (err) {
        next(err);
    }
}

// Delete a document
exports.deleteOnboardingDoc = async (req, res, next) => {
    try {
        const app = await normalizeApplicationOwner(await findMyApplication(req.user.id), req.user);
        if (!app) return res.status(404).json({ message: 'Onboarding application not found' });

        const docIndex = app.uploadedDocs.findIndex(d => d._id === req.params.docId);
        if (docIndex === -1) return res.status(404).json({ message: 'Document not found' });

        const [doc] = app.uploadedDocs.splice(docIndex, 1);
        await app.save();

        const absolutePath = path.join(uploadDir, doc.fileName);
        fs.unlink(absolutePath, (err) => {
            if (err) console.error('Failed to delete file:', err);
        });

        res.json({ message: 'Document deleted' });
    } catch (err) {
        next(err);
    }
}

// Preview a document
exports.previewOnboardingDoc = async (req, res, next) => {
    try {
        const app = await normalizeApplicationOwner(await findMyApplication(req.user.id), req.user);
        if (!app) return res.status(404).json({ message: 'Onboarding application not found' });

        const doc = app.uploadedDocs.find(d => d._id === req.params.docId);
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        const absolutePath = path.join(uploadDir, doc.fileName);
        res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', 'inline');
        fs.createReadStream(absolutePath).pipe(res);
    } catch (err) {
        next(err);
    }
}
