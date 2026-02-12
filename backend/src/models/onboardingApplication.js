const mongoose = require('mongoose');
const User = require('./users');
const allowedStatues = ['in_progress', 'pending', 'approved', 'rejected'];

// Onboarding application schema
const AddressSchema = new mongoose.Schema({
    AddressLine1: { type: String, default: '' },
    AddressLine2: { type: String, default: '' },
    City: { type: String, default: '' },
    State: { type: String, default: '' },
    ZipCode: { type: String, default: '' },
    Country: { type: String, default: '' },
}, { _id: false });

const WorkAuthSchema = new mongoose.Schema({
    isCitizenOrPR: { type: Boolean, default: null },
    citizenOrGreenCard: { type: String, enum: ['Citizen', 'Green Card'], default: null },
    visaType: { type: String, enum: ['H1-B', 'L2', 'F1(CPT/OPT)', 'H4', 'Other', ''], default: '' },
    otherVisaTitle: { type: String, default: '' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    optReceiptDocId: { type: String, default: '' },
}, { _id: false });

const ReferenceSchema = new mongoose.Schema({
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    middleName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    relationship: { type: String, default: '' },
}, { _id: false });

const EmergencyContactSchema = new mongoose.Schema({
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    middleName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    relationship: { type: String, default: '' },
}, { _id: false });

const UploadDocumentSchema = new mongoose.Schema({
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    docType: { type: String, required: true, enum: ["PROFILE_PIC", "DRIVER_LICENSE", "WORK_AUTH", "OPT_RECEIPT"] },
    originalName: { type: String, default: '' },
    fileName: { type: String, required: true },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    uploadDate: { type: Date, default: Date.now },
}, { _id: false });

const onboardingSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    // Legacy field kept for backward compatibility with existing DB index User_1.
    User: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // personal info
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    middleName: { type: String, default: '' },
    preferredName: { type: String, default: '' },
    // contact info
    address: { type: AddressSchema, default: () => ({}) },
    cellPhone: { type: String, default: '' },
    workPhone: { type: String, default: '' },
    email: { type: String, default: '' },
    // other info
    ssn: { type: String, default: '' },
    dob: { type: Date, default: null },
    workAuth: { type: WorkAuthSchema, default: () => ({}) },
    reference: { type: ReferenceSchema, default: () => ({}) },
    emergencyContact: { type: [EmergencyContactSchema], default: [] },
    uploadedDocs: { type: [UploadDocumentSchema], default: [] },

    // workflow status
    status: { type: String, enum: allowedStatues, default: 'in_progress' },
    rejectionFeedback: { type: String, default: '' },
}, { timestamps: true });

onboardingSchema.pre('validate', function syncUserFields() {
    if (!this.employee && this.User) this.employee = this.User;
    if (!this.User && this.employee) this.User = this.employee;
});

module.exports = mongoose.model('OnboardingApplication', onboardingSchema);
