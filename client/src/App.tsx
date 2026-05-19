import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import DashboardPage from "./pages/DashboardPage";
import MotoristaPage from "./pages/MotoristaPage";
import VeiculoPage from "./pages/VeiculoPage";
import RotaPage from "./pages/RotaPage";
import EntregaPage from "./pages/EntregaPage";
import Home from "./pages/Home";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Home />;
  }

  return (
    <Switch>
      <Route path={"/dashboard"} component={DashboardPage} />
      <Route path={"/motoristas"} component={MotoristaPage} />
      <Route path={"/veiculos"} component={VeiculoPage} />
      <Route path={"/rotas"} component={RotaPage} />
      <Route path={"/entregas"} component={EntregaPage} />
      <Route path={"/"} component={DashboardPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
