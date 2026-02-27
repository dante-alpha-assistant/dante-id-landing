import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { PricingPage } from './pages/PricingPage';
import { DocsPage } from './pages/DocsPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public pages with navigation */}
        <Route path="/" element={
          <Layout>
            <LandingPage />
          </Layout>
        } />
        <Route path="/how-it-works" element={
          <Layout>
            <HowItWorksPage />
          </Layout>
        } />
        <Route path="/pricing" element={
          <Layout>
            <PricingPage />
          </Layout>
        } />
        <Route path="/docs" element={
          <Layout>
            <DocsPage />
          </Layout>
        } />
        
        {/* Auth pages without navigation */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </Router>
  );
};