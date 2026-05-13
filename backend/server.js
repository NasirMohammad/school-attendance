const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "school-attendance-secret";

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

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const adminUser = {
    username: "admin",
    passwordHash: bcrypt.hashSync("admin123", 10),
  };

  const isValidUser = username === adminUser.username;
  const isValidPassword = bcrypt.compareSync(password, adminUser.passwordHash);

  if (!isValidUser || !isValidPassword) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = jwt.sign({ username: adminUser.username }, JWT_SECRET, {
    expiresIn: "1h",
  });

  res.json({ token });
});

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
};

app.get("/students", verifyToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM students ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

app.post("/students", verifyToken, async (req, res) => {
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

app.put("/students/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, class_name } = req.body;

    const result = await pool.query(
      "UPDATE students SET name = $1, class_name = $2 WHERE id = $3 RETURNING *",
      [name, class_name, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update student" });
  }
});

app.delete("/students/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM attendance WHERE student_id = $1", [id]);
    await pool.query("DELETE FROM students WHERE id = $1", [id]);

    res.json({ message: "Student deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

app.post("/attendance", verifyToken, async (req, res) => {
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

app.get("/attendance", verifyToken, async (req, res) => {
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