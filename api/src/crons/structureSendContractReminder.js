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
      const structureResponsible = await Referent.findById(structure.responsible);
      if (differenceInDays(now, patches[0].date) >= 7) {
        // send a mail to the tutor
        countHit++;
        countApplicationMonth[getMonth(new Date(patches[0].date)) + 1] = (countApplicationMonth[getMonth(new Date(patches[0].date)) + 1] || 0) + 1;
        if (!tutors.includes(tutor.email)) tutors.push(tutor.email);

        sendTemplate(SENDINBLUE_TEMPLATES.referent.APPLICATION_REMINDER, {
          emailTo: [{ name: `${tutor.firstName} ${tutor.lastName}`, email: tutor.email }],
          params: {
            cta: `${ADMIN_URL}/volontaire/${application.youngId}`,
            youngFirstName: application.youngFirstName,
            youngLastName: application.youngLastName,
            missionName: application.missionName,
          },
        });
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
