/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"] */
/**
 * Alexa Skill Lambda Function for accessing Particle devices.
 **/

'use strict';

const Alexa = require('alexa-sdk');
const utils = require('./skillUtils').utils

const Particle = require('particle-api-js');
const particle = new Particle();
const token = process.env.PARTICLE_ACCESS_TOKEN;

const APP_ID = 'amzn1.ask.skill.925e2d0a-2bd9-434a-83ae-c6bb8fd16085';

const handlers = {
  'NumberOfDevicesIntent': function() {
    particle.listDevices({ auth: token })
      .then(
        (devices) => {
          const onlineDevicesCount = devices.body.filter(device => device.connected).length;

          this.emit(':tell', `There ${onlineDevicesCount > 1 
            ? `are ${onlineDevicesCount} devices` 
            : `is ${onlineDevicesCount} device`} online at the moment.`);
        },
        (err) => {
          this.emit(':tell', `This request has failed. Please try again. ${err}`);
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
            
            this.emit(':tell', `You have one device online, named ${utils.normalizeDeviceName(device.name)}.`);
          } else {
            this.emit(':tell', `You have ${onlineDevicesCount} devices online. Their names are ${utils.sayArray(onlineDevices.map(device => utils.normalizeDeviceName(device.name)))}.`)
          }
        },
        (err) => {
          console.log('ListDevicesIntent Error: ', error)
          this.emit(':tell', `This request has failed. Please try again. ${err}`);
        }
      );
  },
    'ListFunctionsIntent': function() {
      const deviceName = utils.normalizeDeviceName(this.event.request.intent.slots.device.value);

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
            this.response.speak(`Here are the functions for the device named 
              ${utils.normalizeDeviceName(deviceName)}: 
              ${utils.sayArray(device.body.functions)}`);
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

    },
    'AMAZON.HelpIntent': function () {
      const speechOutput = this.t('HELP_MESSAGE');
      const reprompt = this.t('HELP_MESSAGE');
      this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
      this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
      this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};

exports.handler = function (event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};
