import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AdminNavbar from '../../components/AdminNavbar';

const StatCard = ({ title, value, bgColor }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className={`text-3xl font-bold mt-1 ${bgColor}`}>{value}</p>
  </div>
);

const statusBadgeClass = (status) => {
  const map = {
    completed: 'bg-green-100 text-green-700',
    terminated: 'bg-red-100 text-red-700',
    'in-progress': 'bg-yellow-100 text-yellow-700',
    submitted: 'bg-blue-100 text-blue-700',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

const ExamAnalytics = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [examRes, attemptsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/admin/exams/${examId}`),
        axios.get(`http://localhost:5000/api/admin/exams/${examId}/attempts`),
      ]);
      setExam(examRes.data.data);
      setAttempts(attemptsRes.data.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load exam analytics');
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [examId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Compute stats from attempts
  const completedAttempts = attempts.filter((a) => a.status === 'completed' || a.status === 'submitted');
  const completionRate = attempts.length > 0 ? Math.round((completedAttempts.length / attempts.length) * 100) : 0;
  const avgScore = completedAttempts.length > 0
    ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.percentage ?? a.score ?? 0), 0) / completedAttempts.length)
    : 0;
  const passedAttempts = completedAttempts.filter((a) => a.passed === true || (a.percentage ?? 0) >= (exam?.passingScore ?? 50));
  const passRate = completedAttempts.length > 0 ? Math.round((passedAttempts.length / completedAttempts.length) * 100) : 0;

  const totalViolations = attempts.reduce((sum, a) => sum + (a.violations?.length ?? a.violationsCount ?? 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 mb-4">{error || 'Exam not found'}</p>
          <div className="flex justify-center gap-3">
            <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              Retry
            </button>
            <button onClick={() => navigate('/admin/exams')} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
              Back to Exams
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => navigate('/admin/exams')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                exam.status === 'published' ? 'bg-green-100 text-green-700'
                  : exam.status === 'draft' ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {exam.status}
              </span>
            </div>
            {exam.description && <p className="text-gray-500 text-sm">{exam.description}</p>}
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span>Duration: {exam.duration} min</span>
              {exam.passingScore != null && <span>Passing Score: {exam.passingScore}%</span>}
              <span>Questions: {exam.questions?.length ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Attempts" value={attempts.length} bgColor="text-blue-600" />
          <StatCard title="Completion Rate" value={`${completionRate}%`} bgColor="text-green-600" />
          <StatCard title="Average Score" value={completedAttempts.length > 0 ? `${avgScore}%` : '—'} bgColor="text-purple-600" />
          <StatCard title="Pass Rate" value={completedAttempts.length > 0 ? `${passRate}%` : '—'} bgColor="text-orange-600" />
        </div>

        {/* Attempts Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Attempt Details</h2>
            <p className="text-sm text-gray-500 mt-0.5">{attempts.length} total attempt{attempts.length !== 1 ? 's' : ''}</p>
          </div>
          {attempts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-gray-500">No attempts recorded for this exam yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 font-medium">Student</th>
                    <th className="px-6 py-4 font-medium">Started At</th>
                    <th className="px-6 py-4 font-medium">Score</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Violations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attempts.map((attempt) => (
                    <tr key={attempt._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {attempt.user?.name || attempt.student?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {attempt.user?.email || attempt.student?.email || ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(attempt.startTime)}</td>
                      <td className="px-6 py-4">
                        {attempt.percentage != null ? (
                          <div>
                            <span className="font-semibold text-gray-900">{Math.round(attempt.percentage)}%</span>
                            {attempt.totalScore != null && (
                              <span className="text-xs text-gray-400 ml-1">({attempt.totalScore} pts)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusBadgeClass(attempt.status)}`}>
                          {attempt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${(attempt.violations?.length ?? attempt.violationsCount ?? 0) > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {attempt.violations?.length ?? attempt.violationsCount ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Violations Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Violations Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{totalViolations}</p>
              <p className="text-sm text-red-500 mt-1">Total Violations</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">
                {attempts.filter((a) => (a.violations?.length ?? a.violationsCount ?? 0) > 0).length}
              </p>
              <p className="text-sm text-orange-500 mt-1">Attempts with Violations</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {attempts.filter((a) => a.status === 'terminated').length}
              </p>
              <p className="text-sm text-yellow-600 mt-1">Terminated Attempts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamAnalytics;