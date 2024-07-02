const mongoose = require('mongoose')

const OtpVerifcationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        // type: Number,
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() +  60 * 1000),
        index: { expires: '1m' }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('OtpVerification', OtpVerifcationSchema)