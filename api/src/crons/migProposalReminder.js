require("../mongo");

const { capture } = require("../sentry");
const Application = require("../models/application");
const Young = require("../models/young");
const { sendTemplate } = require("../sendinblue");
const slack = require("../slack");
const { SENDINBLUE_TEMPLATES } = require("snu-lib");
const { APP_URL } = require("../config");

exports.handler = async () => {
  try {
    let countNotice = 0;
    const now = Date.now();
    const cursor = await Application.find({
      status: "WAITING_ACCEPTATION",
      createdAt: { $lt: addDays(now, 8), $gte: addDays(now, 7) },
    }).cursor();
    await cursor.eachAsync(async function (application) {
      countNotice++;
      const young = await Young.findById(application.youngId);
      if (!young) return;
        sendTemplate(SENDINBLUE_TEMPLATES.young.MIG_PROPOSAL_REMINDER, {
          emailTo: [{ name: `${young.firstName} ${young.lastName}`, email: young.email }],
          params: {
            cta: `${APP_URL}/candidature`,
          },
        });
    });
    slack.success({ title: "1 week notice pending mig proposal", text: `${countNotice} pending mig proposals has been noticed !` });
  } catch (e) {
    capture(e);
    slack.error({ title: "migProposalReminder", text: JSON.stringify(e) });
  }
};

const addDays = (d, days = 1) => {
  var date = new Date(d);
  date.setDate(date.getDate() + days);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};
