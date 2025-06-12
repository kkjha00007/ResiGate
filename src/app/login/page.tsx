'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';
import { ShieldCheck, Heart, Download } from 'lucide-react';
import React from 'react';
import InstallPWAButton from '@/components/ui/InstallPWAButton';

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
		<div className="flex flex-col min-h-screen items-center bg-gradient-to-br from-background via-secondary/10 to-background py-12 px-4 sm:px-6 lg:px-8">
			<header className="text-center mb-8 md:mb-12">
				<ShieldCheck className="h-20 w-20 text-primary mx-auto mb-6" />
				<h1 className="text-5xl font-bold tracking-tight text-primary sm:text-6xl">
					ResiGate
				</h1>
			</header>
			<nav className="mb-10 md:mb-12">
				<ul className="flex flex-wrap justify-center gap-3 sm:gap-4">
					{navLinks.map((item) => (
						<li key={item.label}>
							<a
								href={item.href}
								className="flex items-center gap-2 px-6 py-2 rounded-md border border-primary/50 bg-white text-primary font-medium hover:bg-emerald-600 hover:text-white hover:border-emerald-700 focus:ring-primary/50 transition"
							>
								<item.icon className="mr-2 h-4 w-4" />
								{item.label}
							</a>
						</li>
					))}
				</ul>
			</nav>
			<div className="w-full flex justify-center mt-6">
				<SocietySearchBox />
			</div>
			<main className="w-full max-w-md flex-grow flex flex-col items-center justify-center">
				{/* Remove all extra wrappers and padding for the login form to match landing page */}
				<LoginForm />
			</main>
			<footer className="mt-16 md:mt-24 text-center text-muted-foreground">
				<p>ResiGate © 2025 . All rights reserved.</p>
				<div className="flex items-center justify-center text-sm mt-2">
					Made with{' '}
					<Heart className="h-4 w-4 text-red-500 fill-red-500 mx-1.5" /> in India
				</div>
			</footer>
			<InstallPWAButton />
		</div>
	);
}
