const ApplicationObject = require("../../models/application");

async function getApplicationsHelper() {
  return await ApplicationObject.find({});
}

async function getApplicationByIdHelper(id) {
  return await ApplicationObject.findOne({ _id: id });
}

async function deleteApplicationByIdHelper(id) {
  const application = await getApplicationByIdHelper(id);
  await application.remove();
}

async function createApplicationHelper(application) {
  return await ApplicationObject.create(application);
}

function expectApplicationToEqual(application, expectedApplication) {
  // Need to parse the objects because attributes types changed
  // Deep equal failed on Date which became string
  const applicationParsed = JSON.parse(JSON.stringify(application));
  const expectedApplicationParsed = JSON.parse(JSON.stringify(expectedApplication));
  expect(applicationParsed.youngFirstName).toEqual(expectedApplicationParsed.youngFirstName);
  expect(applicationParsed.youngLastName).toEqual(expectedApplicationParsed.youngLastName);
  expect(applicationParsed.youngEmail).toEqual(expectedApplicationParsed.youngEmail);
  expect(applicationParsed.youngBirthdateAt).toEqual(expectedApplicationParsed.youngBirthdateAt);
  expect(applicationParsed.youngCity).toEqual(expectedApplicationParsed.youngCity);
  expect(applicationParsed.youngDepartment).toEqual(expectedApplicationParsed.youngDepartment);
  expect(applicationParsed.youngCohort).toEqual(expectedApplicationParsed.youngCohort);
  expect(applicationParsed.missionId).toEqual(expectedApplicationParsed.missionId);
  expect(applicationParsed.missionName).toEqual(expectedApplicationParsed.missionName);
  expect(applicationParsed.missionDepartment).toEqual(expectedApplicationParsed.missionDepartment);
  expect(applicationParsed.missionRegion).toEqual(expectedApplicationParsed.missionRegion);
  expect(applicationParsed.structureId).toEqual(expectedApplicationParsed.structureId);
  expect(applicationParsed.tutorId).toEqual(expectedApplicationParsed.tutorId);
  expect(applicationParsed.contractId).toEqual(expectedApplicationParsed.contractId);
  expect(applicationParsed.tutorName).toEqual(expectedApplicationParsed.tutorName);
  expect(applicationParsed.priority).toEqual(expectedApplicationParsed.priority);
  expect(applicationParsed.status).toEqual(expectedApplicationParsed.status);
}

module.exports = {
  getApplicationsHelper,
  getApplicationByIdHelper,
  deleteApplicationByIdHelper,
  createApplicationHelper,
  expectApplicationToEqual,
};
