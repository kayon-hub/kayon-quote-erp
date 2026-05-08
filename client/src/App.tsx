import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Customers from "@/pages/Customers";
import Quotes from "@/pages/Quotes";
import CreateQuote from "@/pages/CreateQuote";
import QuoteDetail from "@/pages/QuoteDetail";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CustomerSignature from "./pages/CustomerSignature";
import DataImport from "./pages/DataImport";
import SalesPerformance from "./pages/SalesPerformance";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/products"} component={Products} />
      <Route path={"/customers"} component={Customers} />
      <Route path={"/quotes"} component={Quotes} />
      <Route path={"/quotes/new"} component={CreateQuote} />
      <Route path={"/quotes/:id"} component={QuoteDetail} />
      <Route path={"/signature"} component={CustomerSignature} />
      <Route path={"/import"} component={DataImport} />
      <Route path={"/performance"} component={SalesPerformance} />
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
        // switchable
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
