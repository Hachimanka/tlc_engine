"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type NavbarProps = {
  onLogout?: () => void;
};

export default function Navbar({ onLogout }: NavbarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClick);
    }

    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  return (
    <nav className="h-15 bg-teal-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-2 ml-10">
        <Image src="/navbar/tlclogo.png" alt="Logo" width={40} height={40} />
      </div>

      <div className="flex items-center gap-4 mr-16">
        <div className="relative flex items-center justify-center">
          <Image
            src="/navbar/Notification.png"
            alt="Notification"
            width={24}
            height={24}
          />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </div>

        <div className="h-8 w-px bg-gray-300 mx-2" />

        <div className="relative" ref={menuRef}>
          <button
            className="flex items-center gap-1 bg-white rounded-full pr-1 pl-1 py-0.5 shadow min-h-7 focus:outline-none"
            onClick={() => setShowMenu((current) => !current)}
            aria-label="Open profile menu"
          >
            <Image
              src="/navbar/Profile.png"
              alt="Profile"
              width={28}
              height={28}
              className="rounded-full"
            />
            <span className="text-teal-800 font-medium text-[10px] ml-1">
              Leonard Forrosuelo
            </span>
          </button>

          {showMenu ? (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-100 animate-fade-in">
              <button
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                onClick={onLogout}
              >
                Log out
              </button>
              <button
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm flex items-center gap-2"
                onClick={() => setDarkMode((current) => !current)}
              >
                <span>{darkMode ? "Light" : "Dark"}</span> mode
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
