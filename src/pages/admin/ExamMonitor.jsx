import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import AdminNavbar from '../../components/AdminNavbar';

const API = 'http://localhost:5000';

const ExamMonitor = () => {
  const { examId } = useParams();
  const socketRef = useRef(null);
  const [students, setStudents] = useState({}); // { userId: { frame, warnings } }

  useEffect(() => {
    socketRef.current = io(API);

    // Join the monitor room for this exam
    socketRef.current.emit('join-monitor', { examId });

    socketRef.current.on('student-frame', ({ userId, frame }) => {
      setStudents((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], frame },
      }));
    });

    socketRef.current.on('student-violation', ({ userId, type }) => {
      setStudents((prev) => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          warnings: ((prev[userId]?.warnings) || 0) + 1,
          lastViolation: type,
        },
      }));
    });

    return () => socketRef.current?.disconnect();
  }, [examId]);

  const studentList = Object.entries(students);

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Live Exam Monitor</h1>
        <p className="text-sm text-gray-500 mb-6">
          Exam ID: {examId} — {studentList.length} student(s) connected
        </p>

        {studentList.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">
            <p className="text-lg">No students have joined yet.</p>
            <p className="text-sm mt-1">Webcam feeds will appear here as students start the exam.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {studentList.map(([userId, data]) => (
              <div
                key={userId}
                className="bg-white rounded-xl shadow overflow-hidden"
              >
                {data.frame ? (
                  <img
                    src={data.frame}
                    alt={`Student ${userId}`}
                    className="w-full object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                    Waiting for video...
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs text-gray-500 truncate font-mono">ID: {userId}</p>
                  {data.warnings > 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Warnings: {data.warnings}
                      {data.lastViolation && ` — ${data.lastViolation}`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamMonitor;
