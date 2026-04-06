import React from "react";

export function NavIcon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "menu") {
    return (
      <svg {...common}>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === "refresh") {
    return (
      <svg {...common}>
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </svg>
    );
  }

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M3 10.5L12 4l9 6.5" />
        <path d="M5 9.5V20h14V9.5" />
      </svg>
    );
  }

  if (name === "question") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.8 9.2a2.4 2.4 0 0 1 4.4 1.2c0 1.8-2.2 2.2-2.2 3.8" />
        <circle cx="12" cy="16.8" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name === "exam") {
    return (
      <svg {...common}>
        <path d="M7 3.5h10a2 2 0 0 1 2 2V20l-4-2-3 2-3-2-4 2V5.5a2 2 0 0 1 2-2z" />
        <path d="M9 8h6M9 12h6" />
      </svg>
    );
  }

  if (name === "chevronDown") {
    return (
      <svg {...common}>
        <path d="m6 9 6 6 6-6" />
      </svg>
    );
  }

  if (name === "chevronUp") {
    return (
      <svg {...common}>
        <path d="m18 15-6-6-6 6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1.5" />
      <circle cx="4" cy="12" r="1.5" />
      <circle cx="4" cy="18" r="1.5" />
    </svg>
  );
}
