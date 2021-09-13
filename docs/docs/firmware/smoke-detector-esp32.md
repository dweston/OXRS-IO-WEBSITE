---
tags: ["OXRS-SHA-RACK32", "RACK32"]
---
# Smoke Detector ESP32
<p class="maker">by <b>Ben Jones</b></p>

> SKU: OXRS-BMD-SMOKEDETECTOR-ESP32-FW

## Introduction
Originally designed to work with [Clipsal FireTek Smoke Alarms](https://www.clipsal.com/products/detail?CatNo=755PSMA4) fitted with the [Clipsal Fire Tek Mounting/Relay Base](https://www.clipsal.com/products/detail?CatNo=755RB). 

A single CAT5/6 cable can be used to monitor the alarm state, as well as trigger the remote TEST/HUSH functions (i.e. 2x outputs, 1x input per port).

Each port on a Smoke Detector 16-port (SD16) can control 2 outputs and monitor 1 input and are numbered;

|INDEX|PORT|CHANNEL|TYPE  |RJ45 Pin|
|-----|----|-------|------|--------|
|1    |1   |1      |Output|2       |
|2    |1   |2      |Output|3       |
|3    |1   |3      |Input |6       |
|4    |2   |1      |Output|2       |
|5    |2   |2      |Output|3       |
|6    |2   |3      |Input |6       |
|...  |    |       |      |        |
|46   |16  |1      |Output|2       |
|47   |16  |2      |Output|3       |
|48   |16  |3      |Input |6       |

---

### How does it work?
When an input state change is detected an MQTT message is published to the configured MQTT broker for further processing by your home automation system. 

Outputs can be switched by publishing an MQTT message to the configured MQTT broker. Each output can be configured as a `relay`, for simple `on`/`off` control. A `motor`, again with `on`/`off` control but longer interlock delays if interlocking is configured. Or a `timer`, for `on` and then timed `off` control.

### Interlocking
Interlocking two outputs allows them to control equipment such as roller blinds, garage doors, louvre roofing etc.

However if you are planning to control a motor of any sort then it is important that the two outputs are configured as type `motor` and that both are interlocked with each other. This is to ensure that both outputs will not be commanded to operate at the same time and adds a 2 second delay between any changes of output.

Example payload to confingure outputs 4 & 5 to control a set of roller blinds;
``` json
[
  { "index": 4, "type": "motor", "lock": 5 },
  { "index": 5, "type": "motor", "lock": 4 }
]
```

The operation of the interlocked outputs should be verified before connecting to any external equipment. External interlocking equipment may be required for some equipment. Most importantly, the manufacturers wiring and installation guides must be adhered to.

### Timers
Timers allow an output to automatically turn `off` a set number of seconds after being turned `on` (configurable via `timerSeconds`, which defaults to 60 seconds).

If another `on` command is sent while the timer is running, it will reset to zero and being counting down again. If an `off` command is sent the timer will be cancelled and the output turned `off` immediately.

## Configuration
### Inputs
Each INPUT can be configured by publishing an MQTT message to this topic:
```
[PREFIX/]conf/CLIENTID[/SUFFIX]
```
where:
- `PREFIX`: Optional topic prefix if required
- `CLIENTID`: Client id of device, defaults to `osd-<MACADDRESS>`
- `SUFFIX`: Optional topic suffix if required
    
The message payload should be JSON and contain:
- `index`: Mandatory, the index of the input to configure
- `type`: Optional, either `button`, `contact`, `switch` or `toggle`
- `invert`: Optional, either `on` or `off`
    
A null or empty value will reset the configuration to:
- `type`: `switch`
- `invert`: `off` <Badge text="non-inverted"/>

### Outputs
Each OUTPUT can be configured by publishing an MQTT message to this topic:
```
[PREFIX/]conf/CLIENTID[/SUFFIX]
```
where:
- `PREFIX`: Optional topic prefix if required
- `CLIENTID`: Client id of device, defaults to `osd-<MACADDRESS>`
- `SUFFIX`: Optional topic suffix if required
    
The message payload should be JSON and contain:
- `index`: Mandatory, the index of the output to configure
- `type`: Optional, either `motor`, `relay`, or `timer`
- `interlockIndex`: Optional, index to interlock with (lock the opposite for interlocking both ways)
- `timerSeconds`: Optional, number of seconds an output stays `on` when type set to `timer`

A null or empty value will reset the configuration to:
- `type`: `relay`
- `interlockIndex`: unlocked (i.e. self-interlocked)
- `timerSeconds`: 60 seconds

### Examples
To configure input 3 to be a contact sensor:
``` json
{ 
  "index": 3, 
  "type": "contact" 
}
```

To configure input 7 to be an inverted button:
``` json
{ 
  "index": 6, 
  "type": "button", 
  "invert": "on" 
}
```

To configure output 4 to be a 60 second timer:
``` json
{ 
  "index": 4, 
  "type": "timer",
  "timerSeconds": 60
}
```

To configure output 7 to drive a motor:
``` json
{ 
  "index": 7, 
  "type": "motor"
}
```

A retained message will ensure the device auto-configures on startup.

**NOTE: inverting a normally-open (NO) button input will result in a constant stream of `hold` events!**

## Commands
### Outputs
Each OUTPUT can be controlled by publishing an MQTT message to the topic;
```
[PREFIX/]cmnd/CLIENTID[/SUFFIX]
```
where;
- `PREFIX`:   Optional topic prefix if required
- `CLIENTID`: Client id of device, defaults to `osc-<MACADDRESS>`
- `SUFFIX`:   Optional topic suffix if required

The message payload should be JSON and contain:
- `index`:    Mandatory, the index of the output to configure
- `command`:  Either `on`, `off`, or `query`

The `query` command will cause an event to be published, with the current state of that output.
    
### Examples
To turn on output 4:
``` json
{ 
  "index": 4, 
  "command": "on" 
}
```

To query the state of output 7:
``` json
{ 
  "index": 7, 
  "command": "query"
}
```


## Events
An input EVENT or output STATE CHANGE is reported to a topic of the form:
```
[PREFIX/]stat/CLIENTID[/SUFFIX]
```
where; 
- `PREFIX`:   Optional topic prefix if required
- `CLIENTID`: Client id of device, defaults to `osd-<MACADDRESS>`
- `SUFFIX`:   Optional topic suffix if required

The message payload is JSON and contains:
- `port`:     The port this event occured on (1-16)
- `channel`:  The channel this event occured on (1-3)
- `index`:    The index of this event (1-48)
- `type`:     The event type (see below)
- `event`:    The event (see below)

### Inputs
|Event Type|Possible Events|
|----------|---------------|
|`button`  | `single`, `double`, `triple`, `quad`, `penta`, or `hold` |
|`contact` | `open` or `closed` |
|`switch`  | `on` or `off` |
|`toggle`  | `toggle` |

### Outputs
|Event Type|Possible Events|
|----------|---------------|
|`motor`   | `on` or `off` |
|`relay`   | `on` or `off` |
|`timer`   | `on` or `off` |

### Examples
A contact opening on input 6;
```json
{ 
  "port": 2,
  "channel": 3,
  "index": 6, 
  "type": "contact", 
  "event": "open" 
}
```

A triple button click on input 3;
```json
{ 
  "port": 1, 
  "channel": 3, 
  "index": 3, 
  "type": "button", 
  "event": "triple" 
}
```

A relay turning on for output 7;
``` json
{
  "index": 7, 
  "type": "relay", 
  "event": "on"
}
```

A timer turning off for output 10;
``` json
{
  "index": 10, 
  "type": "timer", 
  "event": "off"
}
```

## Downloads
Download the latest version of the firmware on [Github](https://github.com/Bedrock-Media-Designs/OXRS-BMD-SmokeDetector-ESP32-FW).


## Supported Hardware
This firmware is compatible with the [Smoke Detector](https://bmdesigns.com.au/shop/universal-input-output-uio/) and is designed to run on the [Universal Rack Controller](https://www.superhouse.tv/product/rack32) (URC).

The SD16 hardware provides 12V down the line, which can be used for powering sensors (e.g. PIRs), or illuminating LEDs. 

There are 2 relays for each port which connect the OUTPUT wires in the cable to a shared CMN. 

A sensor or switch should pull the INPUT wire in the cable to GND to indicate that it has been activated. 

The SD16 hardware has physical pull up resistors to pull the INPUT wires high and detects when they are pulled low.

The RJ45 pinout for each port is;

|PIN|DESCRIPTION|
|---|-----------|
|1  |OUTPUT CMN |
|2  |OUTPUT 1   |
|3  |OUTPUT 2   |
|4  |VIN        |
|5  |VIN        |
|6  |INPUT 1    |
|7  |GND        |
|8  |GND        |

More information:

 * https://wiki.bmdesigns.com.au/en/BMD-urc-uio
 * http://www.superhouse.tv/rack32

#### Credits
 * James Kennewell <James@bmdesigns.com.au>
 * Ben Jones <https://github.com/sumnerboy12>


#### License
Copyright 2020-2021 Bedrock Media Designs Ltd [bmdesigns.com.au](https://bmdesigns.com.au/)

The software portion of this project is licensed under the Simplified
BSD License. The "licence" folder within this project contains a
copy of this license in plain text format.