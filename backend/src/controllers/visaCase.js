const path = require("path");
const fs = require("fs");
const { uploadDir } = require("../middleware/uploadVisa");
const VisaCase = require("../models/visaCase");

const DOC_ORDER = ["OPT_RECEIPT", "OPT_EAD", "I-983", "I-20"];
const DOC_LABELS = {
    OPT_RECEIPT: "OPT Receipt",
    OPT_EAD: "OPT EAD",
    "I-983": "I-983",
    "I-20": "I-20",
};

function computeVisaCaseStatus(docs = []) {
    const docsByType = new Map();
    for (const doc of docs || []) {
        if (!doc?.docType) continue;
        docsByType.set(doc.docType, doc);
    }

    for (const docType of DOC_ORDER) {
        const doc = docsByType.get(docType);
        const label = DOC_LABELS[docType] || docType;

        if (!doc) {
            return {
                status: "action_required",
                nextDoc: docType,
                nextDocLabel: label,
                reason: "missing",
            };
        }
        if (doc.status === "rejected") {
            return {
                status: "action_required",
                nextDoc: docType,
                nextDocLabel: label,
                reason: "rejected",
            };
        }
        if (doc.status === "pending") {
            return {
                status: "pending",
                nextDoc: docType,
                nextDocLabel: label,
                reason: "pending",
            };
        }
        if (doc.status !== "approved") {
            return {
                status: "action_required",
                nextDoc: docType,
                nextDocLabel: label,
                reason: "missing",
            };
        }
    }

    return {
        status: "approved",
        nextDoc: null,
        nextDocLabel: "",
        reason: "approved",
    };
}

function mapVisaCaseStatusToNextStep(statusInfo) {
    const normalized = typeof statusInfo === "string"
        ? { status: statusInfo, reason: statusInfo === "approved" ? "approved" : "pending", nextDocLabel: "" }
        : (statusInfo || {});
    const docLabel = normalized.nextDocLabel || normalized.nextDoc || "document";

    if (normalized.reason === "missing") return `Waiting for employee to upload ${docLabel}`;
    if (normalized.reason === "pending") return `Waiting for HR review (${docLabel})`;
    if (normalized.reason === "rejected") return `Employee needs to re-upload ${docLabel}`;
    if (normalized.status === "approved") return "All documents approved";
    return "Waiting for HR review";
}

function mapDocumentForResponse(doc) {
    return {
        docId: String(doc?._id || ''),
        docType: doc?.docType || '',
        originalName: doc?.originalName || '',
        storedName: doc?.storedName || '',
        mimeType: doc?.mimeType || '',
        size: doc?.size || 0,
        uploadedAt: doc?.uploadedAt || null,
        status: doc?.status || 'pending',
        reviewStatus: doc?.status || 'pending',
        feedback: doc?.feedback || '',
        reviewFeedback: doc?.feedback || '',
    };
}

function canUploadNext(docs, nextKey) {
    const nextIndex = DOC_ORDER.indexOf(nextKey);
    if (nextIndex === -1) return false;

    // First doc always allowed
    if (nextIndex === 0) return true;

    // Previous doc must exist AND be approved
    const prevKey = DOC_ORDER[nextIndex - 1];
    const prev = docs.find((d) => d.docType === prevKey);
    return !!prev && prev.status === "approved";
}

// Get the current user's visa cases
async function getMyVisaCases(req, res, next) {
    try {
        res.set('Cache-Control', 'no-store');
        const userId = req.user._id;

        const visaCase = await VisaCase.findOneAndUpdate(
            { User: userId },
            { $setOnInsert: { User: userId, steps: [], documents: [] } },
            { new: true, upsert: true }
        ).lean();

        const normalizedDocuments = (visaCase?.documents || []).map(mapDocumentForResponse);
        const statusInfo = computeVisaCaseStatus(visaCase?.documents || []);
        const caseStatus = statusInfo.status;
        const nextStep = mapVisaCaseStatusToNextStep(statusInfo);
        return res.status(200).json({
            ...visaCase,
            documents: normalizedDocuments,
            status: caseStatus,
            nextStep,
        });
    } catch (error) {
        return next(error);
    }
}

// Upload a new visa document for the current user
async function uploadVisaDocuments(req, res, next) {
    try {
        res.set('Cache-Control', 'no-store');
        const userId = req.user._id;
        const { docType } = req.body || {};

        if (!docType) {
            return res.status(400).json({ message: "docType is required" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "file is required" });
        }

        const normalizedDocType = String(docType).trim();

        // Minimal validation: only allow known doc types for this flow
        if (!DOC_ORDER.includes(normalizedDocType)) {
            return res.status(400).json({
                message: `Invalid docType: ${normalizedDocType}. Allowed: ${DOC_ORDER.join(", ")}`,
            });
        }

        const newDocument = {
            docType: normalizedDocType,
            originalName: String(req.file.originalname).trim(),
            storedName: String(req.file.filename).trim(),
            mimeType: String(req.file.mimetype).trim(),
            size: req.file.size || 0,
            status: "pending",
            feedback: "",
            uploadedAt: new Date(),
        };

        const visaCaseDoc = await VisaCase.findOneAndUpdate(
            { User: userId },
            { $setOnInsert: { User: userId, steps: [], documents: [] } },
            { new: true, upsert: true }
        );

        const docs = visaCaseDoc.documents || [];

        // Enforce one-by-one order BEFORE saving/replacing
        if (!canUploadNext(docs, normalizedDocType)) {
            return res.status(400).json({
                message:
                    "You must upload documents in order. Please complete the previous step first.",
            });
        }

        const existingDocIndex = docs.findIndex(
            (doc) => doc.docType === newDocument.docType
        );

        if (existingDocIndex >= 0) {
            const oldDoc = docs[existingDocIndex];

            // Keep your current rule: only allow re-upload if rejected
            if (oldDoc.status !== "rejected") {
                return res.status(400).json({
                    message: `Cannot re-upload while status is ${oldDoc.status}`,
                });
            }

            // remove old stored file (best-effort)
            try {
                fs.unlinkSync(path.join(uploadDir, oldDoc.storedName));
            } catch (_) { }

            docs[existingDocIndex] = newDocument;
        } else {
            docs.push(newDocument);
        }

        await visaCaseDoc.save();

        const statusInfo = computeVisaCaseStatus(visaCaseDoc.documents || []);
        const caseStatus = statusInfo.status;
        const nextStep = mapVisaCaseStatusToNextStep(statusInfo);
        const normalizedDocuments = (visaCaseDoc.documents || []).map((doc) => mapDocumentForResponse(doc.toObject ? doc.toObject() : doc));
        return res.status(201).json({
            message: "Document uploaded successfully",
            visaCase: {
                ...visaCaseDoc.toObject(),
                documents: normalizedDocuments,
                status: caseStatus,
                nextStep,
            },
        });
    } catch (error) {
        return next(error);
    }
}

// Preview a visa document for the current user
async function previewVisaDocument(req, res, next) {
    try {
        const userId = req.user._id;
        const { docId } = req.params || {};

        const visaCase = await VisaCase.findOne({ User: userId });
        if (!visaCase) {
            return res.status(404).json({ message: "Visa case not found" });
        }

        const document = visaCase.documents.id(docId);
        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        const filePath = path.join(uploadDir, document.storedName);
        res.setHeader("Content-Type", document.mimeType);
        res.setHeader("Content-Disposition", "inline");
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
            return res.status(404).json({ message: "Visa case not found" });
        }

        const document = visaCase.documents.id(docId);
        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        const filePath = path.join(uploadDir, document.storedName);
        res.setHeader("Content-Type", document.mimeType);
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${document.originalName}"`
        );
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
