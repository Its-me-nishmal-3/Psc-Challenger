const webpush = require('web-push');
const User = require('../models/User');

webpush.setVapidDetails(
    `mailto:${process.env.ADMIN_EMAIL}`,
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY
);

/**
 * Send notification to a specific user across all devices
 * @param {Object} user - User mongo object
 * @param {Object} payload - { title, body, url, icon }
 */
const sendToUser = async (user, payload) => {
    if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) return;

    const notifications = user.pushSubscriptions.map(subscription => {
        return webpush.sendNotification(subscription, JSON.stringify(payload))
            .catch(err => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Subscription expired or invalid
                    return { expired: true, endpoint: subscription.endpoint };
                }
                console.error(`Push Error for user ${user.name}:`, err.code || err.statusCode);
                return { error: true };
            });
    });

    const results = await Promise.all(notifications);

    // Cleanup expired subscriptions
    const expiredEndpoints = results
        .filter(r => r && r.expired)
        .map(r => r.endpoint);

    if (expiredEndpoints.length > 0) {
        await User.findByIdAndUpdate(user._id, {
            $pull: { pushSubscriptions: { endpoint: { $in: expiredEndpoints } } }
        });
        console.log(`Removed ${expiredEndpoints.length} expired subscriptions for user ${user.name}`);
    }
};

/**
 * Broadcast notification to a list of users
 * @param {Array} users - Array of User objects
 * @param {Object} payload - { title, body, url }
 */
const broadcast = async (users, payload) => {
    console.log(`Broadcasting to ${users.length} users: ${payload.title}`);
    // Process in chunks to avoid overwhelming server/network? 
    // For now, parallel is fine for small user base.
    await Promise.all(users.map(user => sendToUser(user, payload)));
};

module.exports = {
    sendToUser,
    broadcast
};
