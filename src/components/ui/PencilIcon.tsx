// Simple pencil icon SVG as a React component
import * as React from 'react';

export function PencilIcon({ className = '', ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      className={className}
      {...props}
    >
      <path
        d="M15.232 2.232a2.5 2.5 0 0 1 3.536 3.536l-10.5 10.5a2 2 0 0 1-.878.513l-4 1a1 1 0 0 1-1.213-1.213l1-4a2 2 0 0 1 .513-.878l10.5-10.5ZM16.5 5.5L14.5 3.5M3 17l1-4 10.5-10.5a.5.5 0 0 1 .707 0l2 2a.5.5 0 0 1 0 .707L4 15.5l-1 1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
