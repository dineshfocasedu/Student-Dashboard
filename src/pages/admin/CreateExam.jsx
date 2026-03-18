import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useExam } from '../../context/ExamContext';
import AdminNavbar from '../../components/AdminNavbar';

const defaultQuestion = () => ({
  questionText: '',
  questionType: 'mcq',
  options: ['', '', '', ''],
  correctAnswers: [],
  points: 1,
});

const CreateExam = () => {
  const navigate = useNavigate();
  const { createExam, loading } = useExam();

  const [form, setForm] = useState({
    title: '',
    description: '',
    duration: 60,
    startTime: '',
    endTime: '',
    passingScore: 60,
    status: 'draft',
  });

  const [questions, setQuestions] = useState([defaultQuestion()]);
  const [submitting, setSubmitting] = useState(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Question handlers
  const updateQuestion = (idx, field, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      // Reset correctAnswers when type changes
      if (field === 'questionType') {
        updated[idx].correctAnswers = [];
        updated[idx].options = ['', '', '', ''];
      }
      return updated;
    });
  };

  const updateOption = (qIdx, optIdx, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const opts = [...updated[qIdx].options];
      opts[optIdx] = value;
      updated[qIdx] = { ...updated[qIdx], options: opts };
      return updated;
    });
  };

  const toggleCorrectAnswer = (qIdx, value, isMultiple) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const q = { ...updated[qIdx] };
      if (isMultiple) {
        const set = new Set(q.correctAnswers);
        set.has(value) ? set.delete(value) : set.add(value);
        q.correctAnswers = Array.from(set);
      } else {
        q.correctAnswers = [value];
      }
      updated[qIdx] = q;
      return updated;
    });
  };

  const addQuestion = () => setQuestions((prev) => [...prev, defaultQuestion()]);

  const removeQuestion = (idx) => {
    if (questions.length === 1) return toast.error('At least one question is required');
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.startTime || !form.endTime) return toast.error('Start and end times are required');
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      return toast.error('End time must be after start time');
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return toast.error(`Question ${i + 1} text is required`);
      if (['mcq', 'multiple_answer'].includes(q.questionType)) {
        const filledOpts = q.options.filter((o) => o.trim());
        if (filledOpts.length < 2) return toast.error(`Question ${i + 1} needs at least 2 options`);
        if (q.correctAnswers.length === 0) return toast.error(`Question ${i + 1} needs a correct answer`);
      }
    }

    setSubmitting(true);
    const payload = {
      ...form,
      duration: Number(form.duration),
      passingScore: Number(form.passingScore),
      questions: questions.map((q) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        points: Number(q.points),
        ...((['mcq', 'multiple_answer'].includes(q.questionType)) && {
          options: q.options.filter((o) => o.trim()).map((text, i) => ({
            text,
            label: String.fromCharCode(65 + i),
          })),
          correctAnswers: q.correctAnswers,
        }),
      })),
    };

    const result = await createExam(payload);
    setSubmitting(false);
    if (result) {
      navigate('/admin/exams');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Exam</h1>
            <p className="text-gray-500 mt-1">Fill in the details to create a new exam</p>
          </div>
          <button
            onClick={() => navigate('/admin/exams')}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Exam Details</h2>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. JavaScript Fundamentals"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Brief description of this exam"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="duration"
                    min={1}
                    value={form.duration}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
                  <input
                    type="number"
                    name="passingScore"
                    min={0}
                    max={100}
                    value={form.passingScore}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
                <p className="text-sm text-gray-500 mt-0.5">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Question
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">Question {qIdx + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Question Text <span className="text-red-500">*</span></label>
                      <textarea
                        value={q.questionText}
                        onChange={(e) => updateQuestion(qIdx, 'questionText', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                        placeholder="Enter question text"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Question Type</label>
                        <select
                          value={q.questionType}
                          onChange={(e) => updateQuestion(qIdx, 'questionType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="mcq">Multiple Choice (MCQ)</option>
                          <option value="multiple_answer">Multiple Answer</option>
                          <option value="essay">Essay</option>
                          <option value="coding">Coding</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Points</label>
                        <input
                          type="number"
                          min={1}
                          value={q.points}
                          onChange={(e) => updateQuestion(qIdx, 'points', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    </div>

                    {/* MCQ / Multiple Answer options */}
                    {(q.questionType === 'mcq' || q.questionType === 'multiple_answer') && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          Options &amp; Correct Answer{q.questionType === 'multiple_answer' ? 's' : ''}
                        </label>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => {
                            const label = String.fromCharCode(65 + optIdx);
                            const isChecked = q.correctAnswers.includes(label);
                            return (
                              <div key={optIdx} className="flex items-center gap-3">
                                {q.questionType === 'mcq' ? (
                                  <input
                                    type="radio"
                                    name={`correct-${qIdx}`}
                                    checked={isChecked}
                                    onChange={() => toggleCorrectAnswer(qIdx, label, false)}
                                    className="text-blue-600 focus:ring-blue-500"
                                  />
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleCorrectAnswer(qIdx, label, true)}
                                    className="text-blue-600 focus:ring-blue-500 rounded"
                                  />
                                )}
                                <span className="text-xs font-bold text-gray-500 w-5">{label}.</span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                  placeholder={`Option ${label}`}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {q.questionType === 'mcq'
                            ? 'Select the radio button next to the correct answer'
                            : 'Check all correct answers'}
                        </p>
                      </div>
                    )}

                    {(q.questionType === 'essay' || q.questionType === 'coding') && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-600">
                          {q.questionType === 'essay'
                            ? 'Essay questions require manual grading by the instructor.'
                            : 'Coding questions will accept free-form code as answers.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pb-8">
            <button
              type="button"
              onClick={() => navigate('/admin/exams')}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting || loading ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExam;