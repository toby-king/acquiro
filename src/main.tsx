import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ScrollToTop } from './components/ScrollToTop.tsx'
import App from './App.tsx'
import { LandingPage } from './components/landing/LandingPage.tsx'
import { DashboardGuard } from './components/dashboard/DashboardGuard.tsx'
import { SettingsPage } from './components/settings/SettingsPage.tsx'
import { IntegrationsPage } from './components/integrations/IntegrationsPage.tsx'
import { AdminGuard } from './components/admin/AdminGuard.tsx'
import { AdminPage } from './components/admin/AdminPage.tsx'
import { LoginPage } from './components/auth/LoginPage.tsx'
import { CheckoutComplete } from './components/payment/CheckoutComplete.tsx'
import { SubscriptionPage } from './components/payment/SubscriptionPage.tsx'
import { PrivacyPolicy } from './pages/PrivacyPolicy.tsx'
import { TermsOfService } from './pages/TermsOfService.tsx'
import './index.css'

// Initialize theme before first paint - default to dark unless user explicitly chose light
(function initTheme() {
  const stored = localStorage.getItem('theme');
  const theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/builder" element={<App />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardGuard />} />
        <Route path="/settings" element={<DashboardGuard><SettingsPage /></DashboardGuard>} />
        <Route path="/integrations" element={<DashboardGuard><IntegrationsPage /></DashboardGuard>} />
        <Route path="/admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
        <Route path="/subscription/complete" element={<CheckoutComplete />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route 
          path="/offer" 
          element={
            <SubscriptionPage 
              advisorName="Your Advisor"
              onSelectPlan={(planId, billingPeriod) => {
                console.log('Plan selected:', planId, billingPeriod);
              }}
            />
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
