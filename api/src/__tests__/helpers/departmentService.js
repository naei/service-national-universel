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
  expect(departmentService.department).toEqual(expectedDepartmentService.department);
  expect(departmentService.region).toEqual(expectedDepartmentService.region);
  expect(departmentService.directionName).toEqual(expectedDepartmentService.directionName);
  expect(departmentService.serviceName).toEqual(expectedDepartmentService.serviceName);
  expect(departmentService.serviceNumber).toEqual(expectedDepartmentService.serviceNumber);
  expect(departmentService.address).toEqual(expectedDepartmentService.address);
  expect(departmentService.complementAddress).toEqual(expectedDepartmentService.complementAddress);
  expect(departmentService.zip).toEqual(expectedDepartmentService.zip);
  expect(departmentService.city).toEqual(expectedDepartmentService.city);
  expect(departmentService.description).toEqual(expectedDepartmentService.description);
}

module.exports = {
  getDepartmentServicesHelper,
  getDepartmentServiceByServiceNameHelper,
  deleteDepartmentServiceByServiceNameHelper,
  createDepartmentServiceHelper,
  expectDepartmentServiceToEqual,
};
