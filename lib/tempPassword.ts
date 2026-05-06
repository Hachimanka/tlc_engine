import "server-only";

import { randomBytes } from "crypto";

export const generateTempPassword = () => {
  const base = randomBytes(8).toString("hex");
  const mix = randomBytes(4).toString("base64").replace(/[^a-zA-Z0-9]/g, "");

  return `Tlc!${base}${mix.slice(0, 3)}`;
};
