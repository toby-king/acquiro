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
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { ConversationProvider } from '@elevenlabs/react'
import './index.css'

// Initialize theme before first paint - default to dark unless user explicitly chose light
(function initTheme() {
  const stored = localStorage.getItem('theme');
  const theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConversationProvider>
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/builder" element={<ErrorBoundary section="Advisor"><App /></ErrorBoundary>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<ErrorBoundary section="Dashboard"><DashboardGuard /></ErrorBoundary>} />
        <Route path="/settings" element={<ErrorBoundary section="Settings"><DashboardGuard><SettingsPage /></DashboardGuard></ErrorBoundary>} />
        <Route path="/integrations" element={<ErrorBoundary section="Integrations"><DashboardGuard><IntegrationsPage /></DashboardGuard></ErrorBoundary>} />
        <Route path="/admin" element={<ErrorBoundary section="Admin"><AdminGuard><AdminPage /></AdminGuard></ErrorBoundary>} />
        <Route path="/subscription/complete" element={<ErrorBoundary section="Checkout"><CheckoutComplete /></ErrorBoundary>} />
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
    </ConversationProvider>
  </React.StrictMode>,
)
