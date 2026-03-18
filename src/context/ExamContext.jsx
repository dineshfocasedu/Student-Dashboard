import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ExamContext = createContext();

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
};

export const ExamProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentExam, setCurrentExam] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [examAttempt, setExamAttempt] = useState(null);

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/exams`);
      setExams(response.data.data);
      return response.data.data;
    } catch (error) {
      toast.error('Failed to fetch exams');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExamById = useCallback(async (examId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/exams/${examId}`);
      setCurrentExam(response.data.data);
      return response.data.data;
    } catch (error) {
      toast.error('Failed to fetch exam details');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const startExam = useCallback(async (examId) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/exams/${examId}/start`);
      setExamAttempt(response.data.data);
      setCurrentExam(response.data.data.exam);
      toast.success('Exam started successfully');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to start exam';
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitExam = useCallback(async (attemptId, answers, videoRecordings, faceDetectionLogs) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/exams/${attemptId}/submit`, {
        answers,
        videoRecordings,
        faceDetectionLogs
      });
      setExamAttempt(null);
      setCurrentExam(null);
      toast.success('Exam submitted successfully');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to submit exam';
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logViolation = useCallback(async (attemptId, type, details, screenshot) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/exams/${attemptId}/violation`, {
        type,
        details,
        screenshot
      });
      
      if (response.data.terminated) {
        toast.error(response.data.message || 'Exam terminated due to violations');
        setExamAttempt(null);
        setCurrentExam(null);
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to log violation:', error);
      return null;
    }
  }, []);

  const saveFaceDetection = useCallback(async (attemptId, facesDetected, imageUrl) => {
    try {
      await axios.post(`${API_BASE_URL}/api/exams/${attemptId}/face-detection`, {
        facesDetected,
        imageUrl
      });
    } catch (error) {
      console.error('Failed to save face detection:', error);
    }
  }, []);

  const getExamResults = useCallback(async (attemptId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/exams/${attemptId}/results`);
      return response.data.data;
    } catch (error) {
      toast.error('Failed to fetch exam results');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createExam = useCallback(async (examData) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/exams`, examData);
      toast.success('Exam created successfully');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create exam';
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExam = useCallback(async (examId, examData) => {
    try {
      setLoading(true);
      const response = await axios.put(`${API_BASE_URL}/api/exams/${examId}`, examData);
      toast.success('Exam updated successfully');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update exam';
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteExam = useCallback(async (examId) => {
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/api/exams/${examId}`);
      toast.success('Exam deleted successfully');
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete exam';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    currentExam,
    exams,
    loading,
    examAttempt,
    fetchExams,
    fetchExamById,
    startExam,
    submitExam,
    logViolation,
    saveFaceDetection,
    getExamResults,
    createExam,
    updateExam,
    deleteExam,
    setCurrentExam
  };

  return (
    <ExamContext.Provider value={value}>
      {children}
    </ExamContext.Provider>
  );
};