const mongoose = require('mongoose');

// VisaCase schema to track visa application steps and documents
const visaCaseSchema = new mongoose.Schema({
    stepKey: { type: String, required: true },
    status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
    updatedAt: { type: Date, default: Date.now },
},
    { _id: false }
);

// Visa document schema to track uploaded visa documents
const visaDocSchema = new mongoose.Schema({
    docType: { type: String, required: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, default: 0 },

    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    feedback: { type: String, default: '' },

    uploadedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'hr' },
});

// Main VisaCase schema that references the user and contains steps and documents
const visaCaseMainSchema = new mongoose.Schema({
    User: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    steps: {
        type: [visaCaseSchema],
        default: []
    },
    documents: {
        type: [visaDocSchema],
        default: []
    },
},
    { timestamps: true }
);

module.exports = mongoose.model('VisaCase', visaCaseMainSchema);