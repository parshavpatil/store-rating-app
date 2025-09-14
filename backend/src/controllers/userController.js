const bcrypt = require('bcryptjs');
const db = require('../config/db');

//  Admin creates a new user (can be ADMIN, USER, or STORE_OWNER)
exports.createUserByAdmin = async (req, res) => {
    const { name, email, password, address, role } = req.body;

    if (!name || !email || !password || !address || !role) {
        return res.status(400).json({ message: 'Please provide all required fields: name, email, password, address, and role' });
    }

    if (!['ADMIN', 'USER', 'STORE_OWNER'].includes(role.toUpperCase())) {
        return res.status(400).json({ message: 'Invalid role specified' });
    }

    try {
        const [userExists] = await db.query('SELECT email FROM users WHERE email = ?', [email]);
        if (userExists.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sql = 'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)';
        await db.query(sql, [name, email, hashedPassword, address, role.toUpperCase()]);

        res.status(201).json({ message: `User with role ${role.toUpperCase()} created successfully` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while creating user' });
    }
};

//  Admin gets all users with filtering
exports.getAllUsersByAdmin = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, address, role, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
};

//  Admin updates user role
exports.updateUserRole = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'USER', 'STORE_OWNER'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified' });
    }

    try {
        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while updating user role' });
    }
};

//  Admin gets a single user's details
exports.getUserByIdByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await db.query('SELECT id, name, email, address, role FROM users WHERE id = ?', [id]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // If the user is a store owner, we could potentially add their store info here in a future step
        res.json(users[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching user details' });
    }
};

//  User updates their own password
exports.updateUserPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // from 'protect' middleware

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide both old and new passwords.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    try {
        // Get the user's current hashed password from the DB
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const user = users[0];

        // Check if the old password matches
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect old password.' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the password in the database
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: 'Password updated successfully.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while updating password.' });
    }
};