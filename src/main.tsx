import React from 'react';
import './index.css';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { GlobalProvider } from './utils/GlobalProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  // <React.StrictMode>
  <Router>
    <GlobalProvider>{() => <App />}</GlobalProvider>
  </Router>
  // </React.StrictMode>
);
