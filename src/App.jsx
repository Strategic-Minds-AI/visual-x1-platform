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
import VisualStudio from './pages/VisualStudio';
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
import AcademyTemplates from './pages/AcademyTemplates';
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
import Workspace from './pages/Workspace';
import CloneIngest from './pages/CloneIngest';
import SocialStudio from './pages/SocialStudio';
import DeliveryConsole from './pages/DeliveryConsole';
import Projects from './pages/Projects';
import X1OperatingSystem from './pages/X1OperatingSystem';
import X1Module from './pages/X1Module';
import X1Experience from './pages/X1Experience';
import X1Home from './pages/X1Home';
import V2Experience from './pages/V2Experience';
import X1CloneLedger from './pages/X1CloneLedger';
import PricingExperience from './pages/PricingExperience';
import ClientPortalExperience from './pages/ClientPortalExperience';
import PortalAdmin from './pages/PortalAdmin';
import BuilderMap from './pages/BuilderMap';
import AppShell from '@/components/workspace/AppShell';
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
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
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
        <Route element={<AppShell />}>
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clone-ingest" element={<CloneIngest />} />
        <Route path="/delivery" element={<DeliveryConsole />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/x1" element={<X1OperatingSystem />} />
        <Route path="/x1-experience" element={<X1Experience />} />
        <Route path="/builder-map" element={<BuilderMap />} />
        <Route path="/job-board" element={<JobBoard />} />
        <Route path="/prompt-studio" element={<PromptStudio />} />
        <Route path="/social-studio" element={<SocialStudio />} />
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
        <Route path="/academy-templates" element={<AcademyTemplates />} />
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
        {/* X1 administrative workspaces, at X1's own route paths. The operator
            console itself lives at /admin, outside this workspace chrome. */}
        {/* X1 source route contract: /admin/studio and /admin/visual-editor both render X1's Visual Studio. */}
        <Route path="/admin/studio" element={<VisualStudio />} />
        <Route path="/admin/visual-editor" element={<VisualStudio />} />
        <Route path="/admin/coding-kanban" element={<KanbanBoard />} />
        <Route path="/admin/prompt-lab" element={<PromptLab />} />
        <Route path="/admin/intelligence" element={<AnalyticsDashboard />} />
        <Route path="/admin/agent" element={<AgentActivity />} />
        <Route path="/admin/launch-studio" element={<WebsiteFactory />} />
        <Route path="/admin/parity" element={<X1CloneLedger />} />
        {/* The Visual X editor is the console's Visual Editor section, so this
            path lands on it: one editor, one layout. */}
        <Route path="/visual-x" element={<Navigate to="/admin?section=visualeditor" replace />} />
        </Route>
        </Route>
      {/* The X1 site is the front door; the Visual X console sits behind /workspace. */}
      {/* The public site is open to visitors: this is the page the published domain
          lands on, and where Eden's discovery brief is filled in. The portal and the
          operator console below stay behind the login wall. */}
      <Route path="/" element={<V2Experience forceVariant="b" />} />
      <Route path="/v2/:variant" element={<V2Experience />} />
      <Route path="/pricing" element={<PricingExperience />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login?returnTo=/" replace />} />}>
        <Route path="/x1-home" element={<X1Home />} />
        <Route path="/portal" element={<ClientPortalExperience />} />
        {/* The operator admin, at the standard path. It reads live records and its
            buttons call the Visual X pipelines. */}
        <Route path="/admin" element={<PortalAdmin />} />
        {/* The Visual Editor is a console section, directly under Prompt System.
            Its own path stays valid for the workspace's existing links. */}
        <Route path="/visual-editor" element={<Navigate to="/admin?section=visualeditor" replace />} />
        {/* The console's earlier paths stay valid so existing links keep working. */}
        <Route path="/portal/demo" element={<Navigate to="/admin" replace />} />
        <Route path="/portal/workspace" element={<Navigate to="/portal" replace />} />
      </Route>
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login?returnTo=/x1-module" replace />} />}>
        <Route path="/x1-module" element={<X1Module />} />
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