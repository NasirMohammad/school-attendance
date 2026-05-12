const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "postgres",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "attendance",
  port: 5432,
});

app.get("/", (req, res) => {
  res.json({
    app: "School Attendance System",
    version: "v1",
    status: "running",
  });
});

app.get("/students", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM students ORDER BY id ASC"
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

app.post("/students", async (req, res) => {
  try {
    const { name, class_name } = req.body;

    const result = await pool.query(
      "INSERT INTO students(name, class_name) VALUES($1, $2) RETURNING *",
      [name, class_name]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add student" });
  }
});

app.post("/attendance", async (req, res) => {
  try {
    const { student_id, status } = req.body;

    const result = await pool.query(
      "INSERT INTO attendance(student_id, status) VALUES($1, $2) RETURNING *",
      [student_id, status]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save attendance" });
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
      JOIN students ON students.id = attendance.student_id
      ORDER BY attendance.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});