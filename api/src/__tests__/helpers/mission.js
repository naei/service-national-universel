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
  console.log("Fixture:", typeof mission.startAt);
  console.log("GET:", typeof expectedMission.startAt);
  expect(mission.name).toEqual(expectedMission.name);
  expect(mission.startAt).toEqual(expectedMission.startAt);
  expect(mission.endAt).toEqual(expectedMission.endAt);
  expect(mission.placesTotal).toEqual(expectedMission.placesTotal);
  expect(mission.placesLeft).toEqual(expectedMission.placesLeft);
  expect(mission.actions).toEqual(expectedMission.actions);
  expect(mission.description).toEqual(expectedMission.description);
  expect(mission.justifications).toEqual(expectedMission.justifications);
  expect(mission.contraintes).toEqual(expectedMission.contraintes);
  expect(mission.structureName).toEqual(expectedMission.structureName);
  expect(mission.address).toEqual(expectedMission.address);
  expect(mission.zip).toEqual(expectedMission.zip);
  expect(mission.city).toEqual(expectedMission.city);
  expect(mission.department).toEqual(expectedMission.department);
  expect(mission.region).toEqual(expectedMission.region);
  expect(mission.country).toEqual(expectedMission.country);
  expect(mission.remote).toEqual(expectedMission.remote);
  expect(mission.location.lat).toEqual(expectedMission.location.lat);
  expect(mission.location.lon).toEqual(expectedMission.location.lon);
}

module.exports = {
  getMissionsHelper,
  getMissionByNameHelper,
  deleteMissionByNameHelper,
  createMissionHelper,
  expectMissionToEqual,
};
