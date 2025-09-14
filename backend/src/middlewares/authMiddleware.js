const jwt = require('jsonwebtoken');

// Middleware to protect routes
const protect = (req, res, next) => {
    let token;

    // Check for token in the Authorization header (e.g., "Bearer <token>")
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user from the payload to the request object
            req.user = decoded.user;
            
            next(); // Proceed to the next middleware or controller
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware to check for Admin role
const isAdmin = (req, res, next) => {
    // This middleware should run AFTER the 'protect' middleware
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, isAdmin };