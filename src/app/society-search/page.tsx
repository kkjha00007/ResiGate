// src/app/society-search/page.tsx
'use client';
import React, { useState } from 'react';

export default function SocietySearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', phone: '' });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setInviteSent(false);
    setResults([]);
    try {
      const res = await fetch(`/api/society-search?name=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setResults(data.results);
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    setLoading(true);
    try {
      await fetch('/api/society-search/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ societyName: query, ...inviteForm }),
      });
      setInviteSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4 text-primary">Society Search</h1>
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Enter society name..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded" disabled={loading || !query.trim()}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      {results.length > 0 && (
        <div className="bg-green-100 text-green-800 p-4 rounded mb-4">
          <div>Societies using ResiGate:</div>
          <ul className="list-disc pl-6">
            {results.map((name, idx) => <li key={idx}>{name}</li>)}
          </ul>
        </div>
      )}
      {notFound && !inviteSent && (
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-4">
          <div>No society found with that name.</div>
          <form onSubmit={e => { e.preventDefault(); handleInvite(); }} className="space-y-2 mt-2">
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Your Name"
              value={inviteForm.name}
              onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Your Email"
              type="email"
              value={inviteForm.email}
              onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
              required
            />
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Your Phone (optional)"
              value={inviteForm.phone}
              onChange={e => setInviteForm(f => ({ ...f, phone: e.target.value }))}
            />
            <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>Invite Society</button>
          </form>
        </div>
      )}
      {inviteSent && (
        <div className="bg-blue-100 text-blue-800 p-4 rounded">Thank you! We will reach out to your society soon.</div>
      )}
    </div>
  );
}
