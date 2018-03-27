/**
 * Alexa Skill Lambda Function for accessing Particle devices.
 **/
'use strict';

const Alexa = require('alexa-sdk');
const bst = require('bespoken-tools');

const utils = require('./utils/skillUtils').utils;
const particleApiUtils = require('./utils/particleApiUtils').utils;

const emitResponse = (alexaSdk, response) => {
  alexaSdk.response.speak(response);
  alexaSdk.emit(':responseReady');
};

const emitAccountLinkResponse = alexaSdk => {
  alexaSdk.emit(
    ':tellWithLinkAccountCard',
    'To start using this skill, please use the Alexa app to authenticate with Particle.'
  );
};

const emitSetActiveDeviceResponse = alexaSdk => {
  alexaSdk.response.speak(
    `You need to set an active device to use this command. Say Alexa, set active device with the name of the device you want to work with.`
  );
  alexaSdk.emit('responseReady');
};

const handlers = {
  LaunchRequest: function() {
    if (this.event.session.user.accessToken === undefined) {
      return emitAccountLinkResponse(this);
    }

    this.response
      .speak(
        'Welcome to the Particle cloud. You can ask me about online devices, list functions and variables, set variables and call cloud functions.'
      )
      .listen(
        'Give me a command or ask "what can Particle do" to get started.'
      );
    this.emit(':responseReady');
  },
  NumberOfDevicesIntent: function() {
    let response;
    const token = this.event.session.user.accessToken;

    if (token === undefined) {
      return emitAccountLinkResponse(this);
    }

    particleApiUtils
      .getOnlineDevices(token)
      .then(devices => {
        const onlineDevicesCount = devices.length;

        response = `You currently have ${
          onlineDevicesCount > 1
            ? `${onlineDevicesCount} devices`
            : `${onlineDevicesCount} device`
        } online.`;
      })
      .catch(err => {
        response = `This request has failed. Please try again. ${err}`;
      })
      .finally(() => {
        emitResponse(this, response);
      });
  },
  ListDevicesIntent: function() {
    let response;
    const token = this.event.session.user.accessToken;

    if (token === undefined) {
      return emitAccountLinkResponse(this);
    }

    particleApiUtils
      .getOnlineDevices(token)
      .then(devices => {
        const onlineDevicesCount = devices.length;

        if (onlineDevicesCount === 1) {
          const device = devices[0];

          response = `You have one device online, named ${utils.normalizeDeviceName(
            device.name
          )}.`;
        } else {
          response = `You have ${onlineDevicesCount} devices online. Their names are ${utils.sayArray(
            devices.map(device => utils.normalizeDeviceName(device.name))
          )}.`;
        }
      })
      .catch(err => {
        response = `This request has failed. Please try again. ${err}`;
      })
      .finally(() => {
        emitResponse(this, response);
      });
  },
  SetActiveDeviceIntent: function() {
    const deviceName = this.event.request.intent.slots.deviceName.value;
    const token = this.event.session.user.accessToken;

    if (token === undefined) {
      return emitAccountLinkResponse(this);
    }

    if (deviceName) {
      particleApiUtils
        .getDeviceByName(token, utils.normalizeDeviceName(deviceName))
        .then(device => {
          this.attributes['currentDevice'] = device.body.name;
          this.attributes['currentDeviceId'] = device.body.id;

          emitResponse(
            this,
            `Ok, I've set your current device to ${deviceName}`
          );
        })
        .catch(err => {
          if (err === 'DEVICE_NOT_FOUND') {
            emitResponse(
              this,
              `Sorry, I couldn't find a device with the name ${deviceName} in your account.`
            );
          } else {
            emitResponse(
              this,
              `Sorry, I couldn't get what you wanted. Please try again`
            );
          }
        });
    } else {
      emitResponse(
        this,
        `Sorry, I didn't understand which device you wanted me to set as active. Please try again.`
      );
    }
  },
  GetActiveDeviceIntent: function() {
    if (!this.attributes['currentDevice']) {
      emitResponse(this, `You don't currently have an active device set.`);
    } else {
      emitResponse(
        this,
        `Your current active device is ${utils.normalizeDeviceName(
          this.attributes['currentDevice']
        )}`
      );
    }
  },
  ListFunctionsIntent: function() {
    const token = this.event.session.user.accessToken;

    if (token === undefined) {
      return emitAccountLinkResponse(this);
    }

    const deviceName = utils.normalizeDeviceName(
      this.event.request.intent.slots.deviceName.value ||
        this.attributes['currentDevice']
    );

    if (!deviceName) {
      return emitResponse(
        this,
        `Please provide a device name or set an active device to use this command.`
      );
    }

    particleApiUtils
      .getDeviceFunctions(token, deviceName)
      .then(functions => {
        if (functions.length === 0) {
          emitResponse(
            this,
            `There are no functions available on the device named ${deviceName}`
          );
        } else {
          emitResponse(
            this,
            `Here are the functions for the device named ${deviceName}: ${utils.sayArray(
              functions
            )}`
          );
        }
      })
      .catch(err => {
        if (err === 'DEVICE_NOT_FOUND') {
          emitResponse(this, `Sorry, I couldn't find a device by that name`);
        } else {
          emitResponse(
            this,
            `Sorry, I couldn't get what you wanted. Please try again`
          );
        }
      });
  },
  CallFunctionIntent: function() {
    const token = this.event.session.user.accessToken;

    if (token === undefined) {
      return emitAccountLinkResponse(this);
    } else if (this.attributes['currentDevice'] === undefined) {
      return emitSetActiveDeviceResponse(this);
    }

    const slots = this.event.request.intent.slots;
    const deviceName = utils.normalizeDeviceName(
      this.attributes['currentDevice']
    );
    const functionName = utils.normalizeFunctionName(slots.functionName.value);

    particleApiUtils
      .callDeviceFunction(token, deviceName, functionName)
      .then(functions => {
        emitResponse(
          this,
          `Ok, I called the function named ${functionName} on ${deviceName}`
        );
      })
      .catch(err => {
        if (err === 'FUNCTION_NOT_FOUND') {
          emitResponse(this, `Sorry, I couldn't find a function by that name`);
        } else if (err === 'DEVICE_NOT_FOUND') {
          emitResponse(this, `Sorry, I couldn't find a device by that name`);
        } else {
          emitResponse(
            this,
            `Sorry, I couldn't get what you wanted. Please try again`
          );
        }
      });
  },
  ListVariablesIntent: function() {
    const token = this.event.session.user.accessToken;

    if (token === undefined) {
      return emitAccountLinkResponse(this);
    }

    const deviceName = utils.normalizeDeviceName(
      this.event.request.intent.slots.deviceName.value ||
        this.attributes['currentDevice']
    );

    if (!deviceName) {
      return emitResponse(
        this,
        `Please provide a device name or set an active device to use this command.`
      );
    }

    particleApiUtils
      .getDeviceVariables(token, deviceName)
      .then(variables => {
        if (utils.objectIsEmpty(variables)) {
          emitResponse(
            this,
            `There are no variables available on the device named ${deviceName}`
          );
        } else {
          emitResponse(
            this,
            `Here are the variables for the device named ${deviceName}: ${utils.sayObject(
              variables
            )}`
          );
        }
      })
      .catch(err => {
        if (err === 'DEVICE_NOT_FOUND') {
          emitResponse(this, `Sorry, I couldn't find a device by that name`);
        } else {
          emitResponse(
            this,
            `Sorry, I couldn't get what you wanted. Please try again`
          );
        }
      });
  },
  GetVariableIntent: function() {
    const token = this.event.session.user.accessToken;

    if (token === undefined) {
      return emitAccountLinkResponse(this);
    } else if (this.attributes['currentDevice'] === undefined) {
      return emitSetActiveDeviceResponse(this);
    }

    const slots = this.event.request.intent.slots;
    const deviceName = utils.normalizeDeviceName(
      slots.deviceName.value || this.attributes['currentDevice']
    );
    const variable = utils.normalizeFunctionName(slots.variable.value);

    particleApiUtils
      .getVariable(token, deviceName, variable)
      .then(value => {
        emitResponse(
          this,
          `The value of the variable named ${variable} on device ${deviceName} is ${
            value.body.result
          }`
        );
      })
      .catch(err => {
        if (err.statusCode === 404) {
          emitResponse(
            this,
            `Sorry, I couldn't find a variable by that name. Please try again.`
          );
        } else {
          emitResponse(
            this,
            `Sorry, I couldn't get what you wanted. Please try again`
          );
        }
      });
  },
  'AMAZON.HelpIntent': function() {
    const speechOutput = `You can ask me to set an active device, get names of online devices, get variables and call functions.`;
    const reprompt = `What would you like to do?`;
    this.emit(':ask', speechOutput + ' ' + reprompt, reprompt);
  },
  'AMAZON.CancelIntent': function() {
    emitResponse(this, `Goodbye`);
  },
  'AMAZON.StopIntent': function() {
    emitResponse(this, `Goodbye`);
  } /*,
  Unhandled: function() {
    var speechOutput = 'Sorry, something went wrong.';
    var reprompt = 'Would you like to try again?';
    this.response.speak(speechOutput + ' ' + reprompt).listen(reprompt);
    this.emit(':responseReady');
  }*/
};

exports.handler = bst.Logless.capture(
  'ccc51960-fc8e-4cf3-b117-67bf2b90f105',
  function(event, context) {
    const APP_ID = 'amzn1.ask.skill.925e2d0a-2bd9-434a-83ae-c6bb8fd16085';
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.dynamoDBTableName = 'particleDeviceState';
    alexa.registerHandlers(handlers);
    alexa.execute();
  }
);
