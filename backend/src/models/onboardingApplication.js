const mongoose = require('mongoose');

const allowedStatues = ['not_started', 'in_progress', 'submitted', 'in_review', 'approved', 'rejected'];

// Onboarding application schema
const onboardingSchema = new mongoose.Schema({
    User: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    positionTitle: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
    startDate: { type: Date },
    notes: { type: String, trim: true, default: '' },

    status: { type: String, enum: allowedStatues, default: 'not_started' },
    statusHistory: [{
        status: { type: String, enum: allowedStatues },
        changedAt: { type: Date, default: Date.now },
    }],
}, { timestamps: true });

module.exports = mongoose.model('OnboardingApplication', onboardingSchema);