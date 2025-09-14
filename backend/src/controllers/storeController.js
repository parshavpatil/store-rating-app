const db = require('../config/db');

//   Admin creates a new store
exports.createStoreByAdmin = async (req, res) => {
    const { name, email, address, owner_id } = req.body;

    if (!name || !email || !address) {
        return res.status(400).json({ message: 'Please provide name, email, and address for the store' });
    }

    try {
        // Optional: Check if the owner_id is valid and belongs to a STORE_OWNER
        if (owner_id) {
            const [users] = await db.query('SELECT role FROM users WHERE id = ?', [owner_id]);
            if (users.length === 0 || users[0].role !== 'STORE_OWNER') {
                return res.status(400).json({ message: 'Invalid owner ID or the user is not a Store Owner' });
            }
        }

        const sql = 'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)';
        await db.query(sql, [name, email, address, owner_id || null]);

        res.status(201).json({ message: 'Store created successfully' });

    } catch (error) {
        console.error(error);
        // Check for duplicate email error
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'A store with this email already exists.' });
        }
        res.status(500).json({ message: 'Server error while creating store' });
    }
};

//   Admin gets dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const [userCount] = await db.query('SELECT COUNT(*) as total FROM users');
        const [storeCount] = await db.query('SELECT COUNT(*) as total FROM stores');
        const [ratingCount] = await db.query('SELECT COUNT(*) as total FROM ratings');

        res.json({
            totalUsers: userCount[0].total,
            totalStores: storeCount[0].total,
            totalRatings: ratingCount[0].total,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching dashboard stats' });
    }
};

//   Get all stores (for any logged-in user)
exports.getAllStores = async (req, res) => {
    const { name, address } = req.query;
    const userId = req.user.id; // From 'protect' middleware

    try {
        let sql = `
            SELECT 
                s.id, 
                s.name, 
                s.address,
                s.email,
                AVG(r.rating) as overallRating,
                (SELECT rating FROM ratings WHERE user_id = ? AND store_id = s.id) as userSubmittedRating
            FROM stores s
            LEFT JOIN ratings r ON s.id = r.store_id
            WHERE 1=1
        `;
        
        const params = [userId];

        if (name) {
            sql += ' AND s.name LIKE ?';
            params.push(`%${name}%`);
        }
        if (address) {
            sql += ' AND s.address LIKE ?';
            params.push(`%${address}%`);
        }

        sql += ' GROUP BY s.id ORDER BY s.name ASC';

        const [stores] = await db.query(sql, params);

        // Clean up the data (convert nulls and format numbers)
        const formattedStores = stores.map(store => ({
            ...store,
            overallRating: store.overallRating ? parseFloat(store.overallRating).toFixed(2) : 'N/A',
            userSubmittedRating: store.userSubmittedRating || null
        }));

        res.json(formattedStores);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching stores' });
    }
};

//   User submits or updates a rating for a store
exports.submitOrUpdateRating = async (req, res) => {
    const { storeId } = req.params;
    const { rating } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
    }

    try {
        // This query will INSERT a new rating, or if a rating from this user
        // for this store already exists, it will UPDATE the existing one.
        const sql = `
            INSERT INTO ratings (user_id, store_id, rating) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE rating = ?
        `;
        
        await db.query(sql, [userId, storeId, rating, rating]);

        res.status(200).json({ message: 'Rating submitted successfully' });

    } catch (error) {
        console.error(error);
        // Foreign key constraint error
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(404).json({ message: 'Store not found.' });
        }
        res.status(500).json({ message: 'Server error while submitting rating' });
    }
};

//   Store owner gets their store's dashboard data
exports.getStoreOwnerDashboard = async (req, res) => {
    const ownerId = req.user.id; // Get the logged-in user's ID from the 'protect' middleware

    // First, find the store owned by the logged-in user
    try {
        const [stores] = await db.query('SELECT id FROM stores WHERE owner_id = ?', [ownerId]);

        if (stores.length === 0) {
            return res.status(404).json({ message: "You don't have a store assigned to you." });
        }
        const storeId = stores[0].id;

        // Get the average rating for the store
        const [avgRatingResult] = await db.query(
            'SELECT AVG(rating) as averageRating FROM ratings WHERE store_id = ?',
            [storeId]
        );
        const averageRating = avgRatingResult[0].averageRating;

        // Get the list of users who have rated the store
        const [raters] = await db.query(`
            SELECT u.name, u.email, r.rating, r.updated_at 
            FROM ratings r
            JOIN users u ON r.user_id = u.id
            WHERE r.store_id = ?
            ORDER BY r.updated_at DESC
        `, [storeId]);
        
        // Send the final data back to the frontend
        res.json({
            averageRating: averageRating ? parseFloat(averageRating).toFixed(2) : 'N/A',
            raters: raters
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching store dashboard' });
    }
};