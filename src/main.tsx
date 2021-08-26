import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { GlobalProvider } from './hooks/useAuth';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <GlobalProvider>{() => <App />}</GlobalProvider>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
