const ReferentObject = require("../../models/referent");

async function getReferentsHelper() {
  return await ReferentObject.find({});
}

async function getReferentByEmailHelper(referentEmail) {
  return await ReferentObject.findOne({ email: referentEmail });
}

async function deleteReferentByEmailHelper(referentEmail) {
  const referent = await getReferentByEmailHelper(referentEmail);
  await referent.remove();
}

async function createReferentHelper(referent) {
  return await ReferentObject.create(referent);
}

function expectReferentToEqual(referent, expectedReferent) {
  expect(referent.region).toEqual(expectedReferent.region);
  expect(referent.department).toEqual(expectedReferent.department);
  expect(referent.firstName).toEqual(expectedReferent.firstName);
  expect(referent.lastName).toEqual(expectedReferent.lastName);
  expect(referent.email).toEqual(expectedReferent.email);
  expect(referent.phone).toEqual(expectedReferent.phone);
  expect(referent.mobile).toEqual(expectedReferent.mobile);
  expect(referent.role).toEqual(expectedReferent.role);
}

module.exports = {
  getReferentsHelper,
  getReferentByEmailHelper,
  deleteReferentByEmailHelper,
  createReferentHelper,
  expectReferentToEqual,
};
