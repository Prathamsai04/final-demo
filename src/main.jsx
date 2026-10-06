import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { createAppStore } from './app/store.js';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { DemoModeProvider } from './context/DemoModeContext.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import './index.css';

const store = createAppStore();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <DemoModeProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </DemoModeProvider>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);
