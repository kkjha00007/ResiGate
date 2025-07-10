"use client";

import React, { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitted(false);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to send reset email.');
        return;
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Unexpected error.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md p-8 bg-white/90 rounded-2xl shadow-xl border border-blue-100">
        <div className="flex flex-col items-center mb-6">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-blue-600 mb-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c.5304 0 1.0391-.2107 1.4142-.5858C13.7893 10.0391 14 9.5304 14 9c0-.5304-.2107-1.0391-.5858-1.4142C13.0391 7.2107 12.5304 7 12 7c-.5304 0-1.0391.2107-1.4142.5858C10.2107 7.9609 10 8.4696 10 9c0 .5304.2107 1.0391.5858 1.4142C10.9609 10.7893 11.4696 11 12 11zm0 2c-2.21 0-4 1.3431-4 3v1h8v-1c0-1.6569-1.79-3-4-3z" /></svg>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-1">Forgot your password?</h2>
          <p className="text-gray-500 text-center text-sm">Enter your email address and we'll send you a link to reset your password.</p>
        </div>
        {submitted ? (
          <div className="flex flex-col items-center gap-4 text-green-600">
            <div className="text-center">If your email is registered, a reset link has been sent.</div>
            <a href="/login" className="w-full">
              <button type="button" className="w-full bg-blue-600 text-white rounded-lg p-2 font-semibold shadow hover:bg-blue-700 transition">Back to Login</button>
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              className="w-full border border-blue-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 bg-blue-50 placeholder-gray-400"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-blue-600 text-white p-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition">Send Reset Link</button>
              <a href="/login" className="flex-1">
                <button type="button" className="w-full bg-gray-200 text-gray-700 p-3 rounded-lg font-semibold shadow hover:bg-gray-300 transition">Back</button>
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
