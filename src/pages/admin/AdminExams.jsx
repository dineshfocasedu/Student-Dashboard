import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useExam } from '../../context/ExamContext';
import AdminNavbar from '../../components/AdminNavbar';

const STATUS_OPTIONS = ['all', 'draft', 'published', 'archived'];

const statusBadgeClass = (status) => {
  const map = {
    published: 'bg-green-100 text-green-700',
    draft: 'bg-yellow-100 text-yellow-700',
    archived: 'bg-gray-100 text-gray-600',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

const AdminExams = () => {
  const navigate = useNavigate();
  const { deleteExam } = useExam();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      const res = await axios.get(`http://localhost:5000/api/admin/exams?${params.toString()}`);
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
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchExams();
  };

  const handleStatusChange = async (examId, newStatus) => {
    try {
      setUpdatingStatusId(examId);
      await axios.put(`http://localhost:5000/api/admin/exams/${examId}/status`, { status: newStatus });
      toast.success('Exam status updated');
      setExams((prev) =>
        prev.map((e) => (e._id === examId ? { ...e, status: newStatus } : e))
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to update exam status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = async (examId) => {
    try {
      setDeletingId(examId);
      const success = await deleteExam(examId);
      if (success) {
        setExams((prev) => prev.filter((e) => e._id !== examId));
      }
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exam Management</h1>
            <p className="text-gray-500 mt-1">Create and manage all exams</p>
          </div>
          <Link
            to="/admin/create-exam"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create Exam
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search exams by title..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white capitalize"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-3">{error}</p>
              <button onClick={fetchExams} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                Retry
              </button>
            </div>
          ) : exams.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No exams found</h3>
              <p className="text-gray-500 text-sm mb-4">Try adjusting your search or filters.</p>
              <Link to="/admin/create-exam" className="text-blue-600 hover:underline text-sm font-medium">
                Create your first exam
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 font-medium">Title</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Questions</th>
                    <th className="px-6 py-4 font-medium">Attempts</th>
                    <th className="px-6 py-4 font-medium">Created</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {exams.map((exam) => (
                    <tr key={exam._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{exam.title}</p>
                          {exam.description && (
                            <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">{exam.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusBadgeClass(exam.status)}`}>
                          {exam.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {exam.questions?.length ?? exam.questionsCount ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {exam.attemptCount ?? exam.attempts ?? 0}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(exam.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/analytics/${exam._id}`}
                            className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Analytics
                          </Link>

                          <Link
                            to={`/admin/monitor/${exam._id}`}
                            className="px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            Monitor
                          </Link>

                          <select
                            value={exam.status}
                            onChange={(e) => handleStatusChange(exam._id, e.target.value)}
                            disabled={updatingStatusId === exam._id}
                            className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                          </select>

                          {confirmDeleteId === exam._id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(exam._id)}
                                disabled={deletingId === exam._id}
                                className="px-2.5 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                              >
                                {deletingId === exam._id ? '...' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(exam._id)}
                              className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
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
  );
};

export default AdminExams;
