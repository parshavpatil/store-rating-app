# 🏬 Store Rating App

A full-stack web application that allows users to submit ratings for registered stores.

---

## ⚙️ Tech Stack
- **Frontend:** React.js  
- **Backend:** Express.js (Node.js)  
- **Database:** MySQL 

---

## 🔑 User Roles & Access

### 1. **Admin**
- Can add new stores, users, and admins.
- Dashboard includes:
  - Total number of users
  - Total number of stores
  - Total number of ratings
- Can manage roles and view all data.

**Admin Login Credentials:**

Username: admin@example.com
Password: admin@123

---

### 2. **Normal User**
- Can **sign up** and log in.
- Can view all registered stores.
- Can **search stores** by name or address.
- Can **submit ratings (1–5)** and update their own rating.

👉 Just sign up to use as a normal user.

---

### 3. **Store Owner**
- Can log in with store owner credentials.
- Can view all users who rated their store.
- Can see the **average rating** of their store.

**Sample Store Owner Login Credentials:**

Username: owner@gmail.com
Password: owner123


---

## 📋 Features
- Single login system with different dashboards per role.
- Store listings with:
  - Name
  - Address
  - Overall rating
  - User’s submitted rating
- Rating system: Users can **submit and update ratings**.
- Store owners can **track ratings & users**.
- Admin can **manage all users, stores, and roles**.

---

## 🛠️ Setup Instructions

### Backend

cd backend 
npm install 
npm start

### Frontend

cd frontend 
npm install
npm run dev


