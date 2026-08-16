import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';

const CalculatorPage = lazy(() => import('./App'));
const PsychologistCalculatorPage = lazy(() => import('./pages/PsychologistCalculatorPage').then((module) => ({ default: module.PsychologistCalculatorPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then((module) => ({ default: module.AccountPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage').then((module) => ({ default: module.ChangePasswordPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })));

export const Router = () => (
  <BrowserRouter>
    <AuthProvider>
      <Suspense fallback={<div className="route-loading" role="status"><span className="loading-spinner" /> Carregando…</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/calculadora" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
          <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
          <Route path="/calculadora" element={<ProtectedRoute allowedRoles={['agent', 'admin']}><CalculatorPage /></ProtectedRoute>} />
          <Route path="/calculadora-psicologos" element={<ProtectedRoute allowedRoles={['agent', 'admin']}><PsychologistCalculatorPage /></ProtectedRoute>} />
          <Route path="/minha-conta" element={<ProtectedRoute allowedRoles={['agent', 'admin']}><AccountPage /></ProtectedRoute>} />
          <Route path="/alterar-senha" element={<ProtectedRoute allowedRoles={['agent', 'admin']}><ChangePasswordPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/calculadora" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  </BrowserRouter>
);
