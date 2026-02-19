import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.tsx'
import { Dashboard } from './components/dashboard/Dashboard.tsx'
import { CheckoutComplete } from './components/payment/CheckoutComplete.tsx'
import { SubscriptionPage } from './components/payment/SubscriptionPage.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/subscription/complete" element={<CheckoutComplete />} />
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
