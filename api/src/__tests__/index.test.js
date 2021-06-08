require("dotenv").config({ path: "./.env-testing" });
const regeneratorRuntime = require("regenerator-runtime");
const faker = require("faker");
const request = require("supertest");
const mongoose = require("mongoose");
const { MONGO_URL } = require("../config");

const getAppHelper = require("./helpers/app");

const getNewYoungFixture = require("./fixtures/young");
const getNewReferentFixture = require("./fixtures/referent");
const getNewProgramFixture = require("./fixtures/program");
const getNewMissionFixture = require("./fixtures/mission");
const getNewDepartmentServiceFixture = require("./fixtures/departmentService");
const getNewCohesionCenterFixture = require("./fixtures/cohesionCenter");

const { getYoungsHelper, getYoungByEmailHelper, deleteYoungByEmailHelper, createYoungHelper, expectYoungToEqual } = require("./helpers/young");

const {
  getMissionsHelper,
  getMissionByNameHelper,
  deleteMissionByNameHelper,
  createMissionHelper,
  expectMissionToEqual,
} = require("./helpers/mission");

const {
  getProgramsHelper,
  getProgramByNameHelper,
  deleteProgramByNameHelper,
  createProgramHelper,
  expectProgramToEqual,
} = require("./helpers/program");

const {
  getReferentsHelper,
  getReferentByEmailHelper,
  deleteReferentByEmailHelper,
  createReferentHelper,
  expectReferentToEqual,
} = require("./helpers/referent");

const {
  getDepartmentServicesHelper,
  getDepartmentServiceByServiceNameHelper,
  deleteDepartmentServiceByServiceNameHelper,
  createDepartmentServiceHelper,
  expectDepartmentServiceToEqual,
} = require("./helpers/departmentService");

const {
  getCohesionCentersHelper,
  getCohesionCenterByNameHelper,
  deleteCohesionCenterByNameHelper,
  createCohesionCenterHelper,
  expectCohesionCenterToEqual,
} = require("./helpers/cohesionCenter");

let db;

beforeAll(async () => {
  await mongoose.connect(MONGO_URL, { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.Promise = global.Promise; //Get the default connection
  db = mongoose.connection;
  db.on("error", console.error.bind(console, "MongoDB connection error:"));
  db.once("open", () => console.log("CONNECTED OK"));
});

afterAll(async () => {
  await db.close();
});

describe("Referent", () => {
  it("POST /referent/signup_invite/admin", async () => {
    const referentFixture = getNewReferentFixture();
    const referentsBefore = await getReferentsHelper();
    const post = await request(getAppHelper()).post("/referent/signup_invite/admin").send(referentFixture);
    expect(post.statusCode).toEqual(200);
    const referentsAfter = await getReferentsHelper();
    expect(referentsAfter.length).toEqual(referentsBefore.length + 1);
    await deleteReferentByEmailHelper(referentFixture.email);
  });

  it("GET /referent", async () => {
    const res = await request(getAppHelper()).get("/referent").send();
    expect(res.statusCode).toEqual(200);
  });

  it("POST /referent/young", async () => {
    const youngFixture = getNewYoungFixture();
    const youngsBefore = await getYoungsHelper();
    const res = await request(getAppHelper()).post("/referent/young/").send(youngFixture);
    expect(res.statusCode).toEqual(200);
    const young = await getYoungByEmailHelper(youngFixture.email);
    expect(young.firstName).toEqual(youngFixture.firstName);
    const youngsAfter = await getYoungsHelper();
    expect(youngsAfter.length).toEqual(youngsBefore.length + 1);
    await deleteYoungByEmailHelper(youngFixture.email);
  });

  it("PUT /referent/young/:id", async () => {
    const youngFixture = getNewYoungFixture();
    await createYoungHelper(youngFixture);
    let young = await getYoungByEmailHelper(youngFixture.email);
    const modifiedYoung = { ...youngFixture };
    modifiedYoung.firstName = faker.name.firstName();
    const put = await request(getAppHelper()).put(`/referent/young/${young._id}`).send(modifiedYoung);
    expect(put.statusCode).toEqual(200);
    young = await getYoungByEmailHelper(youngFixture.email);
    expectYoungToEqual(young, modifiedYoung);
    await deleteYoungByEmailHelper(youngFixture.email);
  });

  it("GET /referent/:id", async () => {
    const referentFixture = getNewReferentFixture();
    await createReferentHelper(referentFixture);
    const referent = await getReferentByEmailHelper(referentFixture.email);
    const res = await request(getAppHelper()).get(`/referent/${referent._id}`);
    expect(res.statusCode).toEqual(200);
    expectReferentToEqual(referentFixture, res.body.data);
    await deleteReferentByEmailHelper(referentFixture.email);
  });

  it("PUT /referent/:id", async () => {
    const referentFixture = getNewReferentFixture();
    await createReferentHelper(referentFixture);
    let referent = await getReferentByEmailHelper(referentFixture.email);
    const modifiedReferent = { ...referentFixture };
    modifiedReferent.firstName = faker.name.firstName();
    const res = await request(getAppHelper()).put(`/referent/${referent._id}`).send(modifiedReferent);
    expect(res.statusCode).toEqual(200);
    referent = await getReferentByEmailHelper(referentFixture.email);
    expectReferentToEqual(referent, modifiedReferent);
    await deleteReferentByEmailHelper(referentFixture.email);
  });
});

describe("Young", () => {
  it("DELETE /young/:id", async () => {
    const youngFixture = getNewYoungFixture();
    await createYoungHelper(youngFixture);
    const youngsBefore = await getYoungsHelper();
    const young = await getYoungByEmailHelper(youngFixture.email);
    const res = await request(getAppHelper()).delete(`/young/${young._id}`);
    expect(res.statusCode).toEqual(200);
    const youngsAfter = await getYoungsHelper();
    expect(youngsAfter.length).toEqual(youngsBefore.length - 1);
  });
});

describe("Program", () => {
  it("POST /program", async () => {
    const programFixture = getNewProgramFixture();
    const programsBefore = await getProgramsHelper();
    const res = await request(getAppHelper()).post("/program").send(programFixture);
    expect(res.statusCode).toEqual(200);
    const programsAfter = await getProgramsHelper();
    expect(programsAfter.length).toEqual(programsBefore.length + 1);
    await deleteProgramByNameHelper(programFixture.name);
  });

  it("PUT /program", async () => {
    const programFixture = getNewProgramFixture();
    let program = await createProgramHelper(programFixture);
    const modifiedProgram = { ...programFixture };
    modifiedProgram.url = faker.internet.url();
    modifiedProgram._id = program._id;
    const res = await request(getAppHelper()).put("/program").send(modifiedProgram);
    expect(res.statusCode).toEqual(200);
    program = await getProgramByNameHelper(programFixture.name);
    expectProgramToEqual(program, modifiedProgram);
    await deleteProgramByNameHelper(programFixture.name);
  });

  it("GET /program/:id", async () => {
    const programFixture = getNewProgramFixture();
    const program = await createProgramHelper(programFixture);
    const res = await request(getAppHelper()).get(`/program/${program._id}`);
    expect(res.statusCode).toEqual(200);
    expectProgramToEqual(programFixture, res.body.data);
    await deleteProgramByNameHelper(programFixture.name);
  });

  it("DELETE /program/:id", async () => {
    const programFixture = getNewProgramFixture();
    const program = await createProgramHelper(programFixture);
    const programsBefore = await getProgramsHelper();
    const res = await request(getAppHelper()).delete(`/program/${program._id}`);
    expect(res.statusCode).toEqual(200);
    const programsAfter = await getProgramsHelper();
    expect(programsAfter.length).toEqual(programsBefore.length - 1);
  });
});

describe("Mission", () => {
  it("POST /mission", async () => {
    const missionFixture = getNewMissionFixture();
    const missionsBefore = await getMissionsHelper();
    const res = await request(getAppHelper()).post("/mission").send(missionFixture);
    expect(res.statusCode).toEqual(200);
    const missionsAfter = await getMissionsHelper();
    expect(missionsAfter.length).toEqual(missionsBefore.length + 1);
    await deleteMissionByNameHelper(missionFixture.name);
  });

  it("/GET /mission/:id", async () => {
    const missionFixture = getNewMissionFixture();
    const mission = await createMissionHelper(missionFixture);
    const res = await request(getAppHelper()).get(`/mission/${mission._id}`);
    expect(res.statusCode).toEqual(200);
    expectMissionToEqual(missionFixture, res.body.data);
    await deleteMissionByNameHelper(missionFixture.name);
  });

  // Problem with GET from API and findOne from Mongoose
  // It looks like GET always send some attributes in string (Date => string)
  // It looks like findOne send attributes defined by the model (Date => Date)
  // Expect doesn't work because Date != string

  it("PUT /mission/:id", async () => {
    const missionFixture = getNewMissionFixture();
    let mission = await createMissionHelper(missionFixture);
    const modifiedMission = { ...missionFixture };
    modifiedMission.startAt = faker.date.past().toISOString();
    const res = await request(getAppHelper()).put(`/mission/${mission._id}`).send(modifiedMission);
    expect(res.statusCode).toEqual(200);
    mission = await getMissionByNameHelper(missionFixture.name);
    expectMissionToEqual(modifiedMission, mission);
    await deleteMissionByNameHelper(missionFixture.name);
  });

  it("DELETE /mission/:id", async () => {
    const missionFixture = getNewMissionFixture();
    let mission = await createMissionHelper(missionFixture);
    const missionsBefore = await getMissionsHelper();
    const res = await request(getAppHelper()).delete(`/mission/${mission._id}`).send();
    expect(res.statusCode).toEqual(200);
    const missionsAfter = await getMissionsHelper();
    expect(missionsAfter.length).toEqual(missionsBefore.length - 1);
  });
});

describe("Department service", () => {
  it("POST /department-service", async () => {
    const departmentServiceFixture = getNewDepartmentServiceFixture();
    const departmentServicesBefore = await getDepartmentServicesHelper();
    const res = await request(getAppHelper()).post("/department-service").send(departmentServiceFixture);
    expect(res.statusCode).toEqual(200);
    const departmentServiceAfter = await getDepartmentServicesHelper();
    expect(departmentServiceAfter.length).toEqual(departmentServicesBefore.length + 1);
    await deleteDepartmentServiceByServiceNameHelper(departmentServiceFixture.serviceName);
  });

  it("GET /department-service/referent/:id", async () => {
    const referentFixture = getNewReferentFixture();
    const referent = await createReferentHelper(referentFixture);
    let departmentServiceFixture = getDepartmentServicesHelper();
    departmentServiceFixture.department = referentFixture.department;
    await createDepartmentServiceHelper(departmentServiceFixture);
    const res = await request(getAppHelper()).get(`/department-service/referent/${referent._id}`).send();
    expect(res.statusCode).toEqual(200);
    expectDepartmentServiceToEqual(departmentServiceFixture, res.body.data);
    await deleteDepartmentServiceByServiceNameHelper(departmentServiceFixture.name);
    await deleteReferentByEmailHelper(referentFixture.email);
  });
});

describe("Cohesion center", () => {
  it("POST /cohesion-center", async () => {
    const cohesionCenterFixture = getNewCohesionCenterFixture();
    const cohesionCentersBefore = await getCohesionCentersHelper();
    const res = await request(getAppHelper()).post("/cohesion-center").send(cohesionCenterFixture);
    expect(res.statusCode).toEqual(200);
    const cohesionCentersAfter = await getCohesionCentersHelper();
    expect(cohesionCentersAfter.length).toEqual(cohesionCentersBefore.length + 1);
    await deleteCohesionCenterByNameHelper(cohesionCenterFixture.name);
  });
});
