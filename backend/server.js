const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const redis = require("redis");
const amqp = require("amqplib");

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

const redisClient = redis.createClient({
  url: "redis://redis:6379",
});

redisClient.connect();

redisClient.on("error", (err) => {
  console.log("Redis Error:", err);
});

app.get("/", (req, res) => {
  res.json({
    app: "School Attendance System",
    version: "v1",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    app: "School Attendance System",
    version: "v1",
    status: "running"
  });
});;

let channel;

async function connectRabbitMQ() {

  try {

    const connection = await amqp.connect(
      "amqp://rabbitmq:5672"
    );

    channel = await connection.createChannel();

    await channel.assertQueue("attendance_queue");

    console.log("RabbitMQ connected");

  } catch (err) {

    console.error("RabbitMQ Error:", err);

  }
}

connectRabbitMQ();

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  console.log("LOGIN TRY:", username, password);

  if (username !== "admin" || password !== "admin123") {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = jwt.sign({ username: "admin" }, JWT_SECRET, {
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

    const cachedStudents = await redisClient.get("students");

    if (cachedStudents) {
      console.log("Serving students from Redis cache");

      return res.json(JSON.parse(cachedStudents));
    }

    console.log("Serving students from PostgreSQL");

    const result = await pool.query(
      "SELECT * FROM students ORDER BY id ASC"
    );

    await redisClient.set(
      "students",
      JSON.stringify(result.rows),
      {
        EX: 60,
      }
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch students",
    });
  }
});

app.post("/students", verifyToken, async (req, res) => {
  try {
    const { name, class_name } = req.body;

    const result = await pool.query(
      "INSERT INTO students(name, class_name) VALUES($1, $2) RETURNING *",
      [name, class_name]
    );

    await redisClient.del("students");

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

    await redisClient.del("students");

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

    await redisClient.del("students");

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

    if (channel) {
      channel.sendToQueue(
        "attendance_queue",
        Buffer.from(
          JSON.stringify({
            student_id,
            status,
            time: new Date(),
          })
        )
      );

      console.log("Attendance event sent to RabbitMQ:", student_id, status);
    } else {
      console.log("RabbitMQ channel not ready");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to save attendance",
    });
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