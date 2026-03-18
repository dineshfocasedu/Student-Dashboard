import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ExamProvider } from './context/ExamContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ExamList from './pages/ExamList';
import ExamRoom from './pages/ExamRoom';
import ExamResults from './pages/ExamResults';
import ProfilePage from './pages/ProfilePage';
import AdminPanel from './pages/admin/AdminPanel';
import CreateExam from './pages/admin/CreateExam';
import ExamAnalytics from './pages/admin/ExamAnalytics';
import Settings from './pages/admin/Settings';
import AdminExams from './pages/admin/AdminExams';
import AdminUsers from './pages/admin/AdminUsers';
import ExamMonitor from './pages/admin/ExamMonitor';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { useAuth } from './context/AuthContext';

const RoleRedirect = () => {
  const { isAdmin, isInstructor } = useAuth();
  if (isAdmin || isInstructor) return <Navigate to="/admin" />;
  return <Dashboard />;
};

// Styles
import './index.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ExamProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
              
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route path="/" element={
                  <ProtectedRoute>
                    <RoleRedirect />
                  </ProtectedRoute>
                } />
                
                <Route path="/exams" element={
                  <ProtectedRoute>
                    <ExamList />
                  </ProtectedRoute>
                } />
                
                <Route path="/exam/:examId" element={
                  <ProtectedRoute>
                    <ExamRoom />
                  </ProtectedRoute>
                } />

                <Route path="/results/:attemptId" element={
                  <ProtectedRoute>
                    <ExamResults />
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                } />
                
                <Route path="/admin/create-exam" element={
                  <AdminRoute>
                    <CreateExam />
                  </AdminRoute>
                } />
                
                <Route path="/admin/analytics/:examId" element={
                  <AdminRoute>
                    <ExamAnalytics />
                  </AdminRoute>
                } />
                
                <Route path="/admin/settings" element={
                  <AdminRoute>
                    <Settings />
                  </AdminRoute>
                } />

                <Route path="/admin/exams" element={
                  <AdminRoute>
                    <AdminExams />
                  </AdminRoute>
                } />

                <Route path="/admin/users" element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                } />

                <Route path="/admin/monitor/:examId" element={
                  <AdminRoute>
                    <ExamMonitor />
                  </AdminRoute>
                } />

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </Router>
        </ExamProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;