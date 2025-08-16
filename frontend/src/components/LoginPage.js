import React from 'react';

const LoginPage = () => {
  const handleLogin = () => {
    // Redirect the user to the backend's Google authentication route
    window.location.href = 'http://localhost:5000/auth/google';
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-10 bg-white rounded-lg shadow-xl text-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Gmail IMAP Client</h1>
        <p className="text-gray-600 mb-8">Please sign in with your Google account to continue.</p>
        <button
          onClick={handleLogin}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
