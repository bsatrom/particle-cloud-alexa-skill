/**
 * Alexa Skill Lambda Function for accessing Particle devices.
 **/

'use strict';

const Alexa = require('alexa-sdk');
const utils = require('./skillUtils').utils;

const Particle = require('particle-api-js');
const particle = new Particle();
const token = process.env.PARTICLE_ACCESS_TOKEN;

const APP_ID = 'amzn1.ask.skill.925e2d0a-2bd9-434a-83ae-c6bb8fd16085';

const handlers = {
  'LaunchRequest': function () {
    this.response
      .speak('Welcome to the Particle cloud. You can ask me about online devices, list functions and variables, set variables and call cloud functions.')
      .listen('Give me a command or ask "what can Particle do" to get started.');
    this.emit(':responseReady');
  },
  'NumberOfDevicesIntent': function() {
    particle.listDevices({ auth: token })
      .then(
        (devices) => {
          const onlineDevicesCount = devices.body.filter(device => device.connected).length;

          this.response.speak(`There ${onlineDevicesCount > 1 
            ? `are ${onlineDevicesCount} devices` 
            : `is ${onlineDevicesCount} device`} online at the moment.`);
          this.emit(':responseReady');
        },
        (err) => {
          this.response.speak(`This request has failed. Please try again. ${err}`);
          this.emit(':responseReady');
        }
      );
  },
  'ListDevicesIntent': function() {
    particle.listDevices({ auth: token })
      .then(
        (devices) => {
          const onlineDevices = devices.body.filter(device => device.connected);
          const onlineDevicesCount = onlineDevices.length;

          if (onlineDevicesCount === 1) {
            const device = onlineDevices[0]
            
            this.response.speak(`You have one device online, named ${utils.normalizeDeviceName(device.name)}.`);
            this.emit(':responseReady');
          } else {
            this.response.speak(`You have ${onlineDevicesCount} devices online. Their names are ${utils.sayArray(onlineDevices.map(device => utils.normalizeDeviceName(device.name)))}.`);
            this.emit(':responseReady');
          }
        },
        (err) => {
          console.log('ListDevicesIntent Error: ', error)
          this.response.speak(`This request has failed. Please try again. ${err}`);
          this.emit(':responseReady');
        }
      );
    },
    'SetActiveDeviceIntent': function() {
      const deviceName = this.event.request.intent.slots.device.value;
      this.attributes['currentDevice'] = deviceName;

      this.response.speak(`Ok, I've set your current device to ${deviceName}`);
      this.emit(':responseReady');
    },
    'GetActiveDeviceIntent': function() {
      this.response.speak(`Your current active device is ${this.attributes['currentDevice']}`);
      this.emit(':responseReady');
    },
    'ListFunctionsIntent': function() {
      const deviceName = utils.normalizeDeviceName(this.event.request.intent.slots.device.value || this.attributes['currentDevice']);

      particle.listDevices({ auth: token })
        .then((devices) => {
          const device = devices.body.filter(device => 
            utils.normalizeDeviceName(device.name) === deviceName)[0];
          
          if (device) {
            return particle.getDevice({ deviceId: device.id, auth: token });
          } else {
            this.response.speak(`Sorry, I couldn't find a device by that name`);

            return null;
          }
        })
        .then((device) => {
          if (device) {
            this.response.speak(`Here are the functions for the device named ${deviceName}: ${utils.sayArray(device.body.functions)}`);
          }
        })
        .catch((error) => {
          console.log('ListFunctionsIntent Error: ', error)
          this.response.speak(`Sorry, I couldn't get what you wanted. Please try again`);
        })
        .finally(() => {
          this.emit(':responseReady');
        })
    },
    'CallFunctionIntent': function() {
      const slots = this.event.request.intent.slots
      const deviceName = utils.normalizeDeviceName(slots.device.value || this.attributes['currentDevice']);
      const functionName = utils.normalizeFunctionName(slots.functionName.value);
      const functionArg = slots.argument.value;

      particle.listDevices({ auth: token })
        .then((devices) => {
          const device = devices.body.filter(device => 
            utils.normalizeDeviceName(device.name) === deviceName)[0];
          
          if (device) {
            return particle.getDevice({ deviceId: device.id, auth: token });
          } else {
            this.response.speak(`Sorry, I couldn't find a device by that name`);

            return null;
          }
        })
        .then((device) => {
          if (device) {
            const cloudFunction = device.body.functions.filter(fn => fn === functionName)[0];
            const fnArguments = { 
              deviceId: device.body.id,
              name: cloudFunction,
              argument: functionArg,
              auth: token 
            };

            if (cloudFunction) { 
              return particle.callFunction(fnArguments);
            } else {
              this.response.speak(`Sorry, I couldn't find a function by that name`);

              return null;
            }
          }
        })
        .then((result) => {
          if (result) {
            this.response.speak(`Ok, I called the function named ${functionName} on ${deviceName}`);
          } else {
            this.response.speak(`Sorry, I was unable to call the function named ${functionName} on ${deviceName}`);
          }
        })
        .catch((error) => {
          console.log('CallFunctionIntent Error: ', error)
          this.response.speak(`Sorry, I couldn't call the function what you wanted. Please try again`);
        })
        .finally(() => {
          this.emit(':responseReady');
        })
    },
    'AMAZON.HelpIntent': function () {
      const speechOutput = this.t('HELP_MESSAGE');
      const reprompt = this.t('HELP_MESSAGE');
      this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
      this.response.speak(this.t('STOP_MESSAGE'));
      this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
      this.response.speak(this.t('STOP_MESSAGE'));
      this.emit(':responseReady');
    },
};

exports.handler = function (event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  alexa.dynamoDBTableName = 'particleDeviceState';
  alexa.registerHandlers(handlers);
  alexa.execute();
};
