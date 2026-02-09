const mongoose = require('mongoose');

// Employee profile schema
const employeeProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    department: { type: String, trim: true, default: '' },
    position: { type: String, trim: true, default: '' },

    address: {
        line1: { type: String, trim: true, default: '' },
        line2: { type: String, trim: true, default: '' },
        city: { type: String, trim: true, default: '' },
        state: { type: String, trim: true, default: '' },
        zipCode: { type: String, trim: true, default: '' },
    },

    emergencyContact: {
        name: { type: String, trim: true, default: '' },
        relationship: { type: String, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' },
    },
}, { timestamps: true });

module.exports = mongoose.model('EmployeeProfile', employeeProfileSchema);