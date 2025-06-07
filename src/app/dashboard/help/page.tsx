import React from "react";

const HelpPage = () => (
  <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-8">
    <h1 className="text-2xl font-bold mb-4">Help & Documentation</h1>
    <h2 className="text-lg font-semibold mb-2">How to Use ResiGate</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>Navigate using the sidebar to access features like visitor logs, gate passes, complaints, and more.</li>
      <li>Super Admins and Society Admins have access to management features.</li>
      <li>Owners and Renters can view their own logs, complaints, and parking info.</li>
    </ul>
    <h2 className="text-lg font-semibold mb-2">Reporting Bugs & Feedback</h2>
    <ul className="list-disc ml-6 mb-4">
      <li>Go to <b>Feedback & Bug Reports</b> (Super Admins only) to view and manage all tickets.</li>
      <li>All users can submit feedback or bug reports from the dashboard (feature coming soon).</li>
      <li>Track the status of your tickets and add comments for follow-up.</li>
    </ul>
    <h2 className="text-lg font-semibold mb-2">Need More Help?</h2>
    <p>Contact your Society Admin or Super Admin for further assistance.</p>
  </div>
);

export default HelpPage;
