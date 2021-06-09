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
  expect(cohesionCenter.department).toEqual(expectedCohesionCenter.department);
  expect(cohesionCenter.region).toEqual(expectedCohesionCenter.region);
  expect(cohesionCenter.address).toEqual(expectedCohesionCenter.address);
  expect(cohesionCenter.complementAddress).toEqual(expectedCohesionCenter.complementAddress);
  expect(cohesionCenter.zip).toEqual(expectedCohesionCenter.zip);
  expect(cohesionCenter.city).toEqual(expectedCohesionCenter.city);
  expect(cohesionCenter.observations).toEqual(expectedCohesionCenter.observations);
  expect(cohesionCenter.outfitDelivered).toEqual(expectedCohesionCenter.outfitDelivered);
  expect(cohesionCenter.departmentCode).toEqual(expectedCohesionCenter.departmentCode);
  expect(cohesionCenter.COR).toEqual(expectedCohesionCenter.COR);
  expect(cohesionCenter.country).toEqual(expectedCohesionCenter.country);
  expect(cohesionCenter.documentation).toEqual(expectedCohesionCenter.documentation);
  expect(cohesionCenter.code).toEqual(expectedCohesionCenter.code);
  expect(cohesionCentercohesionCentercohesionCenter.name).toEqual(expectedCohesionCenter.name);
}

module.exports = {
  getCohesionCentersHelper,
  getCohesionCenterByNameHelper,
  deleteCohesionCenterByNameHelper,
  createCohesionCenterHelper,
  expectCohesionCenterToEqual,
};
