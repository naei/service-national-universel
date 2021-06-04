const YoungObject = require("../../models/young");

async function getYoungsHelper() {
  return await YoungObject.find({});
}

async function getYoungByEmailHelper(youngEmail) {
  return await YoungObject.findOne({ email: youngEmail });
}

async function deleteYoungByEmailHelper(youngEmail) {
  const young = await getYoungByEmailHelper(youngEmail);
  await young.remove();
}

async function createYoungHelper(young) {
  return await YoungObject.create(young);
}

function expectYoungToEqual(young, expectedYoung) {
  // Switch every attributes type of JSON object to string
  // Avoid type errors
  const youngAttributesToString = JSON.parse(JSON.stringify(young));
  const expectedYoungAttributesToString = JSON.parse(JSON.stringify(expectedYoung));
  expect(youngAttributesToString.region).toEqual(expectedYoungAttributesToString.region);
  expect(youngAttributesToString.department).toEqual(expectedYoungAttributesToString.department);
  expect(youngAttributesToString.firstName).toEqual(expectedYoungAttributesToString.firstName);
  expect(youngAttributesToString.lastName).toEqual(expectedYoungAttributesToString.lastName);
  expect(youngAttributesToString.email).toEqual(expectedYoungAttributesToString.email);
  expect(youngAttributesToString.phone).toEqual(expectedYoungAttributesToString.phone);
  expect(youngAttributesToString.birthCountry).toEqual(expectedYoungAttributesToString.birthCountry);
  expect(youngAttributesToString.zip).toEqual(expectedYoungAttributesToString.zip);
  expect(youngAttributesToString.city).toEqual(expectedYoungAttributesToString.city);
  expect(youngAttributesToString.cityCode).toEqual(expectedYoungAttributesToString.cityCode);
  expect(youngAttributesToString.gender).toEqual(expectedYoungAttributesToString.gender);
}

module.exports = {
  getYoungsHelper,
  getYoungByEmailHelper,
  deleteYoungByEmailHelper,
  createYoungHelper,
  expectYoungToEqual,
};
