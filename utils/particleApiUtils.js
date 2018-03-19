// Particle Utility functions for Alexa Skill
const Particle = require('particle-api-js');
const utils = require('./skillUtils').utils;
const particle = new Particle();
const token = process.env.PARTICLE_ACCESS_TOKEN;

const listDevices = new Promise((resolve, reject) => {
  particle
    .listDevices({ auth: token })
    .then(devices => resolve(devices), err => reject(err));
});

const getDevice = id => {
  return new Promise((resolve, reject) => {
    particle
      .getDevice({ deviceId: id, auth: token })
      .then(device => resolve(device))
      .catch(err => reject(err));
  });
};

const getOnlineDevices = new Promise((resolve, reject) => {
  listDevices
    .then(devices => {
      const onlineDevices = devices.body.filter(device => device.connected);
      resolve(onlineDevices);
    })
    .catch(err => reject(err));
});

const getDeviceByName = deviceName => {
  return new Promise((resolve, reject) => {
    listDevices.then(devices => {
      const device = devices.body.filter(
        device => utils.normalizeDeviceName(device.name) === deviceName
      )[0];

      if (device) {
        resolve(getDevice(device.id));
      } else {
        reject('DEVICE_NOT_FOUND');
      }
    });
  });
};

const getDeviceFunctions = deviceName => {
  return new Promise((resolve, reject) => {
    getDeviceByName(deviceName)
      .then(device => {
        if (device) {
          resolve(device.body.functions);
        } else {
          reject();
        }
      })
      .catch(err => reject(err));
  });
};

const callDeviceFunction = (deviceName, functionName, functionArg) => {
  return new Promise((resolve, reject) => {
    getDeviceByName(deviceName)
      .then(device => {
        if (device) {
          const cloudFunction = device.body.functions.filter(
            fn => fn === functionName
          )[0];

          const fnArguments = {
            deviceId: device.body.id,
            name: cloudFunction,
            argument: functionArg,
            auth: token
          };

          if (cloudFunction) {
            resolve(particle.callFunction(fnArguments));
          } else {
            reject('FUNCTION_NOT_FOUND');
          }
        } else {
          reject();
        }
      })
      .catch(err => reject(err));
  });
};

exports.utils = {
  getOnlineDevices,
  getDeviceFunctions,
  callDeviceFunction
};
