const CohesionCenterObject = require("../../models/cohesionCenter");

async function getCohesionCentersHelper() {
  return await CohesionCenterObject.find({});
}

async function getCohesionCenterByNameHelper(cohesionCenterName) {
  return await CohesionCenterObject.findOne({ name: cohesionCenterName });
}

async function deleteCohesionCenterByNameHelper(cohesionCenterName) {
  const cohesionCenter = await getCohesionCenterByNameHelper(cohesionCenterName);
  await cohesionCenter.remove();
}

async function createCohesionCenterHelper(cohesionCenter) {
  return await CohesionCenterObject.create(cohesionCenter);
}

function expectCohesionCenterToEqual(cohesionCenter, expectedCohesionCenter) {
  // Switch every attributes type of JSON object to string
  // Avoid type errors
  const cohesionCenterAttributesToString = JSON.parse(JSON.stringify(cohesionCenter));
  const expectedCohesionCenterAttributesToString = JSON.parse(JSON.stringify(expectedCohesionCenter));
  expect(cohesionCenterAttributesToString.department).toEqual(expectedCohesionCenterAttributesToString.department);
  expect(cohesionCenterAttributesToString.region).toEqual(expectedCohesionCenterAttributesToString.region);
  expect(cohesionCenterAttributesToString.address).toEqual(expectedCohesionCenterAttributesToString.address);
  expect(cohesionCenterAttributesToString.complementAddress).toEqual(expectedCohesionCenterAttributesToString.complementAddress);
  expect(cohesionCenterAttributesToString.zip).toEqual(expectedCohesionCenterAttributesToString.zip);
  expect(cohesionCenterAttributesToString.city).toEqual(expectedCohesionCenterAttributesToString.city);
  expect(cohesionCenterAttributesToString.observations).toEqual(expectedCohesionCenterAttributesToString.observations);
  expect(cohesionCenterAttributesToString.outfitDelivered).toEqual(expectedCohesionCenterAttributesToString.outfitDelivered);
  expect(cohesionCenterAttributesToString.departmentCode).toEqual(expectedCohesionCenterAttributesToString.departmentCode);
  expect(cohesionCenterAttributesToString.COR).toEqual(expectedCohesionCenterAttributesToString.COR);
  expect(cohesionCenterAttributesToString.country).toEqual(expectedCohesionCenterAttributesToString.country);
  expect(cohesionCenterAttributesToString.documentation).toEqual(expectedCohesionCenterAttributesToString.documentation);
  expect(cohesionCenterAttributesToString.code).toEqual(expectedCohesionCenterAttributesToString.code);
  expect(cohesionCenterAttributesToString.name).toEqual(expectedCohesionCenterAttributesToString.name);
}

module.exports = {
  getCohesionCentersHelper,
  getCohesionCenterByNameHelper,
  deleteCohesionCenterByNameHelper,
  createCohesionCenterHelper,
  expectCohesionCenterToEqual,
};
