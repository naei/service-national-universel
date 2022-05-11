const fs = require("fs");
const SamlStrategy = require("passport-saml").Strategy;
const {
  EDUCONNECT_ENTRY_POINT,
  EDUCONNECT_LOGOUT_POINT,
  EDUCONNECT_ISSUER,
  EDUCONNECT_CALLBACK_URL,
  EDUCONNECT_SP_CERT,
  EDUCONNECT_SP_KEY,
  EDUCONNECT_IDP_SIGN_CERT,
  EDUCONNECT_IDP_ENCR_CERT,
} = require("../../config");
const { fetch, toPassportConfig, claimsToCamelCase } = require("passport-saml-metadata");
const path = require("path");

const MetadataReader = require("../reader");

const STRATEGY_NAME_USER = "educonnect";

function sso(passport) {
  passport.serializeUser(function (user, done) {
    console.log("-----------------------------");
    console.log("serialize user");
    console.log(user);
    console.log("-----------------------------");
    done(null, user);
  });
  passport.deserializeUser(function (user, done) {
    console.log("-----------------------------");
    console.log("deserialize user");
    console.log(user);
    console.log("-----------------------------");
    done(null, user);
  });

  const educonnectSamlStrategy = new SamlStrategy(
    {
      entryPoint: EDUCONNECT_ENTRY_POINT,
      issuer: EDUCONNECT_ISSUER,
      callbackUrl: EDUCONNECT_CALLBACK_URL,
      cert: [EDUCONNECT_IDP_SIGN_CERT, EDUCONNECT_IDP_ENCR_CERT],
      privateKey: EDUCONNECT_SP_KEY,
      decryptionPvk: `-----BEGIN PRIVATE KEY-----\n${EDUCONNECT_SP_KEY}\n-----END PRIVATE KEY-----`,
      identifierFormat: null,
      disableRequestedAuthnContext: true,
      validateInResponseTo: false,
    },
    async function (profile, done) {
      return done(null, profile);
    },
  );
  passport.use(STRATEGY_NAME_USER, educonnectSamlStrategy);

  // fs.writeFileSync(path.resolve(__dirname, "./SNU_STAGING-metadata.xml"), educonnectSamlStrategy.generateServiceProviderMetadata());
}

module.exports = sso;
