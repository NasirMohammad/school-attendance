import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("");

  const [newName, setNewName] = useState("");
  const [newClass, setNewClass] = useState("");

  useEffect(() => {
    loadBackend();
    loadStudents();
    loadAttendance();
  }, []);

  const loadBackend = async () => {
    try {
      const res = await axios.get("/api/");
      setStatus(`${res.data.version} - ${res.data.status}`);
    } catch {
      setStatus("Disconnected");
    }
  };

  const loadStudents = async () => {
    const res = await axios.get("/api/students");
    setStudents(res.data);
  };

  const loadAttendance = async () => {
    const res = await axios.get("/api/attendance");
    setRecords(res.data);
  };

  const addStudent = async (e) => {
    e.preventDefault();

    await axios.post("/api/students", {
      name: newName,
      class_name: newClass,
    });

    setNewName("");
    setNewClass("");
    await loadStudents();
  };

  const markAttendance = async (id, status) => {
    await axios.post("/api/attendance", {
      student_id: id,
      status,
    });

    await loadAttendance();
  };

  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-slate-900 text-white px-8 py-4 shadow-lg">
        <h1 className="text-3xl font-bold">
          School Attendance Dashboard CI/CD Success
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow">
            <p className="text-gray-500">Backend</p>
            <h2 className="text-2xl font-bold text-green-600 mt-2">
              {status}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <p className="text-gray-500">Students</p>
            <h2 className="text-3xl font-bold mt-2">{students.length}</h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <p className="text-gray-500">Present Records</p>
            <h2 className="text-3xl font-bold text-green-600 mt-2">
              {presentCount}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <p className="text-gray-500">Absent Records</p>
            <h2 className="text-3xl font-bold text-red-600 mt-2">
              {absentCount}
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-2xl font-bold">Student Attendance</h2>
          </div>

          <div className="p-6 border-b bg-slate-50">
            <form
              onSubmit={addStudent}
              className="grid md:grid-cols-3 gap-4"
            >
              <input
                type="text"
                placeholder="Student Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="border border-slate-300 rounded-lg px-4 py-2"
                required
              />

              <input
                type="text"
                placeholder="Class Name"
                value={newClass}
                onChange={(e) => setNewClass(e.target.value)}
                className="border border-slate-300 rounded-lg px-4 py-2"
                required
              />

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
              >
                Add Student
              </button>
            </form>
          </div>

          <div className="divide-y">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50"
              >
                <div>
                  <h3 className="text-lg font-semibold">{student.name}</h3>
                  <p className="text-gray-500">{student.class_name}</p>
                </div>

                <div className="space-x-3">
                  <button
                    onClick={() => markAttendance(student.id, "present")}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition"
                  >
                    Present
                  </button>

                  <button
                    onClick={() => markAttendance(student.id, "absent")}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition"
                  >
                    Absent
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-2xl font-bold">Attendance History</h2>
          </div>

          <table className="w-full text-left">
            <thead className="bg-slate-200">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Class</th>
                <th className="p-4">Status</th>
                <th className="p-4">Time</th>
              </tr>
            </thead>

            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b hover:bg-slate-50">
                  <td className="p-4 font-semibold">{record.name}</td>
                  <td className="p-4">{record.class_name}</td>
                  <td className="p-4">
                    <span
                      className={
                        record.status === "present"
                          ? "bg-green-100 text-green-700 px-3 py-1 rounded-full"
                          : "bg-red-100 text-red-700 px-3 py-1 rounded-full"
                      }
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {new Date(record.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;