import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';

const ExamResults = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/exams/${attemptId}/results`);
      setResults(res.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load results');
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [attemptId]);

  const formatDuration = (ms) => {
    if (ms == null) return '—';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
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

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-gray-500 mb-4">{error || 'Results not found'}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={fetchResults}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const passed = results.passed ?? (results.percentage >= (results.exam?.passingScore || 50));
  const answers = results.answers || results.questionResults || [];
  const timeTaken = results.timeTaken ?? (
    results.startTime && results.endTime
      ? new Date(results.endTime) - new Date(results.startTime)
      : null
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
            {results.exam?.title && (
              <p className="text-gray-500 mt-1">{results.exam.title}</p>
            )}
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Score Summary Card */}
        <div className={`rounded-xl shadow-sm border-2 p-6 mb-6 ${passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <div className="text-6xl font-bold mb-1" style={{ color: passed ? '#16a34a' : '#dc2626' }}>
                {results.percentage != null ? `${Math.round(results.percentage)}%` : '—'}
              </div>
              <p className="text-gray-600 text-sm">
                Score: <span className="font-semibold">{results.totalScore ?? results.score ?? '—'}</span>
                {results.maxScore != null && <span> / {results.maxScore}</span>}
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className={`text-2xl font-bold px-6 py-2 rounded-full ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {passed ? '✓ PASSED' : '✗ FAILED'}
              </span>
              {results.exam?.passingScore != null && (
                <p className="text-xs text-gray-500">Passing score: {results.exam.passingScore}%</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center">
            <p className="text-sm text-gray-500 mb-1">Time Taken</p>
            <p className="text-xl font-bold text-gray-900">{formatDuration(timeTaken)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center">
            <p className="text-sm text-gray-500 mb-1">Submitted At</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(results.endTime || results.submittedAt)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center">
            <p className="text-sm text-gray-500 mb-1">Violations</p>
            <p className="text-xl font-bold text-gray-900">
              {results.violationsCount ?? results.violations?.length ?? 0}
            </p>
          </div>
        </div>

        {/* Question Review */}
        {answers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Question Review</h2>
              <p className="text-sm text-gray-500 mt-1">{answers.length} question{answers.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="divide-y divide-gray-100">
              {answers.map((item, idx) => {
                const isCorrect = item.isCorrect ?? (item.pointsEarned > 0);
                const questionText = item.question?.questionText || item.questionText || `Question ${idx + 1}`;
                const studentAnswer = Array.isArray(item.selectedAnswer)
                  ? item.selectedAnswer.join(', ')
                  : (item.selectedAnswer ?? item.answer ?? '—');
                const correctAnswer = Array.isArray(item.correctAnswer)
                  ? item.correctAnswer.join(', ')
                  : (item.question?.correctAnswers?.join(', ') ?? item.correctAnswer ?? '—');
                const pointsEarned = item.pointsEarned ?? item.score ?? 0;
                const totalPoints = item.question?.points ?? item.points ?? item.maxPoints ?? '?';

                return (
                  <div key={idx} className="p-6">
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                        isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {isCorrect ? '✓' : '✗'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <p className="text-sm font-medium text-gray-900">{questionText}</p>
                          <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                            isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {pointsEarned} / {totalPoints} pts
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Your Answer</p>
                            <p className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                              {studentAnswer || 'No answer provided'}
                            </p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Correct Answer</p>
                            <p className="font-medium text-green-700">{correctAnswer}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamResults;
