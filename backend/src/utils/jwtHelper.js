const jwt = require('jsonwebtoken');

// This function generates a JWT
const generateToken = (userId, userRole) => {
    const payload = {
        user: {
            id: userId,
            role: userRole,
        },
    };

    // The token will expire in 1 hour. You can change this value.
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

module.exports = { generateToken };