const mongoose = require('mongoose');

const UserOtpVerificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 60 * 10000),
        index: { expires: '1m' }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserOtpVerification', UserOtpVerificationSchema)