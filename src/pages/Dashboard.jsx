import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const StatCard = ({ title, value, bgColor, icon }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold mt-1 text-gray-900">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor}`}>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [attemptsRes, examsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/users/attempts'),
        axios.get('http://localhost:5000/api/exams'),
      ]);
      setStats(attemptsRes.data.data.stats || {});
      setAttempts(attemptsRes.data.data.attempts || []);
      setExams(examsRes.data.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const map = {
      completed: 'bg-green-100 text-green-700',
      terminated: 'bg-red-100 text-red-700',
      'in-progress': 'bg-yellow-100 text-yellow-700',
      submitted: 'bg-blue-100 text-blue-700',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const upcomingExams = exams.filter((e) => e.status === 'published').slice(0, 3);
  const recentAttempts = attempts.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-8 text-white shadow-md">
          <h1 className="text-2xl font-bold">Welcome back, {user?.name || 'Student'}!</h1>
          <p className="mt-1 text-blue-100 capitalize">Role: {user?.role || 'student'}</p>
          <p className="mt-2 text-blue-200 text-sm">
            Ready for your next exam? Check your available exams below.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Attempts" value={stats?.total ?? 0} bgColor="bg-blue-50" icon="📝" />
          <StatCard title="Completed" value={stats?.completed ?? 0} bgColor="bg-green-50" icon="✅" />
          <StatCard
            title="Average Score"
            value={stats?.avgScore != null ? `${Math.round(stats.avgScore)}%` : '—'}
            bgColor="bg-purple-50"
            icon="📊"
          />
          <StatCard
            title="Pass Rate"
            value={stats?.passRate != null ? `${Math.round(stats.passRate)}%` : '—'}
            bgColor="bg-orange-50"
            icon="🏆"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Exams */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Available Exams</h2>
              <Link to="/exams" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            </div>
            <div className="p-6">
              {upcomingExams.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-gray-500">No exams available right now</p>
                  <Link to="/exams" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
                    Browse all exams
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingExams.map((exam) => (
                    <div
                      key={exam._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{exam.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">Duration: {exam.duration} min</p>
                          {exam.startTime && (
                            <p className="text-xs text-gray-400 mt-1">Starts: {formatDate(exam.startTime)}</p>
                          )}
                        </div>
                        <Link
                          to="/exams"
                          className="ml-3 shrink-0 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Take Exam
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Attempts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Recent Attempts</h2>
            </div>
            <div className="p-6">
              {recentAttempts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🎯</div>
                  <p className="text-gray-500">No exam attempts yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start an exam to see your history here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
                        <th className="pb-3 font-medium">Exam</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Score</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentAttempts.map((attempt) => (
                        <tr key={attempt._id} className="hover:bg-gray-50">
                          <td className="py-3 font-medium text-gray-900 max-w-[130px] truncate">
                            {attempt.exam?.title || 'Unknown Exam'}
                          </td>
                          <td className="py-3 text-gray-500 whitespace-nowrap">
                            {formatDate(attempt.startTime || attempt.createdAt)}
                          </td>
                          <td className="py-3 text-gray-700">
                            {attempt.totalScore != null ? attempt.totalScore : '—'}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(
                                attempt.status
                              )}`}
                            >
                              {attempt.status || 'unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;