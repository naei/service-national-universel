const { ExtraErrorData, RewriteFrames } = require("@sentry/integrations");
const { captureException: sentryCaptureException, captureMessage: sentryCaptureMessage, Integrations: NodeIntegrations, init, Handlers } = require("@sentry/node");
const { Integrations: TracingIntegrations } = require("@sentry/tracing");
const { SENTRY_URL } = require("./config");

function initSentry(app) {
  console.log(SENTRY_URL);
  init({
    enabled: Boolean(SENTRY_URL),
    debug: true,
    dsn: SENTRY_URL,
    environment: "api",
    normalizeDepth: 16,
    integrations: [
      new ExtraErrorData({ depth: 16 }),
      new RewriteFrames({ root: process.cwd() }),
      new NodeIntegrations.Http({ tracing: true }),
      new NodeIntegrations.Modules(),
      new TracingIntegrations.Mongo({ useMongoose: true }),
      new TracingIntegrations.Express({ app }),
    ],
    tracesSampleRate: Number(1.0),
  });

  // The request handler must be the first middleware on the app
  app.use(Handlers.requestHandler());

  // TracingHandler creates a trace for every incoming request
  app.use(Handlers.tracingHandler());

  return () => {
    // The error handler must be before any other error middleware and after all controllers
    app.use(Handlers.errorHandler());
  };
}

function capture(err) {
  console.log("capture", err);
  if (err) {
    sentryCaptureException(err);
  }
}
function captureMessage(mess) {
  console.log("captureMessage", mess);
  if (mess) {
    sentryCaptureMessage(mess);
  }
}

module.exports = {
  initSentry,
  capture,
  captureMessage,
};
