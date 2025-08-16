import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import EmailDashboard from './components/EmailDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This effect runs when the component mounts to check if a user is already logged in.
    const checkLoggedIn = async () => {
      try {
        // Make a request to a new backend endpoint to get the current user's session data
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Show a loading screen while we check for a session
  }

  // If a user is logged in, show the dashboard. Otherwise, show the login page.
  return (
    <div>
      {user ? <EmailDashboard user={user} /> : <LoginPage />}
    </div>
  );
}

export default App;
