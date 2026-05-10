import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [students, setStudents] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadBackend();
    loadStudents();
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

  const markAttendance = async (id, status) => {
    await axios.post("/api/attendance", {
      student_id: id,
      status,
    });

    alert(`Attendance saved: ${status}`);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navbar */}
      <div className="bg-slate-900 text-white px-8 py-4 shadow-lg">
        <h1 className="text-3xl font-bold">
          School Attendance Dashboard
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow">
            <p className="text-gray-500">Backend Status</p>

            <h2 className="text-2xl font-bold text-green-600 mt-2">
              {status}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <p className="text-gray-500">Total Students</p>

            <h2 className="text-3xl font-bold mt-2">
              {students.length}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <p className="text-gray-500">System</p>

            <h2 className="text-2xl font-bold text-blue-600 mt-2">
              Kubernetes Running
            </h2>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-2xl font-bold">
              Student Attendance
            </h2>
          </div>

          <div className="divide-y">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50"
              >
                <div>
                  <h3 className="text-lg font-semibold">
                    {student.name}
                  </h3>

                  <p className="text-gray-500">
                    {student.class_name}
                  </p>
                </div>

                <div className="space-x-3">
                  <button
                    onClick={() =>
                      markAttendance(student.id, "present")
                    }
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition"
                  >
                    Present
                  </button>

                  <button
                    onClick={() =>
                      markAttendance(student.id, "absent")
                    }
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition"
                  >
                    Absent
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;