"use client";
import React from "react";
import { useKeycloak } from "@react-keycloak/web";

const F = "'Helvetica Neue', Arial, sans-serif";

interface SidebarProps {
  view: "FORM" | "REPORT" | "ADMIN";
  setView: (v: "FORM" | "REPORT" | "ADMIN") => void;
  user: any;
}

const NAV_ICONS = {
  FORM: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  REPORT: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  ADMIN: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    </svg>
  ),
};

export default function Sidebar({ view, setView, user }: SidebarProps) {
  const { keycloak } = useKeycloak();
  const hasAccess = (role: string) =>
    keycloak?.hasRealmRole(role) ||
    keycloak?.hasResourceRole(role, "insa-frontend");

  const isManagement = hasAccess("ROLE_MANAGEMENT");
  const isHRAdmin = hasAccess("ROLE_HR_ADMIN");

  const items = [
    { id: "FORM", label: "የምዘና ቅፅ", sub: "Rating Form", visible: true },
    {
      id: "REPORT",
      label: "ሪፖርት",
      sub: "View Reports",
      visible: isManagement || isHRAdmin,
    },
    { id: "ADMIN", label: "አስተዳዳሪ", sub: "Admin Panel", visible: isHRAdmin },
  ].filter((i) => i.visible);

  const initials = user
    ? (user.firstName?.[0] || "").toUpperCase() +
      (user.lastName?.[0] || "").toUpperCase()
    : "?";
  const roleLabel = isHRAdmin
    ? "HR Administrator"
    : isManagement
      ? "Management"
      : "Staff";

  return (
    <div
      style={{
        width: "236px",
        minWidth: "236px",
        height: "100vh",
        background: "rgb(26, 24, 38)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        fontFamily: F,
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "22px 20px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "#1E3A8A",
              border: "1.5px solid rgba(240,204,48,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
            }}
          >
            <span
              style={{
                color: "#f0cc30",
                fontWeight: 900,
                fontSize: "9px",
                letterSpacing: "-0.5px",
              }}
            >
              INSA
            </span>
          </div>
          <div>
            <div
              style={{
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              ERP Leadership
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.28)",
                fontSize: "8px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginTop: "2px",
              }}
            >
              Competency v2.0
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 20px 6px" }}>
        <span
          style={{
            color: "rgba(255,255,255,0.18)",
            fontSize: "8px",
            fontWeight: 700,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
          }}
        >
          Navigation
        </span>
      </div>

      <nav
        style={{
          flex: 1,
          padding: "4px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {items.map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as any)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "11px",
                padding: "10px 12px",
                borderRadius: "9px",
                border: "none",
                background: active ? "rgba(30,58,138,0.5)" : "transparent",
                borderLeft: active
                  ? "2.5px solid #f0cc30"
                  : "2.5px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                if (!active)
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                if (!active)
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
              }}
            >
              <span
                style={{
                  color: active ? "#f0cc30" : "rgba(255,255,255,0.32)",
                  flexShrink: 0,
                }}
              >
                {NAV_ICONS[item.id as keyof typeof NAV_ICONS]}
              </span>
              <div style={{ textAlign: "left", flex: 1 }}>
                <div
                  style={{
                    color: active ? "#ffffff" : "rgba(255,255,255,0.55)",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    color: active
                      ? "rgba(240,204,48,0.6)"
                      : "rgba(255,255,255,0.22)",
                    fontSize: "8.5px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginTop: "2px",
                  }}
                >
                  {item.sub}
                </div>
              </div>
              {active && (
                <div
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "#f0cc30",
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User card */}
      <div
        style={{
          margin: "10px",
          borderRadius: "10px",
          background: "rgba(30,58,138,0.2)",
          border: "1px solid rgba(30,58,138,0.4)",
          padding: "12px 14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              flexShrink: 0,
              background: "#1E3A8A",
              border: "1.5px solid rgba(240,204,48,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{ color: "#f0cc30", fontSize: "11px", fontWeight: 700 }}
            >
              {initials}
            </span>
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div
              style={{
                color: "#ffffff",
                fontSize: "11.5px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.firstName} {user?.lastName}
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: "9px",
                marginTop: "1px",
              }}
            >
              {roleLabel}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: "10px",
            paddingTop: "10px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.22)" }}>
            ID:{" "}
            <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
              {user?.id || "—"}
            </span>
          </div>
          {user?.position?.title && (
            <div
              style={{
                fontSize: "9px",
                color: "rgba(255,255,255,0.22)",
                marginTop: "2px",
              }}
            >
              {user.position.title}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
