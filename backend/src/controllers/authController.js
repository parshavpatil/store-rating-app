const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken } = require('../utils/jwtHelper'); // We will create this helper next

//   Register a new user (Normal User role by default)
exports.registerUser = async (req, res) => {
    const { name, email, address, password } = req.body;

    // Basic Validation
    if (!name || !email || !address || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        // Check if user already exists
        const [userExists] = await db.query('SELECT email FROM users WHERE email = ?', [email]);

        if (userExists.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user into the database
        const sql = 'INSERT INTO users (name, email, address, password, role) VALUES (?, ?, ?, ?, ?)';
        // New users registering through this public route are always 'USER'
        await db.query(sql, [name, email, address, hashedPassword, 'USER']);

        res.status(201).json({ message: 'User registered successfully!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

//   Authenticate user & get token
exports.loginUser = async (req, res) => {
    console.log('🔐 Login attempt received:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
        console.log('❌ Missing email or password');
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    try {
        // Check for user by email
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        console.log('👤 Users found:', users.length);
        
        if (users.length === 0) {
            console.log('❌ No user found with email:', email);
            return res.status(401).json({ message: 'Invalid credentials' }); // Use a generic message for security
        }

        const user = users[0];
        console.log('✅ User found:', user.email, 'Role:', user.role);

        // Compare plain text password with hashed password from DB
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('🔑 Password match:', isMatch);

        if (!isMatch) {
            console.log('❌ Password does not match');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // User is authenticated, generate a JWT
        console.log('🎫 Generating JWT token...');
        const token = generateToken(user.id, user.role);
        console.log('✅ JWT token generated successfully');

        console.log('🎉 Login successful for:', user.email);
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        console.error('💥 Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};