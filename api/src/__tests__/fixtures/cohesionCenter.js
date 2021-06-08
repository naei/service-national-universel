const faker = require("faker");

faker.locale = "fr";

function getNewCohesionCenterFixture() {
  return {
    name: faker.name.findName(),
    code: faker.datatype.number(),
    documentation: faker.datatype.number(),
    country: faker.address.country(),
    COR: faker.lorem.sentences(),
    departmentCode: faker.datatype.number(),
    address: faker.address.streetAddress(),
    city: faker.address.city(),
    zip: faker.address.zipCode(),
    department: faker.address.state(),
    region: faker.address.state(),
    placesTotal: 10,
    placesLeft: 5,
    outfitDelivered: faker.lorem.sentences(),
    observations: faker.lorem.sentences(),
    waitingList: [],
  };
}

module.exports = getNewCohesionCenterFixture;
