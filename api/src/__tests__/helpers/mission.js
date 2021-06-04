const MissionObject = require("../../models/mission");

async function getMissionsHelper() {
  return await MissionObject.find({});
}

async function getMissionByNameHelper(missionName) {
  return await MissionObject.findOne({ name: missionName });
}

async function deleteMissionByNameHelper(missionName) {
  const mission = await getMissionByNameHelper(missionName);
  await mission.remove();
}

async function createMissionHelper(mission) {
  return await MissionObject.create(mission);
}

function expectMissionToEqual(mission, expectedMission) {
  // Switch every attributes type of JSON object to string
  // Avoid type errors
  const missionAttributesToString = JSON.parse(JSON.stringify(mission));
  const expectedMissionAttributesToString = JSON.parse(JSON.stringify(expectedMission));
  expect(missionAttributesToString.name).toEqual(expectedMissionAttributesToString.name);
  expect(missionAttributesToString.startAt).toEqual(expectedMissionAttributesToString.startAt);
  expect(missionAttributesToString.endAt).toEqual(expectedMissionAttributesToString.endAt);
  expect(missionAttributesToString.placesTotal).toEqual(expectedMissionAttributesToString.placesTotal);
  expect(missionAttributesToString.placesLeft).toEqual(expectedMissionAttributesToString.placesLeft);
  expect(missionAttributesToString.actions).toEqual(expectedMissionAttributesToString.actions);
  expect(missionAttributesToString.description).toEqual(expectedMissionAttributesToString.description);
  expect(missionAttributesToString.justifications).toEqual(expectedMissionAttributesToString.justifications);
  expect(missionAttributesToString.contraintes).toEqual(expectedMissionAttributesToString.contraintes);
  expect(missionAttributesToString.structureName).toEqual(expectedMissionAttributesToString.structureName);
  expect(missionAttributesToString.address).toEqual(expectedMissionAttributesToString.address);
  expect(missionAttributesToString.zip).toEqual(expectedMissionAttributesToString.zip);
  expect(missionAttributesToString.city).toEqual(expectedMissionAttributesToString.city);
  expect(missionAttributesToString.department).toEqual(expectedMissionAttributesToString.department);
  expect(missionAttributesToString.region).toEqual(expectedMissionAttributesToString.region);
  expect(missionAttributesToString.country).toEqual(expectedMissionAttributesToString.country);
  expect(missionAttributesToString.remote).toEqual(expectedMissionAttributesToString.remote);
  expect(missionAttributesToString.location.lat).toEqual(expectedMissionAttributesToString.location.lat);
  expect(missionAttributesToString.location.lon).toEqual(expectedMissionAttributesToString.location.lon);
}

module.exports = {
  getMissionsHelper,
  getMissionByNameHelper,
  deleteMissionByNameHelper,
  createMissionHelper,
  expectMissionToEqual,
};
