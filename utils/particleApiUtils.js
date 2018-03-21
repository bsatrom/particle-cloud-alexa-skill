// Particle Utility functions for Alexa Skill
const Particle = require('particle-api-js');
const utils = require('./skillUtils').utils;
const particle = new Particle();

const listDevices = token => {
  return new Promise((resolve, reject) => {
    particle
      .listDevices({ auth: token })
      .then(devices => resolve(devices), err => reject(err));
  });
};

const getDevice = (token, id) => {
  return new Promise((resolve, reject) => {
    particle
      .getDevice({ deviceId: id, auth: token })
      .then(device => resolve(device))
      .catch(err => reject(err));
  });
};

const getOnlineDevices = token => {
  return new Promise((resolve, reject) => {
    listDevices(token)
      .then(devices => {
        const onlineDevices = devices.body.filter(device => device.connected);
        resolve(onlineDevices);
      })
      .catch(err => reject(err));
  });
};

const getDeviceByName = (token, deviceName) => {
  return new Promise((resolve, reject) => {
    listDevices(token).then(devices => {
      const device = devices.body.filter(
        device => utils.normalizeDeviceName(device.name) === deviceName
      )[0];

      if (device) {
        resolve(getDevice(token, device.id));
      } else {
        reject('DEVICE_NOT_FOUND');
      }
    });
  });
};

const getDeviceFunctions = (token, deviceName) => {
  return new Promise((resolve, reject) => {
    getDeviceByName(token, deviceName)
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

const callDeviceFunction = (token, deviceName, functionName, functionArg) => {
  return new Promise((resolve, reject) => {
    getDeviceByName(token, deviceName)
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

const getDeviceVariables = (token, deviceName) => {
  return new Promise((resolve, reject) => {
    getDeviceByName(token, deviceName)
      .then(device => {
        if (device) {
          resolve(device.body.variables);
        } else {
          reject();
        }
      })
      .catch(err => reject(err));
  });
};

const getVariable = (token, deviceName, variable) => {
  return new Promise((resolve, reject) => {
    getDeviceByName(token, deviceName)
      .then(device => {
        if (device) {
          const varArguments = {
            deviceId: device.body.id,
            name: variable,
            auth: token
          };

          resolve(particle.getVariable(varArguments));
        } else {
          reject();
        }
      })
      .catch(err => {
        reject(err);
      });
  });
};

exports.utils = {
  getOnlineDevices,
  getDeviceFunctions,
  callDeviceFunction,
  getDeviceVariables,
  getVariable
};
