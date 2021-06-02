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
  expect(young.region).toEqual(expectedYoung.region);
  expect(young.department).toEqual(expectedYoung.department);
  expect(young.firstName).toEqual(expectedYoung.firstName);
  expect(young.lastName).toEqual(expectedYoung.lastName);
  expect(young.email).toEqual(expectedYoung.email);
  expect(young.phone).toEqual(expectedYoung.phone);
  expect(young.birthCountry).toEqual(expectedYoung.birthCountry);
  expect(young.zip).toEqual(expectedYoung.zip);
  expect(young.city).toEqual(expectedYoung.city);
  expect(young.cityCode).toEqual(expectedYoung.cityCode);
  expect(young.gender).toEqual(expectedYoung.gender);
}

module.exports = {
  getYoungsHelper,
  getYoungByEmailHelper,
  deleteYoungByEmailHelper,
  createYoungHelper,
  expectYoungToEqual,
};
