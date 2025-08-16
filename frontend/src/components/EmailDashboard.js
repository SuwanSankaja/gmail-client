import React, { useState, useEffect } from 'react';

const EmailDashboard = ({ user }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoading(true);
        // Fetch emails from our backend API
        const response = await fetch('/api/emails');
        if (!response.ok) {
          throw new Error('Failed to fetch emails');
        }
        const data = await response.json();
        setEmails(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">My Inbox</h1>
            <p className="text-sm text-gray-600">Signed in as: {user.email}</p>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && <p className="text-center text-gray-500">Loading emails...</p>}
        {error && <p className="text-center text-red-500">Error: {error}</p>}
        {!loading && !error && (
          <div className="bg-white shadow overflow-hidden rounded-md">
            <ul className="divide-y divide-gray-200">
              {emails.map((email, index) => (
                <li key={index} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">{email.from}</p>
                    <p className="text-xs text-gray-500">{new Date(email.date).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm text-gray-900 mt-1">{email.subject}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
};

export default EmailDashboard;
