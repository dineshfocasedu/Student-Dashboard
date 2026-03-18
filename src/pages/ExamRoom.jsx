import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as faceDetection from '@tensorflow-models/face-detection';
import '@tensorflow/tfjs';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { io } from 'socket.io-client';
import CountdownTimer from '../components/CountdownTimer';

const API = 'http://localhost:5000';

const ExamRoom = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(true);
  const [warnings, setWarnings] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadingExam, setLoadingExam] = useState(true);

  const webcamRef = useRef(null);
  const socketRef = useRef(null);
  const detectorRef = useRef(null);
  const intervalRef = useRef(null);
  const isSubmittedRef = useRef(false);
  const warningsRef = useRef(0);

  // Keep warningsRef in sync
  useEffect(() => { warningsRef.current = warnings; }, [warnings]);

  // Load exam and start attempt
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Fetch exam details
        const examRes = await axios.get(`${API}/api/exams/${examId}`);
        const examData = examRes.data.data;
        setExam(examData);

        // 2. Start attempt to get attemptId
        const startRes = await axios.post(`${API}/api/exams/${examId}/start`);
        const attempt = startRes.data.data;
        setAttemptId(attempt._id);
        setTimeLeft((examData.duration || 60) * 60);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to load exam');
        navigate('/exams');
      } finally {
        setLoadingExam(false);
      }
    };
    init();
  }, [examId, navigate]);

  // Load face detection model
  useEffect(() => {
    const loadModel = async () => {
      try {
        detectorRef.current = await faceDetection.createDetector(
          faceDetection.SupportedModels.MediaPipeFaceDetector,
          { runtime: 'tfjs' }
        );
      } catch (error) {
        console.error('Error loading face detection model:', error);
      }
    };
    loadModel();
  }, []);

  // Socket connection
  useEffect(() => {
    socketRef.current = io(API);
    socketRef.current.emit('join-exam', { examId, userId: localStorage.getItem('userId') });

    socketRef.current.on('exam-ended', () => {
      toast.error('Exam has been ended by admin');
      navigate('/');
    });

    return () => socketRef.current?.disconnect();
  }, [examId, navigate]);

  // Fullscreen monitoring
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      if (!isNowFullscreen && !isSubmittedRef.current) {
        const newWarnings = warningsRef.current + 1;
        setWarnings(newWarnings);
        if (newWarnings >= 3) {
          handleSubmit(true);
        } else {
          toast.error(`Warning ${newWarnings}/3: Please stay in fullscreen mode`);
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Broadcast webcam frame to tutor every 3 seconds
  useEffect(() => {
    const frameInterval = setInterval(() => {
      if (!webcamRef.current || !socketRef.current || isSubmittedRef.current) return;
      const screenshot = webcamRef.current.getScreenshot();
      if (screenshot) {
        socketRef.current.emit('webcam-frame', {
          examId,
          userId: localStorage.getItem('userId'),
          frame: screenshot,
        });
      }
    }, 3000);
    return () => clearInterval(frameInterval);
  }, [examId]);

  // Face detection every 5 seconds
  const detectFaces = useCallback(async () => {
    if (!detectorRef.current || !webcamRef.current?.video || isSubmittedRef.current) return;
    try {
      const faces = await detectorRef.current.estimateFaces(webcamRef.current.video);
      const hasFace = faces.length > 0;
      setFaceDetected(hasFace);
      if (!hasFace) {
        const newWarnings = warningsRef.current + 1;
        setWarnings(newWarnings);
        if (newWarnings >= 3) {
          handleSubmit(true);
        } else {
          toast.error(`Warning ${newWarnings}/3: Face not detected`);
        }
      }
    } catch (error) {
      console.error('Face detection error:', error);
    }
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(detectFaces, 5000);
    return () => clearInterval(intervalRef.current);
  }, [detectFaces]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted) return;
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, isSubmitted]);

  useEffect(() => {
    if (timeLeft === 0 && !isSubmitted && attemptId) {
      handleSubmit(false);
    }
  }, [timeLeft, isSubmitted, attemptId]);

  const handleSubmit = async (forced = false) => {
    if (isSubmittedRef.current || !attemptId) return;
    isSubmittedRef.current = true;
    setIsSubmitted(true);
    clearInterval(intervalRef.current);

    // Format answers array for backend
    const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer: Array.isArray(answer) ? answer : answer,
    }));

    try {
      const res = await axios.post(`${API}/api/exams/${attemptId}/submit`, {
        answers: answersArray,
      });
      toast.success(forced ? 'Exam submitted due to violations' : 'Exam submitted successfully');
      const resultAttemptId = res.data.data?._id || attemptId;
      navigate(`/results/${resultAttemptId}`);
    } catch (error) {
      // Reset so student can retry manually
      isSubmittedRef.current = false;
      setIsSubmitted(false);
      toast.error(error.response?.data?.error || 'Failed to submit exam. Please try again.');
    }
  };

  const handleAnswerChange = (questionId, value, type, optionIndex) => {
    if (type === 'multiple') {
      setAnswers((prev) => {
        const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
        if (current.includes(value)) {
          return { ...prev, [questionId]: current.filter((v) => v !== value) };
        }
        return { ...prev, [questionId]: [...current, value] };
      });
    } else {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    }
  };

  if (loadingExam) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam) return null;

  const question = exam.questions?.[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Main Exam Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold truncate">{exam.title}</h1>
            <CountdownTimer timeLeft={timeLeft} />
          </div>

          {/* Question navigator */}
          <div className="flex flex-wrap gap-2 mb-6">
            {exam.questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-9 h-9 rounded text-sm font-medium transition-colors ${
                  answers[exam.questions[idx]._id]
                    ? 'bg-green-600 text-white'
                    : idx === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
              className="bg-gray-800 p-6 rounded-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400">
                  Question {currentQuestion + 1} of {exam.questions.length}
                </span>
                <span className="text-sm text-blue-400 font-medium capitalize">
                  {question?.questionType?.replace('_', ' ')} · {question?.points ?? 1} pt
                </span>
              </div>

              <p className="text-lg mb-6 leading-relaxed">{question?.questionText}</p>

              {/* MCQ */}
              {question?.questionType === 'mcq' && (
                <div className="space-y-3">
                  {question.options.map((option, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        answers[question._id] === option
                          ? 'bg-blue-600/30 border border-blue-500'
                          : 'bg-gray-700 hover:bg-gray-600 border border-transparent'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${question._id}`}
                        value={option}
                        checked={answers[question._id] === option}
                        onChange={() => handleAnswerChange(question._id, option, 'mcq')}
                        className="accent-blue-500"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Multiple Answer */}
              {question?.questionType === 'multiple' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 mb-2">Select all that apply</p>
                  {question.options.map((option, i) => {
                    const selected = Array.isArray(answers[question._id]) && answers[question._id].includes(option);
                    return (
                      <label
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selected
                            ? 'bg-blue-600/30 border border-blue-500'
                            : 'bg-gray-700 hover:bg-gray-600 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={option}
                          checked={selected}
                          onChange={() => handleAnswerChange(question._id, option, 'multiple')}
                          className="accent-blue-500"
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Essay / Coding */}
              {(question?.questionType === 'essay' || question?.questionType === 'coding') && (
                <textarea
                  value={answers[question._id] || ''}
                  onChange={(e) => handleAnswerChange(question._id, e.target.value, question.questionType)}
                  rows={question.questionType === 'coding' ? 12 : 6}
                  placeholder={question.questionType === 'coding' ? 'Write your code here...' : 'Write your answer here...'}
                  className={`w-full bg-gray-700 text-white rounded-lg p-4 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    question.questionType === 'coding' ? 'font-mono text-sm' : ''
                  }`}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentQuestion((q) => q - 1)}
              disabled={currentQuestion === 0}
              className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {currentQuestion === exam.questions.length - 1 ? (
              <button
                onClick={() => handleSubmit(false)}
                className="px-6 py-2 bg-green-600 rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                Submit Exam
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion((q) => q + 1)}
                className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Webcam Sidebar */}
      <div className="w-72 bg-gray-800 p-4 flex flex-col gap-4 shrink-0">
        <h3 className="text-lg font-semibold">Monitoring</h3>
        <Webcam
          ref={webcamRef}
          className="w-full rounded-lg"
          screenshotFormat="image/jpeg"
          mirrored
        />
        <div className="space-y-2 text-sm">
          <div className={`flex items-center gap-2 ${faceDetected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            Face: {faceDetected ? 'Detected' : 'Not Detected'}
          </div>
          <div className={`flex items-center gap-2 ${isFullscreen ? 'text-green-400' : 'text-yellow-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isFullscreen ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            Fullscreen: {isFullscreen ? 'Active' : 'Inactive'}
          </div>
          <div className={`flex items-center gap-2 ${warnings === 0 ? 'text-green-400' : warnings < 3 ? 'text-yellow-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${warnings === 0 ? 'bg-green-400' : warnings < 3 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
            Warnings: {warnings}/3
          </div>
        </div>

        <div className="mt-auto">
          <div className="text-xs text-gray-500 mb-2">Progress</div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(Object.keys(answers).length / exam.questions.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {Object.keys(answers).length} / {exam.questions.length} answered
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExamRoom;
