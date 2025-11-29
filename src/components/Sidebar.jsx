import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
export default function Sidebar() {
  const [open, setOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", to: "/app/dashboard", icon: DashboardIcon },
    { name: "Transactions", to: "/app/transactions", icon: TransactionsIcon },
    { name: "Budget", to: "/app/budget", icon: BudgetIcon },
    { name: "Insights", to: "/app/insights", icon: InsightsIcon },
    { name: "AI Coach", to: "/app/coach", icon: CoachIcon },
    { name: "Goals", to: "/app/goals", icon: GoalsIcon },
  ];

  return (
    <>
      {/* Mobile: toggle button */}
      <div className="md:hidden p-2">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open sidebar"
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-200 bg-gray-800/60 hover:bg-gray-800"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Overlay + Drawer for mobile */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 p-4 overflow-y-auto">
            <SidebarContent close={() => setOpen(false)} navItems={navItems} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:min-h-screen bg-gray-900 border-r border-gray-800 p-6">
        <SidebarContent close={() => {}} navItems={navItems} />
      </aside>
    </>
  );
}

function SidebarContent({ close, navItems }) {
  const userEmail = localStorage.getItem("userEmail");

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="mb-8">
        <Link to="/app/dashboard" onClick={close} className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg">FinBuddy</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.to}
                onClick={close}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 text-sm px-3 py-2 rounded-md",
                    isActive
                      ? "bg-blue-500 text-white shadow"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/60",
                  ].join(" ")
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Divider */}
      <div className="border-t-2 border-gray-800 mt-6 pt-2">
        {/* Profile Card */}
        <div className="mt-4 flex items-center gap-3">
          <div>
            <div className="text-sm text-white font-medium">Welcome,</div>
            <div className="text-xs text-gray-400">{userEmail || 'user@example.com'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Icons --- (simple inline SVG components) */
function DashboardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="3" width="8" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="10.5" width="8" height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="12.5" width="8" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BudgetIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M21.21 15.89A10 10 0 118 2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 12A10 10 0 0012 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TransactionsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3.5" y="5" width="17" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 9h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function InsightsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M3 17v-6a1 1 0 011-1h2v8H4a1 1 0 01-1-1z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 11v6h2v-4h2v4h2v-8h2v10H9V11z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CoachIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 20c1-4 6-6 7-6s6 2 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GoalsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3v9l6 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ProfileIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 20c1.5-3.5 5.5-6 8-6s6.5 2.5 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}