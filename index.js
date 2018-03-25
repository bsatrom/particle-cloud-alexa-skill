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
    const deviceName = this.event.request.intent.slots.device.value;
    this.attributes['currentDevice'] = deviceName;

    emitResponse(this, `Ok, I've set your current device to ${deviceName}`);
  },
  GetActiveDeviceIntent: function() {
    if (this.attributes['currentDevice'] === '') {
      emitResponse(this, `You don't currently have an active device set.`);
    } else {
      emitResponse(
        this,
        `Your current active device is ${this.attributes['currentDevice']}`
      );
    }
  },
  ListFunctionsIntent: function() {
    const token = this.event.session.user.accessToken;

    if (token === undefined) {
      return emitAccountLinkResponse(this);
    }

    const deviceName = utils.normalizeDeviceName(
      this.event.request.intent.slots.device.value ||
        this.attributes['currentDevice']
    );

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
    }

    const slots = this.event.request.intent.slots;
    const deviceName = utils.normalizeDeviceName(
      slots.device.value || this.attributes['currentDevice']
    );
    const functionName = utils.normalizeFunctionName(slots.functionName.value);
    const functionArg = slots.argument ? slots.argument.value : '';

    particleApiUtils
      .callDeviceFunction(token, deviceName, functionName, functionArg)
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
      this.event.request.intent.slots.device.value ||
        this.attributes['currentDevice']
    );

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
    }

    const slots = this.event.request.intent.slots;
    const deviceName = utils.normalizeDeviceName(
      slots.device.value || this.attributes['currentDevice']
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
    const speechOutput = this.t('HELP_MESSAGE');
    const reprompt = this.t('HELP_MESSAGE');
    this.emit(':ask', speechOutput, reprompt);
  },
  'AMAZON.CancelIntent': function() {
    emitResponse(this.t('STOP_MESSAGE'));
  },
  'AMAZON.StopIntent': function() {
    emitResponse(this.t('STOP_MESSAGE'));
  }
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
