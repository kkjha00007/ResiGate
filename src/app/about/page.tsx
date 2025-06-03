// src/app/about/page.tsx
'use client';
import React from 'react';

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4 text-primary">About ResiGate</h1>
      <p className="mb-4 text-lg text-gray-700">
        ResiGate is a modern society management platform designed to simplify and secure community living. Our mission is to empower societies with digital tools for communication, security, payments, and more.
      </p>
      <ul className="list-disc pl-6 mb-4 text-gray-700">
        <li>Digital visitor management and gate pass system</li>
        <li>Online payments and accounting</li>
        <li>Notices, meetings, and complaint management</li>
        <li>Resident and committee member directory</li>
        <li>And much more!</li>
      </ul>
      <p className="text-gray-600">For more information, contact us via the Contact page.</p>
    </div>
  );
}
