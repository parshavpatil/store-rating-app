// backend/src/config/db.js
const mysql = require('mysql2');

const databaseHost = process.env.DB_HOST;
const databasePort = Number(process.env.DB_PORT) || 3306;
const databaseUser = process.env.DB_USER;
const databasePassword = process.env.DB_PASSWORD;
const databaseName = process.env.DB_NAME;

// Ensure the database exists and create tables
function ensureDatabaseExists() {
  return new Promise((resolve, reject) => {
    const bootstrapConnection = mysql.createConnection({
      host: databaseHost,
      port: databasePort,
      user: databaseUser,
      password: databasePassword,
      multipleStatements: true
    });

    bootstrapConnection.connect((connectError) => {
      if (connectError) {
        console.error('Error connecting to MySQL server (bootstrap):', connectError);
        bootstrapConnection.end();
        return reject(connectError);
      }

      const createDbSql = `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
      bootstrapConnection.query(createDbSql, (queryError) => {
        if (queryError) {
          console.error('Error creating database if not exists:', queryError);
          bootstrapConnection.end();
          return reject(queryError);
        }

        // Switch to the database and create tables
        bootstrapConnection.query(`USE \`${databaseName}\`;`, (useError) => {
          if (useError) {
            console.error('Error switching to database:', useError);
            bootstrapConnection.end();
            return reject(useError);
          }

          const createTablesSql = `
            CREATE TABLE IF NOT EXISTS users (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) UNIQUE NOT NULL,
              address TEXT NOT NULL,
              password VARCHAR(255) NOT NULL,
              role ENUM('ADMIN', 'USER', 'STORE_OWNER') DEFAULT 'USER',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS stores (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) UNIQUE NOT NULL,
              address TEXT NOT NULL,
              owner_id INT,
              overall_rating DECIMAL(3,2) DEFAULT 0.00,
              total_ratings INT DEFAULT 0,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS ratings (
              id INT AUTO_INCREMENT PRIMARY KEY,
              user_id INT NOT NULL,
              store_id INT NOT NULL,
              rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
              UNIQUE KEY unique_user_store_rating (user_id, store_id)
            );
          `;

          bootstrapConnection.query(createTablesSql, (tablesError) => {
            if (tablesError) {
              console.error('Error creating tables:', tablesError);
              bootstrapConnection.end();
              return reject(tablesError);
            }
            console.log('Database and tables created successfully!');
            
            // Create a test user if none exists
            bootstrapConnection.query('SELECT COUNT(*) as count FROM users', (countError, countResult) => {
              if (countError) {
                console.error('Error checking user count:', countError);
                bootstrapConnection.end();
                return resolve();
              }
              
              if (countResult[0].count === 0) {
                console.log('No users found, creating test user...');
                const bcrypt = require('bcryptjs');
                const testPassword = bcrypt.hashSync('test123', 10);
                const insertUser = 'INSERT INTO users (name, email, address, password, role) VALUES (?, ?, ?, ?, ?)';
                bootstrapConnection.query(insertUser, ['Test User', 'test@test.com', '123 Test St', testPassword, 'USER'], (insertError) => {
                  if (insertError) {
                    console.error('Error creating test user:', insertError);
                  } else {
                    console.log('Test user created: test@test.com / test123');
                  }
                  bootstrapConnection.end();
                  return resolve();
                });
              } else {
                bootstrapConnection.end();
                return resolve();
              }
            });
          });
        });
      });
    });
  });
}

const pool = mysql.createPool({
  host: databaseHost,
  port: databasePort,
  user: databaseUser,
  password: databasePassword,
  database: databaseName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Attempt to bootstrap DB and then test a connection
ensureDatabaseExists()
  .then(() => {
    pool.getConnection((err, conn) => {
      if (err) {
        console.error('Error connecting to database:', err);
        return;
      }
      console.log('Successfully connected to the database.');
      conn.release();
    });
  })
  .catch(() => {
    // Error logs already printed in ensureDatabaseExists
  });

module.exports = pool.promise();