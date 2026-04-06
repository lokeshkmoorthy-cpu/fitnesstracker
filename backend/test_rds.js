import mysql from 'mysql2';

// Replace these with your actual AWS RDS credentials
const connection = mysql.createConnection({
  host: 'gymdb.crisycy6emka.ap-southeast-2.rds.amazonaws.com',
  user: 'admin',
  password: 'Lokesh9113',
  database: 'gymdb',
  port: 3306
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to RDS:', err);
    return;
  }
  console.log('Connected successfully to AWS RDS!');

  // 1. Create a table
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS test_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  connection.query(createTableQuery, (err, results) => {
    if (err) {
      console.error('Error creating table:', err);
      return connection.end();
    }
    console.log('Table "test_users" created or already exists.');

    // 2. Insert a test record
    const insertQuery = `INSERT INTO test_users (name, email) VALUES (?, ?)`;
    const dummyData = ['John Doe', 'john.doe@example.com'];

    connection.query(insertQuery, dummyData, (err, results) => {
      if (err) {
        console.error('Error inserting data:', err);
        return connection.end();
      }
      console.log('Inserted a new user with ID:', results.insertId);

      // 3. Display the data in the table
      const selectQuery = `SELECT * FROM test_users`;

      connection.query(selectQuery, (err, results, fields) => {
        if (err) {
          console.error('Error fetching data:', err);
          return connection.end();
        }
        console.log('\n--- Data in "test_users" table ---');
        console.table(results);
        console.log('----------------------------------\n');

        // Close the connection when done
        connection.end((err) => {
          if (err) {
            console.error('Error closing connection:', err);
          } else {
            console.log('Connection closed successfully.');
          }
        });
      });
    });
  });
});
