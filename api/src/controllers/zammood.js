const express = require("express");
const router = express.Router();
const passport = require("passport");
const slack = require("../slack");
const Joi = require("joi");

const { capture } = require("../sentry");
const zammood = require("../zammood");
const { ERRORS } = require("../utils");
const { ROLES } = require("snu-lib/roles");
const { ADMIN_URL } = require("../config.js");

router.get("/tickets", passport.authenticate("referent", { session: false, failWithError: true }), async (req, res) => {
  try {
    const data = await zammood.api(`/ticket?email=${req.user.email}`, { method: "GET", credentials: "include" });
    if (!data.ok) return res.status(404).send({ ok: false, code: ERRORS.NOT_FOUND });
    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});

// Get one tickets with its messages.
router.get("/ticket/:id", passport.authenticate(["referent", "young"], { session: false, failWithError: true }), async (req, res) => {
  try {
    const { ok, data } = await zammood.api(`/v0/ticket?clientId=${req.params.id}`, { method: "GET", credentials: "include" });
    if (!ok) return res.status(404).send({ ok: false, code: ERRORS.NOT_FOUND });
    const messages = await zammood.api(`/v0/message?ticketId=${data[0]._id}`, { method: "GET", credentials: "include" });
    if (!messages.ok) return res.status(404).send({ ok: false, code: ERRORS.NOT_FOUND });
    return res.status(200).send({ ok: true, data: messages.data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});

// Create a new ticket while authenticated
router.post("/ticket", passport.authenticate(["referent", "young"], { session: false, failWithError: true }), async (req, res) => {
  try {
    const obj = {
      clientId: req.body.clientId,
      subject: req.body.subject,
      message: req.body.message,
    };
    const { error, value } = Joi.object({
      clientId: Joi.number().required(),
      subject: Joi.string().required(),
      message: Joi.string().required(),
    })
      .unknown()
      .validate(obj);
    if (error) return res.status(400).send({ ok: false, code: ERRORS.INVALID_PARAMS });
    const { subject, message, clientId } = value;
    const structureLink = `${ADMIN_URL}/structure/${req.user.structureId}`;
    const missionsLink = `${ADMIN_URL}/structure/${req.user.structureId}/missions`;
    const centerLink = `${ADMIN_URL}/centre/${req.user.cohesionCenterId}`;
    const userAttributes = [
      { name: "date de création", value: req.user.createdAt },
      { name: "dernière connexion", value: req.user.lastLoginAt },
      { name: "role", value: req.user.role },
    ];
    if (req.user.role === ROLES.RESPONSIBLE || req.user.role === ROLES.SUPERVISOR) {
      userAttributes.push({ name: "lien vers la fiche structure", value: structureLink });
      userAttributes.push({ name: "lien général vers la page des missions proposées par la structure", value: missionsLink });
    }
    if (req.user.role === ROLES.HEAD_CENTER) {
      userAttributes.push({ name: "lien vers le centre de cohésion", value: centerLink });
    }
    const response = await zammood.api("/v0/message", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        message,
        email: req.user.email,
        subject,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        source: "PLATFORM",
        clientId,
        attributes: userAttributes,
      }),
    });
    if (!response.ok) return res.status(400).send({ ok: false, code: response });
    return res.status(200).send({ ok: true, data: response });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});

// Create a new ticket for public users => not used for now
router.post("/ticket/form", async (req, res) => {
  try {
    //const { subject, message, email, firstName, lastName, clientId, department, region } = req.body;
    const obj = {
      email: req.body.email,
      subject: req.body.subject,
      message: req.body.message,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      clientId: req.body.clientId,
      department: req.body.department,
      region: req.body.region,
      formSubjectStep1: req.body.subjectStep1,
      formSubjectStep2: req.body.subjectStep2,
      role: req.body.role,
    };
    const { error, value } = Joi.object({
      email: Joi.string().email().required(),
      subject: Joi.string().required(),
      message: Joi.string().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      clientId: Joi.number().required(),
      department: Joi.string().required(),
      region: Joi.string().required(),
      formSubjectStep1: Joi.string().required(),
      formSubjectStep2: Joi.string().required(),
      role: Joi.string().required(),
    })
      .unknown()
      .validate(obj);
    if (error) return res.status(400).send({ ok: false, code: ERRORS.INVALID_PARAMS });
    const { subject, message, firstName, lastName, email, clientId, department, region, formSubjectStep1, formSubjectStep2, role } = value;
    const userAttributes = [
      { name: "departement", value: department },
      { name: "region", value: region },
      { name: "role", value: role },
    ];
    const response = await zammood.api("/v0/message", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        message,
        email,
        clientId,
        subject,
        firstName,
        lastName,
        source: "FORM",
        attributes: userAttributes,
        formSubjectStep1,
        formSubjectStep2,
      }),
    });
    if (!response.ok) return res.status(400).send({ ok: false, code: response });
    return res.status(200).send({ ok: true, data: response });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});

router.post("/ticket/:id/message", passport.authenticate(["referent", "young"], { session: false, failWithError: true }), async (req, res) => {
  try {
    console.log("req.user", req.user);
    const structureLink = `${ADMIN_URL}/structure/${req.user.structureId}`;
    const missionsLink = `${ADMIN_URL}/structure/${req.user.structureId}/missions`;
    const centerLink = `${ADMIN_URL}/centre/${req.user.cohesionCenterId}`;
    const userAttributes = [
      { name: "date de création", value: req.user.createdAt },
      { name: "dernière connexion", value: req.user.lastLoginAt },
      { name: "role", value: req.user.role },
    ];
    if (req.user.role === ROLES.RESPONSIBLE || req.user.role === ROLES.SUPERVISOR) {
      userAttributes.push({ name: "lien vers la fiche structure", value: structureLink });
      userAttributes.push({ name: "lien général vers la page des missions proposées par la structure", value: missionsLink });
    }
    if (req.user.role === ROLES.HEAD_CENTER) {
      userAttributes.push({ name: "lien vers le centre de cohésion", value: centerLink });
    }
    const response = await zammood.api("/v0/message", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        lastName: req.user.lastName,
        firstName: req.user.firstName,
        email: req.user.email,
        message: req.body.message,
        clientId: req.params.id,
        attributes: userAttributes,
      }),
    });
    if (!response.ok) slack.error({ title: "Create message Zammod", text: JSON.stringify(response.code) });
    return res.status(200).send({ ok: true, data: response });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR, error });
  }
});

module.exports = router;
