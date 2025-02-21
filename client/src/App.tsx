import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import AdminPage from "@/pages/admin-page";
import ProfilePage from "@/pages/profile-page";
import { AuthProvider } from "@/hooks/use-auth";
import { VotingProvider } from "@/hooks/use-voting";
import { ProtectedRoute } from "./lib/protected-route";
import { Navbar } from "@/components/ui/navbar";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route
        path="/"
        component={() => (
          <Layout>
            <ProtectedRoute path="/" component={HomePage} />
          </Layout>
        )}
      />
      <Route
        path="/admin"
        component={() => (
          <Layout>
            <ProtectedRoute path="/admin" component={AdminPage} />
          </Layout>
        )}
      />
      <Route
        path="/profile"
        component={() => (
          <Layout>
            <ProtectedRoute path="/profile" component={ProfilePage} />
          </Layout>
        )}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <VotingProvider>
          <Router />
          <Toaster />
        </VotingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;