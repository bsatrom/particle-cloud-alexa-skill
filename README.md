# particle-cloud-alexa-skill

Alexa Skill For accessing Particle devices via the Particle Device Cloud

## Skill Installation

1.  "Alexa, install Particle Cloud"
2.  Open the Alexa app on your phone or alexa.amazon.com to link the skill to your Particle account
3.  "Alexa, open Particle Cloud"

## V1 - Available Interactions (with sample utterances):

* Determine the number of online devices
  * "how many devices are online"
  * "how many of my devices are connected"
  * "number of online devices"
  * "number of connected devices"
* List devices
  * "list my particle devices"
  * "list my devices"
  * "list devices"
  * "device list"
  * "list connected devices"
  * "what are my devices"
  * "what are my connected devices"
* List functions for a device
  * "list functions"
  * "list functions for {device}"
  * "what functions does {device} have"
  * "my functions for {device}"
  * "cloud functions for {device}"
  * "what are my cloud functions for {device}"
* Set active device
  * "Set {device} as my current device"
  * "Set {device} active"
  * "Set my current device to {device}"
  * "Set active device to {device}"
  * "Set device to {device}"
* Get active device
  * "my active device"
  * "my current device"
  * "current device"
  * "what's my device"
  * "what's my active device"
  * "what is my active device"
  * "what's my current device"
* List cloud variables on device
  * "Variables for {device}"
  * "What variables do I have on my device"
  * "List variables for {device}"
  * "List variables"
* Get the value of a device variable **[Current Device Must Be Set Via "Set active device command"]**
  * "what's the value of variable {variable}"
  * "get variable named {variable}"
* Call cloud function on device **[Current Device Must Be Set Via "Set active device command"]**
  * "Run function {functionName}"
  * "Call function {functionName}"
  * "Execute function {functionName}"

## Features planned for v2 (Not yet available)

* Call cloud function on device **with argument**
* Set variables on a device
* Rename a device
* Suggest a device name
* Signal a device
