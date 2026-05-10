const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const client = require("prom-client");

const app = express();

app.use(cors());
app.use(express.json());

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequests = new client.Counter({
  name: "attendance_http_requests_total",
  help: "Total HTTP Requests"
});

register.registerMetric(httpRequests);

const pool = new Pool({
  user: "postgres",
  host: "postgres",
  database: "attendance",
  password: "postgres",
  port: 5432
});

app.get("/", (req, res) => {
  httpRequests.inc();

  res.json({
    app: "School Attendance System",
    version: "v1",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy"
  });
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.get("/students", async (req, res) => {
  httpRequests.inc();

  try {
    const result = await pool.query(
      "SELECT * FROM students ORDER BY id ASC"
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "database error"
    });
  }
});

app.post("/attendance", async (req, res) => {
  httpRequests.inc();

  const { student_id, status } = req.body;

  try {
    await pool.query(
      "INSERT INTO attendance(student_id,status) VALUES($1,$2)",
      [student_id, status]
    );

    res.json({
      message: "attendance saved"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "insert failed"
    });
  }
});

app.get("/attendance", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        attendance.id,
        students.name,
        students.class_name,
        attendance.status,
        attendance.created_at
      FROM attendance
      JOIN students
      ON students.id = attendance.student_id
      ORDER BY attendance.created_at DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch attendance"
    });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});