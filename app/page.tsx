"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    window.location.href = "https://korhrd-group-db.vercel.app/cert";
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <p style={{ fontSize: "16px", color: "#666" }}>
        교육원 신청 페이지로 이동 중입니다...
      </p>
      <a
        href="https://korhrd-group-db.vercel.app/cert"
        style={{
          padding: "12px 24px",
          backgroundColor: "#2563eb",
          color: "#fff",
          borderRadius: "8px",
          textDecoration: "none",
          fontSize: "16px",
        }}
      >
        신청하기
      </a>
    </div>
  );
}
