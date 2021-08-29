import React from 'react';
import './index.css';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { GlobalProvider } from './hooks/useAuth';
import { CacheDbProvider } from './utils/web_db';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  // <React.StrictMode>
  <Router>
    <CacheDbProvider>
      <GlobalProvider>{() => <App />}</GlobalProvider>
    </CacheDbProvider>
  </Router>
  // </React.StrictMode>
);
