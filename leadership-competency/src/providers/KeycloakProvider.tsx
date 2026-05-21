"use client";

import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "../lib/keycloak";
import React, { ReactNode, useEffect, useState } from "react";

const SPINNER_CSS = `@keyframes kc-spin{to{transform:rotate(360deg)}}`;

function LoadingScreen() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#060d1a",
        color: "rgba(255,255,255,0.45)",
        fontFamily: "'Helvetica Neue', sans-serif",
        fontSize: "13px",
        letterSpacing: "0.1em",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: SPINNER_CSS }} />
      <div
        style={{
          width: "36px",
          height: "36px",
          border: "3px solid rgba(196,160,0,0.25)",
          borderTop: "3px solid #c4a000",
          borderRadius: "50%",
          animation: "kc-spin 0.8s linear infinite",
        }}
      />
      <span>Authenticating with INSA Portal…</span>
    </div>
  );
}

export const KeycloakProvider = ({ children }: { children: ReactNode }) => {
  // Mount guard — prevents SSR/hydration mismatch.
  // KeycloakProvider only renders on the client after first paint.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!keycloak) {
    return <>{children}</>;
  }

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: "login-required",
        pkceMethod: "S256",
        checkLoginIframe: false, // avoids iframe CORS issues in dev
      }}
      LoadingComponent={<LoadingScreen />}
    >
      {children}
    </ReactKeycloakProvider>
  );
};
