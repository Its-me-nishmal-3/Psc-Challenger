const webpush = require('web-push');

// Use environment variables in production!
const publicVapidKey = 'BK9TB-EYPPQ1T8IK1Vb-kGaW5Ur0O5UdFVcXFPlxCnA4PMAD7kUQaNKr9WBMBiHCDu2QEkVo6k4KR8sIQMlSgwQ';
const privateVapidKey = 'MqvJwvfx38I036YCQWveaIkWU7xSOlRvQvtbahQbNtc';

webpush.setVapidDetails(
    'mailto:test@example.com',
    publicVapidKey,
    privateVapidKey
);

const sendNotification = async (subscription, payload) => {
    try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (err) {
        console.error('Push Error:', err);
    }
};

module.exports = { sendNotification };
