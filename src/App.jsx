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
    return <Navigate to="/index.html" replace />;
  }

  return children;
}

export default function App() {
  function renderProtectedScreen(screen) {
    if (screen.path === '/candidate-profile.html') {
      return <StudentManagementPage />;
    }
    if (screen.path === '/candidate-detail.html') {
      return <CandidateDetailPage />;
    }
    if (screen.path === '/courses-list.html') {
      return <CoursesListPage />;
    }
    if (screen.path === '/course-view.html') {
      return <CourseViewPage />;
    }
    if (screen.path === '/course-management.html') {
      return <CourseManagementPage />;
    }
    if (screen.path === '/catalog.html') {
      return <CatalogPage />;
    }
    if (screen.path === '/video-content.html') {
      return <VideoContentPage />;
    }
    if (screen.path === '/bunny-admin.html') {
      return <BunnyAdminPage />;
    }
    if (screen.path === '/orders.html') {
      return <OrdersPage />;
    }
    if (screen.path === '/question-bank.html') {
      return <QuestionBankPage />;
    }
    if (screen.path === '/practice-questions.html') {
      return <PracticeQuestionsPage />;
    }
    if (screen.path === '/exam-listing.html') {
      return <ExamListingPage />;
    }
    if (screen.path === '/exam-creation-wizard.html') {
      return <ExamCreationWizardPage />;
    }
    if (screen.path === '/exam-attempt-report.html') {
      return <ExamAttemptReportPage />;
    }
    if (screen.path === '/quiz-listing.html') {
      return <QuizListingPage />;
    }
    if (screen.path === '/quiz-creation.html') {
      return <QuizCreationPage />;
    }
    if (screen.path === '/quiz-attempt-report.html') {
      return <QuizAttemptReportPage />;
    }
    if (screen.path === '/test-series-list.html') {
      return <TestSeriesListPage />;
    }
    if (screen.path === '/mentor-profiles.html') {
      return <MentorProfilesPage />;
    }
    if (screen.path === '/instructor-portfolio.html') {
      return <InstructorPortfolioPage />;
    }
    if (screen.path === '/instructor-payouts.html') {
      return <InstructorPayoutsPage />;
    }
    if (screen.path === '/leads-management.html') {
      return <LeadsManagementPage />;
    }
    if (screen.path === '/batch.html') {
      return <BatchManagementPage />;
    }
    if (screen.path === '/web-content-manager.html') {
      return <WebContentManagerPage />;
    }

    return <LegacyScreenPage screen={screen} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated() ? defaultProtectedRoute : '/index.html'} replace />} />
      {publicScreens.map((screen) => (
        <Route
          key={screen.path}
          path={screen.path}
          element={screen.path === '/verify-token.html' ? <VerifyTokenPage /> : <LoginPage screen={screen} />}
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
