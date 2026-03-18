import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';

const StatusBadge = ({ status }) => {
  const map = {
    published: 'bg-green-100 text-green-700',
    draft: 'bg-yellow-100 text-yellow-700',
    archived: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status || 'unknown'}
    </span>
  );
};

const ExamList = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('http://localhost:5000/api/exams');
      setExams(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load exams');
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const truncate = (text, max = 100) => {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '...' : text;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Available Exams</h1>
          <p className="text-gray-500 mt-1">Browse and start your exams</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchExams}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No exams available</h3>
            <p className="text-gray-500">Check back later for upcoming exams.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div
                key={exam._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all flex flex-col"
              >
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900 leading-tight flex-1 mr-2">
                      {exam.title}
                    </h2>
                    <StatusBadge status={exam.status} />
                  </div>

                  {exam.description && (
                    <p className="text-sm text-gray-500 mb-4">{truncate(exam.description)}</p>
                  )}

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">⏱</span>
                      <span>{exam.duration} minutes</span>
                    </div>
                    {exam.startTime && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">🗓</span>
                        <span>Starts: {formatDate(exam.startTime)}</span>
                      </div>
                    )}
                    {exam.endTime && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">🏁</span>
                        <span>Ends: {formatDate(exam.endTime)}</span>
                      </div>
                    )}
                    {exam.passingScore != null && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">✅</span>
                        <span>Passing score: {exam.passingScore}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <button
                    onClick={() => navigate(`/exam/${exam._id}`)}
                    disabled={exam.status !== 'published'}
                    className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${
                      exam.status === 'published'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {exam.status === 'published' ? 'Start Exam' : 'Not Available'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamList;