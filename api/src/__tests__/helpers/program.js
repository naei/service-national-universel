const ProgramObject = require("../../models/program");

async function getProgramsHelper() {
  return await ProgramObject.find({});
}

async function getProgramByNameHelper(programName) {
  return await ProgramObject.findOne({ name: programName });
}

async function deleteProgramByNameHelper(programName) {
  const program = await getProgramByNameHelper(programName);
  await program.remove();
}

async function createProgramHelper(program) {
  return await ProgramObject.create(program);
}

function expectProgramToEqual(program, expectedProgram) {
  // Switch every attributes type of JSON object to string
  // Avoid type errors
  const programAttributesToString = JSON.parse(JSON.stringify(program));
  const expectedProgramAttributesToString = JSON.parse(JSON.stringify(expectedProgram));
  expect(programAttributesToString.name).toEqual(expectedProgramAttributesToString.name);
  expect(programAttributesToString.department).toEqual(expectedProgramAttributesToString.department);
  expect(programAttributesToString.region).toEqual(expectedProgramAttributesToString.region);
  expect(programAttributesToString.type).toEqual(expectedProgramAttributesToString.type);
  expect(programAttributesToString.url).toEqual(expectedProgramAttributesToString.url);
  expect(programAttributesToString.descriptionDuration).toEqual(expectedProgramAttributesToString.descriptionDuration);
  expect(programAttributesToString.descriptionMoney).toEqual(expectedProgramAttributesToString.descriptionMoney);
  expect(programAttributesToString.descriptionFor).toEqual(expectedProgramAttributesToString.descriptionFor);
}

module.exports = {
  getProgramsHelper,
  getProgramByNameHelper,
  deleteProgramByNameHelper,
  createProgramHelper,
  expectProgramToEqual,
};
