const express = require('express');
const app = express();
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

// MySQL connection configuration
const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '314159',
  database: 'dbms_project',
  insecureAuth: true
});

// Connect to the MySQL database
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database');
});

// Serve static files from the current directory
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Parse request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Enable CORS
app.use(cors());

// Route to serve the student dashboard
app.get('/student-dashboard', (req, res) => {
  const studentId = req.query.student_id;
  res.sendFile(path.join(__dirname, 'student.html'), { student_id: studentId });
});
// Route to book an activity
app.post('/book-activity', (req, res) => {
  console.log('Request body:', req.body);
  const { studentId, activityId, activityDate, activityTime } = req.body;

  // Insert the activity booking into the takes table
  const query = 'INSERT INTO takes (student_id, activity_id, date, time) VALUES (?, ?, ?, ?)';
  connection.query(query, [studentId, activityId, activityDate, activityTime], (err, result) => {
    if (err) {
      console.error('Error booking activity:', err);
      return res.status(500).json({ message: 'Error booking activity' });
    } else {
      // Return a success response
      return res.status(200).json({ message: 'Activity booked successfully' });
    }
  });
});

// Route to get the signed up activities for a student
app.get('/get-signed-up-activities', (req, res) => {
  const studentId = req.query.student_id;

  // Fetch the signed up activities from the takes table
  const query = 'SELECT a.activity_name AS activity, DATE_FORMAT(t.date, "%Y-%m-%d") AS formatted_date, t.time FROM takes t JOIN activity a ON t.activity_id = a.activity_id WHERE t.student_id = ?';

  connection.query(query, [studentId], (err, results) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching signed up activities' });
    } else {
      // Return the signed up activities
      res.status(200).json(results);
    }
  });
});


app.get('/worker-dashboard', (req, res) => {
  const workerId = req.query.worker_id;
  res.sendFile(path.join(__dirname, 'worker.html'), { worker_id: workerId });
});

// Route to serve the worker dashboard
app.get('/worker-dashboard', (req, res) => {
  const workerId = req.query.worker_id;

  // Fetch the worker data from the database
  const query = 'SELECT * FROM worker WHERE worker_id = ?';
  connection.query(query, [workerId], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ message: 'Internal server error' });
    } else if (results.length === 0) {
      // Worker not found
      return res.status(404).json({ message: 'Worker not found' });
    } else {
      // Render the worker.html file with the worker data
      res.render('worker.html', { worker: results[0] });
    }
  });
});

// Route for student login
app.post('/student-login', (req, res) => {
  const { studentId, studentName, studentUsername, studentPassword } = req.body;

  // Query the database to check if the student exists and authenticate
  const query = "SELECT * FROM user u JOIN student s ON u.user_id = s.user_id WHERE s.student_id = ? AND u.name = ? AND u.user_name = ? AND u.password = ?";
  connection.query(query, [studentId, studentName, studentUsername, studentPassword], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ message: 'Internal server error' });
    } else if (results.length === 0) {
      // Student not found or authentication failed, send failure response
      return res.status(401).json({ message: 'Invalid student credentials' });
    } else {
      // Student found and authenticated, redirect to the student dashboard with the student_id
      return res.redirect(`/student-dashboard?student_id=${studentId}`);
    }
  });
});

// Route for worker login
// Route for worker login
app.post('/worker-login', (req, res) => {
  const { workerId, workerName, workerType, workerUsername, workerPassword } = req.body;

  // Query the database to check if the worker exists and authenticate
  const query = 'SELECT u.*, w.worker_id, w.type FROM user u JOIN worker w ON u.user_id = w.user_id WHERE w.worker_id = ? AND u.name = ? AND w.type = ? AND u.user_name = ? AND u.password = ?';
  connection.query(query, [workerId, workerName, workerType, workerUsername, workerPassword], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ message: 'Internal server error' });
    } else if (results.length === 0) {
      // Worker not found or authentication failed, send failure response
      return res.status(401).json({ message: 'Invalid worker credentials' });
    } else {
      // Worker found and authenticated, redirect to the worker dashboard with the worker_id
      return res.redirect(`/worker-dashboard?worker_id=${results[0].worker_id}`);
    }
  });
});

// Route to handle student activity booking
app.post('/book-activity', (req, res) => {
  const { studentId, activityId, activityDate, activityTime } = req.body;

  // Insert the activity booking into the takes table
  const query = 'INSERT INTO takes (student_id, activity_id, date, time) VALUES (?, ?, ?, ?)';
  connection.query(query, [studentId, activityId, activityDate, activityTime], (err, result) => {
    if (err) {
      res.status(500).json({ message: 'Error booking activity' });
    } else {
      // Return a success response
      res.status(200).json({ message: 'Activity booked successfully' });
    }
  });
});

// Route to handle worker availability update
app.post('/update-availability', (req, res) => {
  const { workerId, workerAvailability } = req.body;

  // Update the worker availability in the worker table
  const query = 'UPDATE worker SET availability = ? WHERE worker_id = ?';
  connection.query(query, [workerAvailability, workerId], (err, result) => {
    if (err) {
      res.status(500).json({ message: 'Error updating availability' });
    } else {
      // Return a success response
      res.status(200).json({ message: 'Availability updated successfully' });
    }
  });
});

// Route to handle worker type update
app.post('/update-worker-type', (req, res) => {
  const { workerId, workerType } = req.body;

  // Update the worker type in the worker table
  const query = 'UPDATE worker SET type = ? WHERE worker_id = ?';
  connection.query(query, [workerType, workerId], (err, result) => {
    if (err) {
      res.status(500).json({ message: 'Error updating worker type' });
    } else {
      // Return a success response
      res.status(200).json({ message: 'Worker type updated successfully' });
    }
  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});