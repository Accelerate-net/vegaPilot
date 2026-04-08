import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import LegacyScreenPage from './pages/LegacyScreenPage';
import VerifyTokenPage from './pages/VerifyTokenPage';
import { isAuthenticated } from './lib/auth';
import { defaultProtectedRoute, protectedScreens, publicScreens } from './lib/legacyScreens';

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/index.html" replace />;
  }

  return children;
}

export default function App() {
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
                <LegacyScreenPage screen={screen} />
              </Layout>
            </ProtectedRoute>
          }
        />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
