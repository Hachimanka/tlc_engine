"use client";
import { AppIcon } from "@/public/icons";
import { useState, useEffect, useRef } from "react";

export default function NotifBox({ onTrigger }: { onTrigger: () => void }) {
  // const showNotification = () => {
  //   setIsNotificationOpen(true);
  //   setTimeout(() => setIsNotificationOpen(false), 3000);
  // };

  return (
    <div className="">
      <button onClick={onTrigger}>
        <AppIcon
          name="bell"
          className="rounded-full p-2 flex items-center justify-center bg-[#C5EEEA] [&_svg_path]:stroke-[var(--color-primary)]  w-8 h-8 cursor-pointer hover:bg-[#C5EEEA]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]"
          title="Bell Icon"
        />
      </button>
    </div>
  );
}
