import React, { useState, useEffect, useCallback } from 'react';

// A simple component to show a loading spinner
const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const EmailDashboard = ({ user }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);

  const fetchEmails = useCallback(async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/emails?page=${page}&search=${encodeURIComponent(search)}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }
      const data = await response.json();
      setEmails(data.emails);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchEmails]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const response = await fetch('/api/sync-emails', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Syncing failed. Please try again.');
      }
      // After sync, refetch the first page of emails
      await fetchEmails(1, searchTerm);
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-500 hidden sm:block">
                <span className="font-medium">Signed in as:</span> {user.email}
              </p>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm disabled:bg-indigo-400 transition duration-300"
              >
                {syncing ? <Spinner /> : 
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M20 4l-5 5M4 20l5-5"></path></svg>
                }
                <span>{syncing ? 'Syncing...' : 'Sync'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSearchSubmit} className="mb-8 relative">
          <svg className="w-5 h-5 text-gray-400 absolute top-3.5 left-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by sender or subject..."
            className="w-full p-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </form>

        {loading && <p className="text-center text-gray-500 py-10">Loading emails...</p>}
        {error && <p className="text-center text-red-600 bg-red-100 p-4 rounded-lg">Error: {error}</p>}
        
        {!loading && !error && (
          <>
            <div className="bg-white shadow-lg overflow-hidden rounded-lg">
              <ul>
                {emails.length > 0 ? emails.map((email) => {
                  const fromName = email.from.split('<')[0].trim().replace(/"/g, '');
                  const initial = fromName ? fromName.charAt(0).toUpperCase() : '?';
                  return (
                    <li key={email.id} className="border-b border-gray-200 hover:bg-gray-50 transition duration-200">
                      <div className="flex items-center p-4">
                        <div className="flex-shrink-0 mr-4">
                          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 font-bold">
                            {initial}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{fromName}</p>
                          <p className="text-sm text-gray-600 truncate">{email.subject}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs text-gray-500 whitespace-nowrap">{new Date(email.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </li>
                  );
                }) : 
                <div className="text-center py-16 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No emails found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try syncing or adjusting your search.</p>
                </div>
                }
              </ul>
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-between items-center">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default EmailDashboard;
