const ENVIRONMENT = getEnvironment();
const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 3000;
const secret = process.env.SECRET || "not-so-secret";

const ES_ENDPOINT = process.env.ES_ENDPOINT || "";
const SENTRY_URL = process.env.SENTRY_URL || "";

module.exports = {
  PORT,
  MONGO_URL,
  secret,
  ENVIRONMENT,
  ES_ENDPOINT,
  SENTRY_URL,
};

function getEnvironment() {
  if (process.env.STAGING === "true") return "staging";
  else if (process.env.PRODUCTION === "true") return "production";
  else if (process.env.TESTING === "true" || process.env.NODE_ENV === "test")
    return "testing";
  return "development";
}
