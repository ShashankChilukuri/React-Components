const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let otpStore = {};
const otpExpiryTime = 2 * 60 * 1000;

app.post('/send-otp', async (req, res) => {
    const { to, username } = req.body;

    const otp = generateOTP();
    const expiry = Date.now() + otpExpiryTime;
    otpStore[username] = { otp, expiry };

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'prabhas05112004@gmail.com',
            pass: 'xvwx hsvr lpuw ayyc',
        },
    });

    ejs.renderFile(path.join(__dirname, 'views', 'otp-views/otp-verification.ejs'), { username, otp }, async (err, emailHtml) => {
        if (err) {
            console.error('EJS Render Error:', err);
            return res.status(500).json({ error: 'Error rendering email template.' });
        }

        try {
            const mailOptions = {
                from: 'Shashank Chilukuri',
                to: to,
                subject: 'OTP Verification',
                html: emailHtml,
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent: ' + info.response);
            res.status(200).json({ message: 'OTP sent successfully!' });
        } catch (error) {
            console.error('Error sending email:', error);
            res.status(500).json({ error: 'Failed to send email with OTP.' });
        }
    });
});

app.post('/verifyotp', (req, res) => {
    const { username, otp } = req.body;

    if (otpStore[username]) {
        const { otp: storedOtp, expiry } = otpStore[username];

        if (Date.now() > expiry) {
            delete otpStore[username];
            return res.status(400).json({ error: 'OTP has expired.' });
        }

        if (storedOtp === otp) {
            delete otpStore[username];
            return res.status(200).json({ message: 'OTP verified successfully!' });
        }
    }
    res.status(400).json({ error: 'Invalid OTP.' });
});

const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
