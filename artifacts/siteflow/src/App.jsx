import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ClerkProvider, SignIn, SignUp, useAuth } from '@clerk/react';
import { shadcn } from '@clerk/themes';
import { AppLayout } from './layouts/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Schedule } from './pages/Schedule';
import { Activities } from './pages/Activities';
import { SiteUpdate } from './pages/SiteUpdate';
import { ReviewQueue } from './pages/ReviewQueue';
import { Variance } from './pages/Variance';
import { AIRisk } from './pages/AIRisk';
import { Simulation } from './pages/Simulation';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { IndiaProjects } from './pages/IndiaProjects';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in the environment.');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside',
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: 'top',
    socialButtonsVariant: 'blockButton',
  },
  variables: {
    colorPrimary: '#F2A84B',
    colorForeground: '#F1EDE4',
    colorMutedForeground: '#9B9B91',
    colorDanger: '#FB7185',
    colorBackground: '#0E1310',
    colorInput: '#0A0D0B',
    colorInputForeground: '#F1EDE4',
    colorNeutral: '#D98A32',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '0.85rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#0E1310] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#D98A32]/30',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: '!text-[#F1EDE4]',
    headerSubtitle: '!text-[#9B9B91]',
    socialButtonsBlockButtonText: '!text-[#F1EDE4]',
    formFieldLabel: '!text-[#F1EDE4]',
    footerActionLink: '!text-[#F2A84B]',
    footerActionText: '!text-[#9B9B91]',
    dividerText: '!text-[#9B9B91]',
    identityPreviewEditButton: '!text-[#F2A84B]',
    formFieldSuccessText: '!text-[#8BE0C0]',
    alertText: '!text-[#F1EDE4]',
    logoBox: 'mb-2',
    logoImage: 'max-h-10',
    socialButtonsBlockButton: '!bg-[#141B16] !border-[#D98A32]/30 hover:!bg-[#1A241C]',
    formButtonPrimary: '!bg-[#D98A32] hover:!bg-[#F2A84B] !text-[#0A0D0B]',
    formFieldInput: '!bg-[#0A0D0B] !border-[#D98A32]/30 !text-[#F1EDE4]',
    footerAction: '!bg-transparent',
    dividerLine: '!bg-[#D98A32]/20',
    alert: '!bg-rose-950/30 !border-rose-500/30',
    otpCodeFieldInput: '!bg-[#0A0D0B] !border-[#D98A32]/30 !text-[#F1EDE4]',
    formFieldRow: 'mb-4',
    main: 'px-2',
  },
};

function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0D0B] text-siteflow-muted font-mono text-sm">
      Loading secure workspace…
    </div>
  );
}

function RequireAuth({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) return <AuthLoading />;
  if (!isSignedIn) {
    return (
      <Navigate
        to="/sign-in"
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    );
  }

  return children;
}

function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  const destination = location.state?.from || '/dashboard';

  if (!isLoaded) return <AuthLoading />;
  if (isSignedIn) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0D0B] px-4 py-10">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={destination}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  const destination = location.state?.from || '/dashboard';

  if (!isLoaded) return <AuthLoading />;
  if (isSignedIn) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0D0B] px-4 py-10">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={destination}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function AuthenticatedApp() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to access your SiteFlow workspace',
          },
        },
        signUp: {
          start: {
            title: 'Create your SiteFlow account',
            subtitle: 'Secure your infrastructure intelligence workspace',
          },
        },
      }}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      <Routes>
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/site-updates" element={<SiteUpdate />} />
          <Route path="/review-queue" element={<ReviewQueue />} />
          <Route path="/variance" element={<Variance />} />
          <Route path="/ai-risk" element={<AIRisk />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/india-projects" element={<IndiaProjects />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthenticatedApp />
    </BrowserRouter>
  );
}
