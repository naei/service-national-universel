const faker = require("faker");

faker.locale = "fr";

function getNewApplicationFixture() {
  return {
    youngId: "",
    youngFirstName: faker.name.firstName(),
    youngLastName: faker.name.lastName(),
    youngEmail: faker.internet.email(),
    youngBirthdateAt: faker.date.past().toISOString(),
    youngCity: faker.address.city(),
    youngDepartment: faker.address.country(),
    youngCohort: "2021",
    missionId: "",
    missionName: "",
    missionDepartment: faker.address.country(),
    missionRegion: faker.address.country(),
    structureId: "",
    tutorId: "",
    contractId: "",
    tutorName: "",
    priority: "1",
    status: "WAITING_VALIDATION",
  };
}

module.exports = getNewApplicationFixture;
