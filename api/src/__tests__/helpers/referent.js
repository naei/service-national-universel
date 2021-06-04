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
  // Switch every attributes type of JSON object to string
  // Avoid type errors
  const referentAttributesToString = JSON.parse(JSON.stringify(referent));
  const expectedReferentAttributesToString = JSON.parse(JSON.stringify(expectedReferent));
  expect(referentAttributesToString.region).toEqual(expectedReferentAttributesToString.region);
  expect(referentAttributesToString.department).toEqual(expectedReferentAttributesToString.department);
  expect(referentAttributesToString.firstName).toEqual(expectedReferentAttributesToString.firstName);
  expect(referentAttributesToString.lastName).toEqual(expectedReferentAttributesToString.lastName);
  expect(referentAttributesToString.email).toEqual(expectedReferentAttributesToString.email);
  expect(referentAttributesToString.phone).toEqual(expectedReferentAttributesToString.phone);
  expect(referentAttributesToString.mobile).toEqual(expectedReferentAttributesToString.mobile);
  expect(referentAttributesToString.role).toEqual(expectedReferentAttributesToString.role);
}

module.exports = {
  getReferentsHelper,
  getReferentByEmailHelper,
  deleteReferentByEmailHelper,
  createReferentHelper,
  expectReferentToEqual,
};
