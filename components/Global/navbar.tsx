

import Image from "next/image";

export default function Navbar() {

  return (
    <nav className="h-15 bg-teal-800 flex items-center justify-between px-4">
      {/* Logo Section */}
      <div className="flex items-center gap-2 ml-10">
        <Image src="/navbar/tlclogo.png" alt="Logo" width={40} height={40} />
      </div>
      {/* Right Section: Notif, Divider, Profile */}
      <div className="flex items-center gap-4 mr-16">
        {/* Notification Icon */}
        <div className="relative flex items-center justify-center">
          <Image src="/navbar/Notification.png" alt="Notification" width={24} height={24} />
          {/* Red dot for notification */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </div>
        {/* Vertical Divider Line */}
        <div className="h-8 w-px bg-gray-300 mx-2" />
        {/* Profile Section */}
        <div className="flex items-center gap-1 bg-white rounded-full pr-1 pl-1 py-0.5 shadow min-h-7">
          <Image src="/navbar/Profile.png" alt="Profile" width={28} height={28} className="rounded-full" />
          <span className="text-teal-800 font-medium text-[10px] ml-1">Leonard Forrosuelo</span>
        </div>
      </div>
    </nav>
  );
}
