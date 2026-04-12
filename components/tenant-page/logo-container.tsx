"use client";

import React from "react";
import Image from "next/image";

export const LogoContainer = () => {
  return (
    <div>
      <a href="/" aria-label="Home" className="flex items-center gap-3 -ml-15">
        <Image
          src="/TLCLogo.svg"
          alt="TLC Engine Logo"
          width={48}
          height={48}
          className="object-contain"
        />
      </a>
    </div>
  );
};

export default LogoContainer;
