"use client";
import React, { useState } from "react";
import { useKeycloak } from "@react-keycloak/web";

const F = "'Helvetica Neue', Arial, sans-serif";

export default function InsaLogin() {
  const { keycloak } = useKeycloak();
  const [empId, setEmpId] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    keycloak.login({ loginHint: empId });
  };

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 16px",
    background:
      focused === name ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)",
    border: `1.5px solid ${focused === name ? "rgba(196,160,0,0.6)" : "rgba(255,255,255,0.1)"}`,
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
    fontFamily: F,
    transition: "all 0.2s",
    boxShadow: focused === name ? "0 0 0 3px rgba(196,160,0,0.1)" : "none",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(160deg, #060d1a 0%, #0c1e3a 50%, #060d1a 100%)",
        fontFamily: F,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glows */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          right: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(196,160,0,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "-15%",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,48,135,0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Grid pattern */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.04,
          pointerEvents: "none",
        }}
      >
        <defs>
          <pattern id="g" width="52" height="52" patternUnits="userSpaceOnUse">
            <path
              d="M52 0L0 0 0 52"
              fill="none"
              stroke="#c4a000"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>

      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "440px",
          margin: "0 24px",
        }}
      >
        {/* Gold top bar */}
        <div
          style={{
            height: "3px",
            background:
              "linear-gradient(90deg, transparent, #c4a000, #f0d060, #c4a000, transparent)",
            borderRadius: "2px",
            marginBottom: 0,
          }}
        />

        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderTop: "none",
            borderRadius: "0 0 20px 20px",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{ padding: "40px 40px 32px", textAlign: "center" }}>
            {/* Emblem */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "80px",
                height: "80px",
                marginBottom: "20px",
                background: "linear-gradient(145deg, #122040, #0d1a30)",
                borderRadius: "18px",
                border: "1.5px solid rgba(196,160,0,0.35)",
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(196,160,0,0.15)",
              }}
            >
              <span
                style={{
                  color: "#c4a000",
                  fontWeight: 900,
                  fontSize: "18px",
                  letterSpacing: "-1px",
                  fontFamily: F,
                }}
              >
                INSA
              </span>
            </div>

            <h1
              style={{
                color: "#ffffff",
                fontSize: "17px",
                fontWeight: 700,
                lineHeight: 1.35,
                margin: "0 0 6px",
                letterSpacing: "0.01em",
              }}
            >
              የመረጃ መረብ ደህንነት አስተዳደር
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.38)",
                fontSize: "9.5px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                margin: "0 0 16px",
                fontFamily: F,
              }}
            >
              Information Network Security Agency
            </p>
            <span
              style={{
                display: "inline-block",
                background: "rgba(196,160,0,0.12)",
                border: "1px solid rgba(196,160,0,0.28)",
                color: "#c4a000",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                padding: "5px 16px",
                borderRadius: "20px",
              }}
            >
              Leadership Assessment Portal
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
              margin: "0 40px",
            }}
          />

          {/* Form */}
          <form onSubmit={handleLogin} style={{ padding: "32px 40px 36px" }}>
            {[
              {
                name: "loginName",
                label: "First Name / ስም",
                placeholder: "Enter your first name",
                value: loginName,
                setter: setLoginName,
              },
              {
                name: "empId",
                label: "Employee ID / መለያ ቁጥር",
                placeholder: "e.g. EMP-001",
                value: empId,
                setter: setEmpId,
              },
            ].map(({ name, label, placeholder, value, setter }) => (
              <div key={name} style={{ marginBottom: "18px" }}>
                <label
                  style={{
                    display: "block",
                    color: "rgba(255,255,255,0.42)",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                    fontFamily: F,
                  }}
                >
                  {label}
                </label>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={value}
                  required
                  onChange={(e) => setter(e.target.value)}
                  onFocus={() => setFocused(name)}
                  onBlur={() => setFocused(null)}
                  style={inputStyle(name)}
                />
              </div>
            ))}

            <div style={{ marginTop: "28px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: loading
                    ? "rgba(196,160,0,0.35)"
                    : "linear-gradient(135deg, #b8920a, #d4aa1a, #f0cc30, #d4aa1a, #b8920a)",
                  border: "none",
                  borderRadius: "9px",
                  color: "#0a1420",
                  fontSize: "11.5px",
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: F,
                  boxShadow: loading
                    ? "none"
                    : "0 4px 24px rgba(196,160,0,0.35), inset 0 1px 0 rgba(255,255,255,0.3)",
                  transition: "all 0.2s",
                }}
              >
                {loading ? "በማረጋገጥ ላይ..." : "ግባ — Secure Login"}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              padding: "14px 40px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.18)",
                fontSize: "9px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                margin: 0,
                fontFamily: F,
              }}
            >
              © 2026 INSA Ethiopia · Confidential System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
