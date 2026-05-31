import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import Link from "next/link";

const fraunces = Fraunces({ subsets: ["latin"], display: "swap" });
const plexSans = IBM_Plex_Sans({ weight: ["400", "500"], subsets: ["latin"], display: "swap" });

export default function Home() {
  return (
    <div
      className={plexSans.className}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb",
        gap: 32,
      }}
    >
      <span
        className={fraunces.className}
        style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-1px", color: "#111" }}
      >
        Dialogue
      </span>

      <Link
        href="/provider"
        style={{
          display: "inline-block",
          padding: "14px 32px",
          borderRadius: 999,
          background: "#111",
          color: "#fff",
          fontSize: 15,
          fontWeight: 500,
          textDecoration: "none",
          letterSpacing: "0.01em",
        }}
      >
        Provider dashboard →
      </Link>
    </div>
  );
}
