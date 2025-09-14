import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
    const [users, setUsers] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showUserForm, setShowUserForm] = useState(false);
    const [showStoreForm, setShowStoreForm] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', address: '', role: 'USER' });
    const [newStore, setNewStore] = useState({ name: '', email: '', address: '', owner_id: '' });
    const [editingUser, setEditingUser] = useState(null);
    const { api } = useAuth();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, storesRes] = await Promise.all([
                api.get('/api/stores/dashboard-stats'),
                api.get('/api/users'),
                api.get('/api/stores')
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
            setStores(storesRes.data);
        } catch (err) {
            setError('Failed to fetch dashboard data.');
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/users', newUser);
            setNewUser({ name: '', email: '', password: '', address: '', role: 'USER' });
            setShowUserForm(false);
            fetchData(); // Refresh data
        } catch (err) {
            setError('Failed to create user: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleCreateStore = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/stores', newStore);
            setNewStore({ name: '', email: '', address: '', owner_id: '' });
            setShowStoreForm(false);
            fetchData(); // Refresh data
        } catch (err) {
            setError('Failed to create store: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleUpdateUserRole = async (userId, newRole) => {
        try {
            await api.put(`/api/users/${userId}/role`, { role: newRole });
            fetchData(); // Refresh data
        } catch (err) {
            setError('Failed to update user role: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) {
        return (
             <div className="dashboard-container">
                <Header />
                <main className="dashboard-content"><p>Loading admin dashboard...</p></main>
            </div>
        );
    }
     if (error) {
        return (
             <div className="dashboard-container">
                <Header />
                <main className="dashboard-content"><p className="error-message">{error}</p></main>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Header />
            <main className="dashboard-content">
                <h2>Admin Dashboard</h2>
                
                <div className="stats-grid">
                    <div className="stats-card">
                        <h3>Total Users</h3>
                        <p className="stat-number">{stats.totalUsers}</p>
                    </div>
                    <div className="stats-card">
                        <h3>Total Stores</h3>
                        <p className="stat-number">{stats.totalStores}</p>
                    </div>
                    <div className="stats-card">
                        <h3>Total Ratings</h3>
                        <p className="stat-number">{stats.totalRatings}</p>
                    </div>
                </div>

                <h3>Manage Users</h3>
                <button 
                    onClick={() => setShowUserForm(!showUserForm)}
                    className="btn-primary"
                    style={{ marginBottom: '20px' }}
                >
                    {showUserForm ? 'Cancel' : 'Add New User'}
                </button>
                
                {showUserForm && (
                    <form onSubmit={handleCreateUser} className="form-container" style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
                        <h4>Create New User</h4>
                        <input
                            type="text"
                            placeholder="Name"
                            value={newUser.name}
                            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Address"
                            value={newUser.address}
                            onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                            required
                        />
                        <select
                            value={newUser.role}
                            onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                        >
                            <option value="USER">User</option>
                            <option value="STORE_OWNER">Store Owner</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                        <button type="submit" className="btn-primary">Create User</button>
                    </form>
                )}
                
                <div className="table-container">
                     <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Address</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.address}</td>
                                    <td>
                                        {editingUser === user.id ? (
                                            <select 
                                                value={user.role} 
                                                onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                                                onBlur={() => setEditingUser(null)}
                                                autoFocus
                                            >
                                                <option value="USER">User</option>
                                                <option value="STORE_OWNER">Store Owner</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                        ) : (
                                            <span 
                                                onClick={() => setEditingUser(user.id)}
                                                style={{ cursor: 'pointer', padding: '5px', border: '1px solid #ddd', borderRadius: '3px' }}
                                            >
                                                {user.role} ✏️
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => setEditingUser(user.id)}
                                            className="btn-secondary"
                                            style={{ fontSize: '12px', padding: '5px 10px' }}
                                        >
                                            Change Role
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <h3>Manage Stores</h3>
                <button 
                    onClick={() => setShowStoreForm(!showStoreForm)}
                    className="btn-primary"
                    style={{ marginBottom: '20px' }}
                >
                    {showStoreForm ? 'Cancel' : 'Add New Store'}
                </button>
                
                {showStoreForm && (
                    <form onSubmit={handleCreateStore} className="form-container" style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
                        <h4>Create New Store</h4>
                        <input
                            type="text"
                            placeholder="Store Name"
                            value={newStore.name}
                            onChange={(e) => setNewStore({...newStore, name: e.target.value})}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Store Email"
                            value={newStore.email}
                            onChange={(e) => setNewStore({...newStore, email: e.target.value})}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Store Address"
                            value={newStore.address}
                            onChange={(e) => setNewStore({...newStore, address: e.target.value})}
                            required
                        />
                        <select
                            value={newStore.owner_id}
                            onChange={(e) => setNewStore({...newStore, owner_id: e.target.value})}
                            required
                        >
                            <option value="">Select Store Owner</option>
                            {users.filter(user => user.role === 'STORE_OWNER').map(owner => (
                                <option key={owner.id} value={owner.id}>
                                    {owner.name} ({owner.email})
                                </option>
                            ))}
                        </select>
                        <button type="submit" className="btn-primary">Create Store</button>
                    </form>
                )}
                
                 <div className="table-container">
                     <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Address</th>
                                <th>Overall Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stores.map(store => (
                                <tr key={store.id}>
                                    <td>{store.name}</td>
                                    <td>{store.email}</td>
                                    <td>{store.address}</td>
                                    <td>{store.overallRating}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;