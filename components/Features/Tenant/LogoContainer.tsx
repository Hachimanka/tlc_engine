"use client";

import React from "react";
import Image from "next/image";

export const LogoContainer = () => {
  return (
    <a href="/" aria-label="Home">
      <Image
        src="/TLCLogo.svg"
        alt="TLC Engine Logo"
        width={48}
        height={48}
        className="object-contain"
      />
    </a>
  );
};

export default LogoContainer;
