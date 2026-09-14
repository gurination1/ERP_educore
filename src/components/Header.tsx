import React from 'react';
import { User, ActiveScreen } from '../types';

interface HeaderProps {
  currentUser: User | null;
  activeScreen?: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCopilot?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onNavigate,
  searchQuery,
  onSearchChange,
  onOpenCopilot,
}) => {
  return (
    <header
      id="educore-topbar"
      className="h-16 border-b border-[#e1e3e4] bg-[#ffffff] px-6 flex items-center justify-between sticky top-0 z-20"
    >
      {/* Search bar */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#757682] text-[20px]">
            search
          </span>
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search students, roll no, courses, forms..."
            className="w-full pl-10 pr-4 py-2 bg-[#f3f4f5] border-none rounded-lg text-sm text-[#191c1d] placeholder-[#757682] focus:outline-none focus:ring-2 focus:ring-[#00236f]/30 transition-all"
          />
        </div>
      </div>

      {/* Action icons & user profile */}
      <div className="flex items-center gap-3">
        {/* AI Campus Copilot Button */}
        <button
          id="ai-copilot-btn"
          type="button"
          onClick={() => onOpenCopilot && onOpenCopilot()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-[#00236f] to-[#1a4bb0] text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-110 transition-all cursor-pointer"
          title="Ask EduCore AI Campus Copilot"
        >
          <span className="material-symbols-outlined text-[17px] text-amber-300">smart_toy</span>
          <span className="hidden sm:inline">AI Copilot</span>
        </button>
        {/* Notifications Icon */}
        <button
          id="notifications-bell-btn"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-[#444651] hover:bg-[#f3f4f5] relative"
          title="3 unread notifications"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full ring-2 ring-white"></span>
        </button>

        {/* Settings button */}
        <button
          id="header-settings-btn"
          onClick={() => onNavigate('settings')}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-[#444651] hover:bg-[#f3f4f5]"
          title="System Settings"
        >
          <span className="material-symbols-outlined text-[22px]">settings</span>
        </button>

        <div className="h-6 w-[1px] bg-[#e1e3e4] mx-1"></div>

        {/* User avatar & name */}
        <div className="flex items-center gap-2.5 pl-1">
          {currentUser?.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt={currentUser.full_name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover border border-[#c5c5d3]"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#00236f] text-white flex items-center justify-center text-xs font-bold">
              {currentUser ? currentUser.full_name.charAt(0) : 'U'}
            </div>
          )}
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-[#191c1d] leading-none">
              {currentUser?.full_name || 'Guest User'}
            </p>
            <p className="text-[10px] text-[#757682] mt-0.5 capitalize">
              {currentUser?.role || 'Portal User'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
