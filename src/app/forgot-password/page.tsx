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
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Forgot Password</h2>
      {submitted ? (
        <div className="flex flex-col items-center gap-4 text-green-600">
          <div>If your email is registered, a reset link has been sent.</div>
          <a href="/login" className="w-full">
            <button type="button" className="w-full bg-secondary text-primary border border-primary rounded p-2 hover:bg-secondary/80 transition">Back to Login</button>
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            className="w-full border p-2 rounded"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Send Reset Link</button>
        </form>
      )}
    </div>
  );
}
