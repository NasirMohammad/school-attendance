app.get("/api/", (req, res) => {
  res.json({
    app: "School Attendance System",
    version: "v2",
    status: "running"
  });
});

app.get("/api/students", async (req, res) => {
  const result = await pool.query("SELECT * FROM students ORDER BY id ASC");
  res.json(result.rows);
});

app.post("/api/attendance", async (req, res) => {
  const { student_id, status } = req.body;
  await pool.query(
    "INSERT INTO attendance(student_id,status) VALUES($1,$2)",
    [student_id, status]
  );
  res.json({ message: "attendance saved" });
});

app.get("/api/attendance", async (req, res) => {
  const result = await pool.query(`
    SELECT attendance.id, students.name, students.class_name,
           attendance.status, attendance.created_at
    FROM attendance
    JOIN students ON students.id = attendance.student_id
    ORDER BY attendance.created_at DESC
  `);
  res.json(result.rows);
});