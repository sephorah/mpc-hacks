import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";

const plexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`patient-workspace ${plexSans.variable} ${plexMono.variable} ${fraunces.variable}`}
    >
      <header>
        <div className="logo">Dialogue</div>
        <div className="crumb">Patient Portal</div>
      </header>
      {children}
    </div>
  );
}
