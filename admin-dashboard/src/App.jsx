import { Suspense, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { useDispatch } from "react-redux";
import AppRoutes from "./app/routes";
import { ThemeProvider } from "./context/ThemeContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ToastProvider } from "./components/ui/ToastProvider";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(hydrateFromStorage());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
