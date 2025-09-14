import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const StoreOwnerDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { api } = useAuth();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/api/stores/my-store');
                setDashboardData(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [api]);

    if (loading) {
        return (
            <div className="dashboard-container">
                <Header />
                <main className="dashboard-content">
                    <p>Loading dashboard...</p>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <Header />
                <main className="dashboard-content">
                    <p className="error-message">{error}</p>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Header />
            <main className="dashboard-content">
                <h2>My Store Dashboard</h2>
                <div className="stats-card">
                    <h3>Average Rating</h3>
                    <p className="stat-number">{dashboardData.averageRating}</p>
                </div>

                <h3>Users Who Rated Your Store</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>User Name</th>
                                <th>User Email</th>
                                <th>Rating Given</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dashboardData.raters && dashboardData.raters.length > 0 ? (
                                dashboardData.raters.map((rater, index) => (
                                    <tr key={index}>
                                        <td>{rater.name}</td>
                                        <td>{rater.email}</td>
                                        <td>{rater.rating}</td>
                                        <td>{new Date(rater.updated_at).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4">No ratings have been submitted yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default StoreOwnerDashboard;