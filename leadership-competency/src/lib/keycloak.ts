import Keycloak from "keycloak-js";

const keycloakConfig = {
  url: "http://localhost:8080",
  realm: "insa-realm",
  clientId: "insa-frontend",
};

// Create the instance immediately but only initialize it in the browser
const keycloak =
  typeof window !== "undefined" ? new Keycloak(keycloakConfig) : undefined;

export default keycloak;
