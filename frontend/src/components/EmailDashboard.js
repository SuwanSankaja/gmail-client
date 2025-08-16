// src/components/EmailDashboard.js

import React, { useState, useEffect, useCallback } from 'react';

const EmailDashboard = ({ user }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New state for pagination and search
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      // Append page and search query parameters to the request
      const response = await fetch(`/api/emails?page=${currentPage}&search=${searchTerm}`, { credentials: 'include' });
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
  }, [currentPage, searchTerm]); // Re-run fetchEmails when currentPage or searchTerm changes

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const response = await fetch('/api/sync-emails', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to sync emails.');
      }
      alert('Email sync complete!');
      // Refetch emails to show any new ones
      fetchEmails();
    } catch (err) {
      setError(err.message);
      alert(`Error syncing emails: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchEmails();
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">My Inbox</h1>
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-600 hidden sm:block">Signed in as: {user.email}</p>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:bg-indigo-300"
              >
                {syncing ? 'Syncing...' : 'Sync Emails'}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSearchSubmit} className="mb-6 flex">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by sender or subject..."
            className="flex-grow p-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold p-2 rounded-r-md">
            Search
          </button>
        </form>

        {loading && <p className="text-center text-gray-500">Loading emails...</p>}
        {error && <p className="text-center text-red-500">Error: {error}</p>}
        
        {!loading && !error && (
          <>
            <div className="bg-white shadow overflow-hidden rounded-md">
              <ul className="divide-y divide-gray-200">
                {emails.length > 0 ? emails.map((email) => (
                  <li key={email.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">{email.from}</p>
                      <p className="text-xs text-gray-500">{new Date(email.date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm text-gray-900 mt-1">{email.subject}</p>
                  </li>
                )) : <p className="text-center text-gray-500 py-4">No emails found.</p>}
              </ul>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default EmailDashboard;
