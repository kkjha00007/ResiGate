import React from "react";
import type { FeedbackTicket } from "@/lib/types";

const FeedbackList = ({ tickets, onSelect }: { tickets: FeedbackTicket[]; onSelect: (id: string) => void }) => {
  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <h2 className="text-lg font-semibold mb-2">My Tickets</h2>
      <ul>
        {tickets.length === 0 && <li className="text-gray-500">No tickets found.</li>}
        {tickets.map(ticket => (
          <li key={ticket.id} className="border-b py-2 flex items-center justify-between">
            <div>
              <span className="font-medium">{ticket.subject}</span>
              <span className="ml-2 text-xs text-gray-500">[{ticket.type}]</span>
              <span className={`ml-2 text-xs ${ticket.status === 'open' ? 'text-green-600' : 'text-gray-600'}`}>{ticket.status}</span>
            </div>
            <button className="text-blue-600 underline text-xs" onClick={() => onSelect(ticket.id)}>View</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FeedbackList;
