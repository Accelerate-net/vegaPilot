import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import UserProvider from './components/UserProvider';
import CandidateDetailPage from './pages/CandidateDetailPage';
import CatalogPage from './pages/CatalogPage';
import ExamAttemptReportPage from './pages/ExamAttemptReportPage';
import ExamCreationWizardPage from './pages/ExamCreationWizardPage';
import BatchManagementPage from './pages/BatchManagementPage';
import BunnyAdminPage from './pages/BunnyAdminPage';
import ClassNotesPage from './pages/ClassNotesPage';
import CourseManagementPage from './pages/CourseManagementPage';
import CourseViewPage from './pages/CourseViewPage';
import CoursesListPage from './pages/CoursesListPage';
import ExamListingPage from './pages/ExamListingPage';
import FeedbackSummaryPage from './pages/FeedbackSummaryPage';
import InstructorPayoutsPage from './pages/InstructorPayoutsPage';
import InstructorPortfolioPage from './pages/InstructorPortfolioPage';
import LeadsManagementPage from './pages/LeadsManagementPage';
import LiveClassActivityPlannerPage from './pages/LiveClassActivityPlannerPage';
import LiveClassSchedulerPage from './pages/LiveClassSchedulerPage';
import SchedulesPage from './pages/SchedulesPage';
import SchedulesListPage from './pages/SchedulesListPage';
import LoginPage from './pages/LoginPage';
import MentorProfilesPage from './pages/MentorProfilesPage';
import MentorSessionsPage from './pages/MentorSessionsPage';
import OrdersPage from './pages/OrdersPage';
import PaymentsPage from './pages/PaymentsPage';
import CommerceReportsPage from './pages/CommerceReportsPage';
import PracticeQuestionsPage from './pages/PracticeQuestionsPage';
import QuestionBankPage from './pages/QuestionBankPage';
import QuizAttemptReportPage from './pages/QuizAttemptReportPage';
import QuizCreationPage from './pages/QuizCreationPage';
import QuizListingPage from './pages/QuizListingPage';
import VideoContentPage from './pages/VideoContentPage';
import LegacyScreenPage from './pages/LegacyScreenPage';
import SurveyDashboardPage from './pages/SurveyDashboardPage';
import StudentManagementPage from './pages/StudentManagementPage';
import Student360Page from './pages/Student360Page';
import TestSeriesListPage from './pages/TestSeriesListPage';
import VerifyTokenPage from './pages/VerifyTokenPage';
import WebContentManagerPage from './pages/WebContentManagerPage';
import SupportPage from './pages/SupportPage';
import MessengerPage from './pages/MessengerPage';
import ResidenceManagementPage from './pages/ResidenceManagementPage';
import OfflineAttendancePage from './pages/OfflineAttendancePage';
import AttendanceMappingPage from './pages/AttendanceMappingPage';
import DefaultAttendanceLocationPage from './pages/DefaultAttendanceLocationPage';
import AssetsPage from './pages/AssetsPage';
import IcardGeneratorPage from './pages/IcardGeneratorPage';
import LandingPage from './pages/LandingPage';
import DigitalSignagePage from './pages/DigitalSignagePage';
import MobileAppSettingsPage from './pages/MobileAppSettingsPage';
import FormsPage from './pages/FormsPage';
import { BrandingStagePage } from './features/branding';
import PermissionsPage from './pages/PermissionsPage';
import UserAccountsPage from './pages/UserAccountsPage';
import LocationsPage from './pages/LocationsPage';
import { isAuthenticated } from './lib/auth';
import { defaultProtectedRoute, protectedScreens, publicScreens } from './lib/legacyScreens';
import { getCachedUser, useUser } from './lib/userStore';
import { canAccess, isSuperAdmin } from './lib/roles';
import { has as permHas } from './lib/permissions';
import { setFlash } from './lib/flash';

function ProtectedRoute({ screen, children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  const user = getCachedUser();

  // Legacy role-based check (kept for backwards compat with roles.js)
  if (user?.role && !canAccess(user.role, screen.path)) {
    return <Navigate to={defaultProtectedRoute} replace />;
  }

  // RBAC permission gate. SUPER_ADMIN (perms === '*' or contains '*') bypasses.
  // If permissions haven't loaded yet (initial render before /me resolves) and
  // the user already has a token, allow through — the page itself will receive
  // a 403 from the API if the user truly lacks access, which is fine.
  const perms = user?.permissions;
  if (screen.viewPermission && Array.isArray(perms) && perms.length > 0) {
    if (!permHas(perms, screen.viewPermission)) {
      setFlash?.({ type: 'error', title: 'Access denied', message: "You don't have access to this page" });
      return <Navigate to={defaultProtectedRoute} replace />;
    }
  }

  return children;
}

function SuperAdminRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  const ctx = useUser();
  const user = ctx?.user || getCachedUser();
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const perms = Array.isArray(user?.permissions) ? user.permissions : [];

  // Identity from /me hasn't loaded yet — let the page render. The API will
  // 403 if the user truly isn't SUPER_ADMIN, same pattern as ProtectedRoute.
  if (roles.length === 0 && perms.length === 0 && !isSuperAdmin(user)) {
    return children;
  }

  const sa = isSuperAdmin(user) || perms.includes('*');
  if (!sa) {
    setFlash({ type: 'error', title: 'Access denied', message: "You don't have access to this page" });
    return <Navigate to={defaultProtectedRoute} replace />;
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
    if (screen.path === '/student-360') {
      return <Student360Page />;
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
    if (screen.path === '/class-notes') {
      return <ClassNotesPage />;
    }
    if (screen.path === '/orders') {
      return <OrdersPage />;
    }
    if (screen.path === '/payments') {
      return <PaymentsPage />;
    }
    if (screen.path === '/commerce-reports') {
      return <CommerceReportsPage />;
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
    if (screen.path === '/mentor-sessions') {
      return <MentorSessionsPage />;
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
    if (screen.path === '/support') {
      return <SupportPage />;
    }
    if (screen.path === '/feedback-summary') {
      return <FeedbackSummaryPage />;
    }
    if (screen.path === '/live-class-scheduler') {
      return <LiveClassSchedulerPage />;
    }
    if (screen.path === '/schedules') {
      return <SchedulesPage />;
    }
    if (screen.path === '/schedule-list') {
      return <SchedulesListPage />;
    }
    if (screen.path === '/live-class-activity-planner') {
      return <LiveClassActivityPlannerPage />;
    }
    if (screen.path === '/survey-dashboard') {
      return <SurveyDashboardPage />;
    }
    if (screen.path === '/messenger') {
      return <MessengerPage />;
    }
    if (screen.path === '/residences') {
      return <ResidenceManagementPage />;
    }
    if (screen.path === '/offline-attendance') {
      return <OfflineAttendancePage />;
    }
    if (screen.path === '/attendance-mapping') {
      return <AttendanceMappingPage />;
    }
    if (screen.path === '/attendance-capture-location') {
      return <DefaultAttendanceLocationPage />;
    }
    if (screen.path === '/assets') {
      return <AssetsPage />;
    }
    if (screen.path === '/icard-generator') {
      return <IcardGeneratorPage />;
    }
    if (screen.path === '/landing') {
      return <LandingPage />;
    }
    if (screen.path === '/digital-signage') {
      return <DigitalSignagePage />;
    }
    if (screen.path === '/mobile-app-settings') {
      return <MobileAppSettingsPage />;
    }
    if (screen.path === '/forms') {
      return <FormsPage />;
    }

    return <LegacyScreenPage screen={screen} />;
  }

  return (
    <UserProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        {publicScreens.map((screen) => {
          if (screen.path === '/verify-token') {
            return <Route key={screen.path} path={screen.path} element={<VerifyTokenPage />} />;
          }
          if (screen.path === '/login') {
            // If already authenticated, skip the login form and go to /landing.
            return (
              <Route
                key={screen.path}
                path={screen.path}
                element={
                  isAuthenticated()
                    ? <Navigate to={defaultProtectedRoute} replace />
                    : <LoginPage screen={screen} />
                }
              />
            );
          }
          return <Route key={screen.path} path={screen.path} element={<LoginPage screen={screen} />} />;
        })}
        <Route
          path="/permission"
          element={
            <SuperAdminRoute>
              <Layout currentScreen={{ path: '/permission', title: 'Roles & Permissions' }}>
                <PermissionsPage />
              </Layout>
            </SuperAdminRoute>
          }
        />
        <Route
          path="/locations"
          element={
            <SuperAdminRoute>
              <Layout currentScreen={{ path: '/locations', title: 'Locations' }}>
                <LocationsPage />
              </Layout>
            </SuperAdminRoute>
          }
        />
        <Route
          path="/user-accounts"
          element={
            <SuperAdminRoute>
              <Layout currentScreen={{ path: '/user-accounts', title: 'User Accounts' }}>
                <UserAccountsPage />
              </Layout>
            </SuperAdminRoute>
          }
        />
        {protectedScreens.map((screen) => (
          <Route
            key={screen.path}
            path={screen.path}
            element={
              <ProtectedRoute screen={screen}>
                <Layout currentScreen={screen}>
                  {renderProtectedScreen(screen)}
                </Layout>
              </ProtectedRoute>
            }
          />
        ))}
        {/* Full-screen TV branding stage — no Layout chrome. */}
        <Route path="/branding-stage" element={<BrandingStagePage />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </UserProvider>
  );
}

function RootRedirect() {
  return <Navigate to={isAuthenticated() ? defaultProtectedRoute : '/login'} replace />;
}
