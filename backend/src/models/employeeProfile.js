const mongoose = require('mongoose');

// Employee profile schema
const employeeProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true, default: '' },
    preferredName: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    ssn: { type: String, trim: true, default: '' },
    dob: { type: Date, default: null },
    gender: { type: String, trim: true, default: '' },
    profilePictureDocId: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
    position: { type: String, trim: true, default: '' },
    cellPhone: { type: String, trim: true, default: '' },
    workPhone: { type: String, trim: true, default: '' },
    employment: {
        visaTitle: { type: String, trim: true, default: '' },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
    },

    address: {
        line1: { type: String, trim: true, default: '' },
        line2: { type: String, trim: true, default: '' },
        city: { type: String, trim: true, default: '' },
        state: { type: String, trim: true, default: '' },
        zipCode: { type: String, trim: true, default: '' },
    },

    emergencyContact: {
        firstName: { type: String, trim: true, default: '' },
        lastName: { type: String, trim: true, default: '' },
        middleName: { type: String, trim: true, default: '' },
        email: { type: String, trim: true, default: '' },
        relationship: { type: String, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' },
    },
}, { timestamps: true });

module.exports = mongoose.model('EmployeeProfile', employeeProfileSchema);