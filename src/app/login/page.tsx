'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';
import { ShieldCheck, Heart } from 'lucide-react';
import React from 'react';

const navLinks = [
	{ label: 'About', href: '/about', icon: ShieldCheck },
	{ label: 'Contact', href: '/contact', icon: Heart },
];

// Copy the full SocietySearchBox from page.tsx for full feature parity
function SocietySearchBox() {
	const [query, setQuery] = React.useState('');
	const [results, setResults] = React.useState<string[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [notFound, setNotFound] = React.useState(false);
	const [inviteSent, setInviteSent] = React.useState(false);
	const [showDropdown, setShowDropdown] = React.useState(false);
	const [inviteForm, setInviteForm] = React.useState({ name: '', email: '', phone: '' });
	const inputRef = React.useRef(null);
	const debounceTimeout = React.useRef<NodeJS.Timeout | null>(null);

	React.useEffect(() => {
		if (!query.trim()) {
			setResults([]);
			setNotFound(false);
			setInviteSent(false);
			setShowDropdown(false);
			return;
		}
		setLoading(true);
		setNotFound(false);
		setInviteSent(false);
		if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
		debounceTimeout.current = setTimeout(async () => {
			try {
				const res = await fetch(`/api/society-search?name=${encodeURIComponent(query)}`);
				const data = await res.json();
				if (data.results && data.results.length > 0) {
					setResults(data.results);
					setShowDropdown(true);
				} else {
					setResults([]);
					setNotFound(true);
					setShowDropdown(false);
				}
			} finally {
				setLoading(false);
			}
		}, 400);
	}, [query]);

	const handleInvite = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
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
		<div className="max-w-lg mx-auto mb-8">
			<div className="flex gap-2 mb-4 relative">
				<input
					type="text"
					className="flex-1 border rounded px-3 py-2 pr-10"
					placeholder="Search society name..."
					value={query}
					onChange={e => setQuery(e.target.value)}
					autoComplete="off"
					onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
					onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
				/>
				{loading && (
					<span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
						<svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
							<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
						</svg>
					</span>
				)}
				{showDropdown && results.length > 0 && (
					<ul className="absolute left-0 right-0 top-full z-10 bg-white border border-gray-200 rounded shadow mt-1 max-h-48 overflow-auto">
						{results.map((name, idx) => (
							<li
								key={idx}
								className="px-4 py-2 cursor-pointer hover:bg-primary/10"
								onMouseDown={() => {
									setQuery(name);
									setShowDropdown(false);
								}}
							>
								{name}
							</li>
						))}
					</ul>
				)}
			</div>
			{notFound && !inviteSent && (
				<div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-2">
					<div>No society found with that name.</div>
					<form onSubmit={handleInvite} className="space-y-2 mt-2">
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

export default function LoginPage() {
	return (
		<main className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
			<div className="flex flex-col items-center mt-12 mb-6">
				<div className="flex flex-col items-center">
					<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="none" viewBox="0 0 24 24" className="mb-2 text-blue-400"><path fill="currentColor" d="M12 2c-4.97 0-9 4.03-9 9 0 4.97 4.03 9 9 9s9-4.03 9-9c0-4.97-4.03-9-9-9Zm0 16.2c-4 0-7.2-3.2-7.2-7.2 0-4 3.2-7.2 7.2-7.2 4 0 7.2 3.2 7.2 7.2 0 4-3.2 7.2-7.2 7.2Zm0-13.2c-3.31 0-6 2.69-6 6 0 3.31 2.69 6 6 6s6-2.69 6-6c0-3.31-2.69-6-6-6Zm0 10.2c-2.32 0-4.2-1.88-4.2-4.2 0-2.32 1.88-4.2 4.2-4.2 2.32 0 4.2 1.88 4.2 4.2 0 2.32-1.88 4.2-4.2 4.2Z"/></svg>
					<h1 className="text-5xl font-extrabold text-blue-500 mb-2">ResiGate</h1>
				</div>
				<div className="flex gap-4 mt-4">
					<a href="/about" className="flex items-center gap-2 px-6 py-2 rounded-md border border-blue-200 bg-white text-blue-500 font-medium hover:bg-blue-100 transition"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8Zm-1-13h2v2h-2zm2 4h-2v6h2z"/></svg>About</a>
					<a href="/contact" className="flex items-center gap-2 px-6 py-2 rounded-md border border-blue-200 bg-white text-blue-500 font-medium hover:bg-blue-100 transition"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z"/></svg>Contact</a>
				</div>
				<div className="w-full flex justify-center mt-6">
					{/* Society SearchBox (copied from landing page) */}
					<SocietySearchBox />
				</div>
			</div>
			<div className="w-full flex flex-col items-center">
				{/* Login Form (as before) */}
				<div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 mb-8">
					<LoginForm />
				</div>
			</div>
			<footer className="mt-auto mb-4 text-center text-gray-500 text-sm">
				ResiGate © 2025 . All rights reserved.<br />
				<span className="flex items-center justify-center gap-1 mt-1">Made with <span className="text-red-500">♥</span> in India</span>
			</footer>
		</main>
	);
}
