import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Dashboard from './pages/Dashboard';
import JobBoard from './pages/JobBoard';
import PromptStudio from './pages/PromptStudio';
import VisualEditor from './pages/VisualEditor';
import AgentActivity from './pages/AgentActivity';
import PromptLab from './pages/PromptLab';
import SystemControl from './pages/SystemControl';
import KanbanBoard from './pages/KanbanBoard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import BenchmarkLibrary from './pages/BenchmarkLibrary';
import WebsiteFactory from './pages/WebsiteFactory';
import OpportunityMatrix from './pages/OpportunityMatrix';
import VisualApproval from './pages/VisualApproval';
import TemplateEngine from './pages/TemplateEngine';
import BacklinkHealth from './pages/BacklinkHealth';
import VariationTracker from './pages/VariationTracker';
import SeoSimulator from './pages/SeoSimulator';
import Onboarding from './pages/Onboarding';
import DiscoveryPackage from './pages/DiscoveryPackage';
import WorkflowMap from './pages/WorkflowMap';
import SystemCapabilities from './pages/SystemCapabilities';
import SystemBenchmarks from './pages/SystemBenchmarks';
import SystemAudit from './pages/SystemAudit';
import PromptSystem from './pages/PromptSystem';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import OAuthConsent from '@/pages/OAuthConsent';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/job-board" element={<JobBoard />} />
        <Route path="/prompt-studio" element={<PromptStudio />} />
        <Route path="/visual-editor" element={<VisualEditor />} />
        <Route path="/agent-activity" element={<AgentActivity />} />
        <Route path="/prompt-lab" element={<PromptLab />} />
        <Route path="/system-control" element={<SystemControl />} />
        <Route path="/kanban" element={<KanbanBoard />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/benchmarks" element={<BenchmarkLibrary />} />
        <Route path="/factory" element={<WebsiteFactory />} />
        <Route path="/opportunities" element={<OpportunityMatrix />} />
        <Route path="/visual-approval" element={<VisualApproval />} />
        <Route path="/template-engine" element={<TemplateEngine />} />
        <Route path="/backlink-health" element={<BacklinkHealth />} />
        <Route path="/variations" element={<VariationTracker />} />
        <Route path="/seo-simulator" element={<SeoSimulator />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/discovery" element={<DiscoveryPackage />} />
        <Route path="/workflow-map" element={<WorkflowMap />} />
        <Route path="/system-capabilities" element={<SystemCapabilities />} />
        <Route path="/system-benchmarks" element={<SystemBenchmarks />} />
        <Route path="/system-audit" element={<SystemAudit />} />
        <Route path="/prompt-system" element={<PromptSystem />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App