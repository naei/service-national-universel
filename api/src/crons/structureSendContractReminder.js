// Chemin à faire template 209 :
// Pour toutes les applications VALIDATED il y a 7j mais sans contrat, chercher la structure puis le responsable de structure, et shoot un mail
// soit:
// pas de contractId dans application
// contract?.invitationSent !== "true"
require("../mongo");
const { capture } = require("../sentry");
const Application = require("../models/application");
const Contract = require("../models/contract");
const Referent = require("../models/referent");
const esClient = require("../es");
const Structure = require("../models/structure");
const { sendTemplate } = require("../sendinblue");
const slack = require("../slack");
const { SENDINBLUE_TEMPLATES } = require("snu-lib");
const { ADMIN_URL } = require("../config");
const { differenceInDays, getMonth } = require("date-fns");

exports.handler = async () => {
  try {
    let countTotal = 0;
    let countHit = 0;
    let countApplicationMonth = {};
    const tutors = [];
    const now = Date.now();
    const cursor = await Application.find({
      status: "VALIDATED",
    }).cursor();
    await cursor.eachAsync(async function (application) {
      countTotal++;
      let patches = await application.patches.find({ ref: application._id, date: { $lt: addDays(now, 8), $gte: addDays(now, 7) } }).sort("-date");
      if (!patches.length) return;
      patches = patches.filter((patch) => patch.ops.filter((op) => op.path === "/status" && op.value === "VALIDATED").length > 0);
      if (!patches.length) return;
      if (!application.structureId) return;
      const structure = await Structure.findById(application.structureId);
      if (!structure) return;
      // const header = { index, type: "_doc" };
      // return fetch(`${apiURL}/es/${index}/_msearch`, {
      //   retries: 3,
      //   retryDelay: 1000,
      //   retryOn: [502, 503, 504],
      //   mode: "cors",
      //   method: "POST",
      //   redirect: "follow",
      //   referrer: "no-referrer",
      //   headers: { "Content-Type": "application/x-ndjson", Authorization: `JWT ${this.token}` },
      //   body: [header, body].map((e) => `${JSON.stringify(e)}\n`).join(""),
      // })
      //   .then((r) => jsonOrRedirectToSignIn(r))
      //   .catch((e) => {
      //     Sentry.captureMessage("Error caught in esQuery");
      //     Sentry.captureException(e);
      //     console.error(e);
      //     return { responses: [] };
      //   });
      // -----------------------------------------
      // const { responses: referentResponses } = await api.esQuery("referent", {
      //   query: { bool: { must: { match_all: {} }, filter: [{ term: { "structureId.keyword": structure._id } }] } },
      //   size: ES_NO_LIMIT,
      // });
      const responsibles = esClient
        .msearch({
          index: "referent",
          body: {
            query: { bool: { must: { match_all: {} }, filter: [{ term: { "structureId.keyword": structure._id } }] } },
          },
        })[0]
        ?.hits?.hits.map((e) => ({ _id: e._id, ...e._source }));
      if (differenceInDays(now, patches[0].date) >= 7) {
        // send a mail to the referents
        countHit++;
        countApplicationMonth[getMonth(new Date(patches[0].date)) + 1] = (countApplicationMonth[getMonth(new Date(patches[0].date)) + 1] || 0) + 1;
        if (responsibles.length > 1) {
          responsibles.map((r) => {
            if (!tutors.includes(r.email)) tutors.push(r.email);

            sendTemplate(SENDINBLUE_TEMPLATES.referent.APPLICATION_REMINDER, {
              emailTo: [{ name: `${r.firstName} ${r.lastName}`, email: r.email }],
              params: {
                cta: `${ADMIN_URL}/volontaire/${application.youngId}`,
                youngFirstName: application.youngFirstName,
                youngLastName: application.youngLastName,
                missionName: application.missionName,
              },
            });
          });
        } else {
          if (!tutors.includes(responsibles.email)) tutors.push(responsibles.email);
          sendTemplate(SENDINBLUE_TEMPLATES.referent.APPLICATION_REMINDER, {
            emailTo: [{ name: `${responsibles.firstName} ${responsibles.lastName}`, email: responsibles.email }],
            params: {
              cta: `${ADMIN_URL}/volontaire/${application.youngId}`,
              youngFirstName: application.youngFirstName,
              youngLastName: application.youngLastName,
              missionName: application.missionName,
            },
          });
        }
      }
    });
    slack.info({
      title: "missionApplicationPending",
      text: `${countHit}/${countTotal} (${((countHit / countTotal) * 100).toFixed(
        2,
      )}%) candidatures ciblées.\nmails envoyés: ${countHit}\ncandidatures ciblées/mois : ${JSON.stringify(countApplicationMonth)}\ntuteurs notifiés : ${
        tutors.length
      }\nmoyenne mails/tuteur : ${countHit / tutors.length}`,
    });
  } catch (e) {
    capture(e);
    slack.error({ title: "applicationPending", text: JSON.stringify(e) });
  }
};

const addDays = (d, days = 1) => {
  var date = new Date(d);
  date.setDate(date.getDate() + days);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};
