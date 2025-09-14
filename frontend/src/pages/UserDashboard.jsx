import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const UserDashboard = () => {
    const [stores, setStores] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('name'); // 'name' or 'address'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { api } = useAuth();

    const fetchStores = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) {
                params.append(searchType, searchTerm);
            }
            const response = await api.get(`/api/stores?${params.toString()}`);
            setStores(response.data);
        } catch (err) {
            setError('Failed to fetch stores.');
        } finally {
            setLoading(false);
        }
    }, [api, searchTerm, searchType]);

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    const handleRatingSubmit = async (storeId, rating) => {
        try {
            await api.post(`/api/stores/${storeId}/ratings`, { rating });
            // Refetch stores to show the updated rating
            fetchStores(); 
        } catch (err) {
            alert('Failed to submit rating.');
        }
    };

    return (
        <div className="dashboard-container">
            <Header />
            <main className="dashboard-content">
                <h2>All Stores</h2>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder={`Search by store ${searchType}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                        <option value="name">Name</option>
                        <option value="address">Address</option>
                    </select>
                </div>

                {loading && <p>Loading stores...</p>}
                {error && <p className="error-message">{error}</p>}
                
                <div className="store-list">
                    {!loading && stores.map(store => (
                        <StoreCard key={store.id} store={store} onRate={handleRatingSubmit} />
                    ))}
                </div>
            </main>
        </div>
    );
};

// StoreCard Component
const StoreCard = ({ store, onRate }) => {
    const [rating, setRating] = useState(store.userSubmittedRating || 0);

    const handleRateClick = () => {
        if (rating > 0 && rating <= 5) {
            onRate(store.id, rating);
        } else {
            alert("Please select a rating between 1 and 5.");
        }
    };

    return (
        <div className="store-card">
            <h3>{store.name}</h3>
            <p className="store-address">{store.address}</p>
            <div className="store-rating-info">
                <span>Overall Rating: <strong>{store.overallRating}</strong></span>
                <span>Your Rating: <strong>{store.userSubmittedRating || 'Not Rated'}</strong></span>
            </div>
            <div className="rating-input-area">
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                    <option value="0" disabled>Rate...</option>
                    <option value="1">1 - Poor</option>
                    <option value="2">2 - Fair</option>
                    <option value="3">3 - Good</option>
                    <option value="4">4 - Very Good</option>
                    <option value="5">5 - Excellent</option>
                </select>
                <button onClick={handleRateClick} className="btn-primary">
                    {store.userSubmittedRating ? 'Update' : 'Submit'}
                </button>
            </div>
        </div>
    );
};

export default UserDashboard;