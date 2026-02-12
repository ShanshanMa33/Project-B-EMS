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
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: ['male', 'female', 'no_answer', ''], default: '' },

    profilePictureDocId: { type: String, trim: true, default: '' },
    profilePictureUrl: { type: String, trim: true, default: '' },
    profilePictureFileName: { type: String, trim: true, default: '' },

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
        buildingApt: { type: String, trim: true, default: '' },
        street: { type: String, trim: true, default: '' },
        line1: { type: String, trim: true, default: '' },
        line2: { type: String, trim: true, default: '' },
        city: { type: String, trim: true, default: '' },
        state: { type: String, trim: true, default: '' },
        zipCode: { type: String, trim: true, default: '' },
    },

    phones: {
        cell: { type: String, trim: true, default: '' },
        work: { type: String, trim: true, default: '' },
    },

    isPermanentResidentOrCitizen: { type: Boolean, default: null },
    residentStatus: { type: String, enum: ['green_card', 'citizen', ''], default: '' },
    workAuthorization: {
        type: { type: String, enum: ['h1b', 'l2', 'f1_cpt_opt', 'h4', 'other', ''], default: '' },
        otherTitle: { type: String, trim: true, default: '' },
        startDate: { type: Date },
        endDate: { type: Date },
        optReceiptFileName: { type: String, trim: true, default: '' },
        reviewStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        reviewFeedback: { type: String, trim: true, default: '' },
    },

    reference: {
        firstName: { type: String, trim: true, default: '' },
        lastName: { type: String, trim: true, default: '' },
        middleName: { type: String, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' },
        email: { type: String, trim: true, lowercase: true, default: '' },
        relationship: { type: String, trim: true, default: '' },
    },

    emergencyContact: {
        name: { type: String, trim: true, default: '' },
        firstName: { type: String, trim: true, default: '' },
        lastName: { type: String, trim: true, default: '' },
        middleName: { type: String, trim: true, default: '' },
        email: { type: String, trim: true, lowercase: true, default: '' },
        relationship: { type: String, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' },
    },

    emergencyContacts: [{
        firstName: { type: String, trim: true, default: '' },
        lastName: { type: String, trim: true, default: '' },
        middleName: { type: String, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' },
        email: { type: String, trim: true, lowercase: true, default: '' },
        relationship: { type: String, trim: true, default: '' },
    }],

    documents: {
        profilePicture: { type: String, trim: true, default: '' },
        driverLicense: { type: String, trim: true, default: '' },
        workAuthorization: { type: String, trim: true, default: '' },
    },
}, { timestamps: true });

module.exports = mongoose.model('EmployeeProfile', employeeProfileSchema);
