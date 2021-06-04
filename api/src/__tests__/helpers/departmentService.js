const DepartmentServiceObject = require("../../models/departmentService");

async function getDepartmentServicesHelper() {
  return await DepartmentServiceObject.find({});
}

async function getDepartmentServiceByServiceNameHelper(serviceName) {
  return await DepartmentServiceObject.findOne({ serviceName: serviceName });
}

async function deleteDepartmentServiceByServiceNameHelper(serviceName) {
  const departmentService = await getDepartmentServiceByServiceNameHelper(serviceName);
  await departmentService.remove();
}

async function createDepartmentServiceHelper(departmentService) {
  return await DepartmentServiceObject.create(departmentService);
}

function expectDepartmentServiceToEqual(departmentService, expectedDepartmentService) {
  // Switch every attributes type of JSON object to string
  // Avoid type errors
  const departmentServiceAttributesToString = JSON.parse(JSON.stringify(departmentService));
  const expectedDepartmentServiceAttributesToString = JSON.parse(JSON.stringify(expectedDepartmentService));
  expect(departmentServiceAttributesToString.department).toEqual(expectedDepartmentServiceAttributesToString.department);
  expect(departmentServiceAttributesToString.region).toEqual(expectedDepartmentServiceAttributesToString.region);
  expect(departmentServiceAttributesToString.directionName).toEqual(expectedDepartmentServiceAttributesToString.directionName);
  expect(departmentServiceAttributesToString.serviceName).toEqual(expectedDepartmentServiceAttributesToString.serviceName);
  expect(departmentServiceAttributesToString.serviceNumber).toEqual(expectedDepartmentServiceAttributesToString.serviceNumber);
  expect(departmentServiceAttributesToString.address).toEqual(expectedDepartmentServiceAttributesToString.address);
  expect(departmentServiceAttributesToString.complementAddress).toEqual(expectedDepartmentServiceAttributesToString.complementAddress);
  expect(departmentServiceAttributesToString.zip).toEqual(expectedDepartmentServiceAttributesToString.zip);
  expect(departmentServiceAttributesToString.city).toEqual(expectedDepartmentServiceAttributesToString.city);
  expect(departmentServiceAttributesToString.description).toEqual(expectedDepartmentServiceAttributesToString.description);
}

module.exports = {
  getDepartmentServicesHelper,
  getDepartmentServiceByServiceNameHelper,
  deleteDepartmentServiceByServiceNameHelper,
  createDepartmentServiceHelper,
  expectDepartmentServiceToEqual,
};
