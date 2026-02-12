const mongoose = require('mongoose');

const registrationTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  name: { type: String, trim: true, default: '' },
  position: { type: String, trim: true, default: '' },
  email: { type: String, required: true },
  status: { type: String, enum: ['unused', 'used'], default: 'unused' },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: '3h' }
  }
});

module.exports = mongoose.model('RegistrationToken', registrationTokenSchema);
