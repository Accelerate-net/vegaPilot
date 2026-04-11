import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import CandidateDetailPage from './pages/CandidateDetailPage';
import CatalogPage from './pages/CatalogPage';
import ExamAttemptReportPage from './pages/ExamAttemptReportPage';
import ExamCreationWizardPage from './pages/ExamCreationWizardPage';
import BatchManagementPage from './pages/BatchManagementPage';
import BunnyAdminPage from './pages/BunnyAdminPage';
import CourseManagementPage from './pages/CourseManagementPage';
import CourseViewPage from './pages/CourseViewPage';
import CoursesListPage from './pages/CoursesListPage';
import ExamListingPage from './pages/ExamListingPage';
import InstructorPayoutsPage from './pages/InstructorPayoutsPage';
import InstructorPortfolioPage from './pages/InstructorPortfolioPage';
import LeadsManagementPage from './pages/LeadsManagementPage';
import LoginPage from './pages/LoginPage';
import MentorProfilesPage from './pages/MentorProfilesPage';
import OrdersPage from './pages/OrdersPage';
import PracticeQuestionsPage from './pages/PracticeQuestionsPage';
import QuestionBankPage from './pages/QuestionBankPage';
import QuizAttemptReportPage from './pages/QuizAttemptReportPage';
import QuizCreationPage from './pages/QuizCreationPage';
import QuizListingPage from './pages/QuizListingPage';
import VideoContentPage from './pages/VideoContentPage';
import LegacyScreenPage from './pages/LegacyScreenPage';
import StudentManagementPage from './pages/StudentManagementPage';
import TestSeriesListPage from './pages/TestSeriesListPage';
import VerifyTokenPage from './pages/VerifyTokenPage';
import WebContentManagerPage from './pages/WebContentManagerPage';
import { isAuthenticated } from './lib/auth';
import { defaultProtectedRoute, protectedScreens, publicScreens } from './lib/legacyScreens';

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  function renderProtectedScreen(screen) {
    if (screen.path === '/candidate-profile') {
      return <StudentManagementPage />;
    }
    if (screen.path === '/candidate-detail') {
      return <CandidateDetailPage />;
    }
    if (screen.path === '/courses-list') {
      return <CoursesListPage />;
    }
    if (screen.path === '/course-view') {
      return <CourseViewPage />;
    }
    if (screen.path === '/course-management') {
      return <CourseManagementPage />;
    }
    if (screen.path === '/catalog') {
      return <CatalogPage />;
    }
    if (screen.path === '/video-content') {
      return <VideoContentPage />;
    }
    if (screen.path === '/bunny-admin') {
      return <BunnyAdminPage />;
    }
    if (screen.path === '/orders') {
      return <OrdersPage />;
    }
    if (screen.path === '/question-bank') {
      return <QuestionBankPage />;
    }
    if (screen.path === '/practice-questions') {
      return <PracticeQuestionsPage />;
    }
    if (screen.path === '/exam-listing') {
      return <ExamListingPage />;
    }
    if (screen.path === '/exam-creation-wizard') {
      return <ExamCreationWizardPage />;
    }
    if (screen.path === '/exam-attempt-report') {
      return <ExamAttemptReportPage />;
    }
    if (screen.path === '/quiz-listing') {
      return <QuizListingPage />;
    }
    if (screen.path === '/quiz-creation') {
      return <QuizCreationPage />;
    }
    if (screen.path === '/quiz-attempt-report') {
      return <QuizAttemptReportPage />;
    }
    if (screen.path === '/test-series-list') {
      return <TestSeriesListPage />;
    }
    if (screen.path === '/mentor-profiles') {
      return <MentorProfilesPage />;
    }
    if (screen.path === '/instructor-portfolio') {
      return <InstructorPortfolioPage />;
    }
    if (screen.path === '/instructor-payouts') {
      return <InstructorPayoutsPage />;
    }
    if (screen.path === '/leads-management') {
      return <LeadsManagementPage />;
    }
    if (screen.path === '/batch') {
      return <BatchManagementPage />;
    }
    if (screen.path === '/web-content-manager') {
      return <WebContentManagerPage />;
    }

    return <LegacyScreenPage screen={screen} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated() ? defaultProtectedRoute : '/login'} replace />} />
      {publicScreens.map((screen) => (
        <Route
          key={screen.path}
          path={screen.path}
          element={screen.path === '/verify-token' ? <VerifyTokenPage /> : <LoginPage screen={screen} />}
        />
      ))}
      {protectedScreens.map((screen) => (
        <Route
          key={screen.path}
          path={screen.path}
          element={
            <ProtectedRoute>
              <Layout currentScreen={screen}>
                {renderProtectedScreen(screen)}
              </Layout>
            </ProtectedRoute>
          }
        />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
