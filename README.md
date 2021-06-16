# Time Controller

Time Controller is a node-red plugin for RGBW Controller (or other devices) where all channels are managed separately. It is designed to fade in or fade out each channel in a specified time range. It calculates the percentage of each channel depending on the start and end value and time.

## Configuration

### Data

At the moment Data is defined as an array of objects including the start time and value, the end time and value and the topic. See `example.json` for a full set of a RGBWW controller.

Each object has the following format:   

     {
        "start": {
            "time": "06:00",
            "value": 0
        },
        "end": {
            "time": "solarNoon",
            "offset": 10,
            "value": 78
        },
        "topic": "rgbw/cmnd/channel1"
    }

If the rgb mode is enabled the format will be (experimental):

     {
        "start": {
            "time": "06:00",
            "value": [80, 50, 10, 100, 100]
        },
        "end": {
            "time": "solarNoon",
            "offset": 10,
            "value": [100, 50, 10, 1, 10]
        },
        "topic": "light-entity"
    }

Example for the home-assistant call service node   
   
Data:

    {
        "rgbw_color": [
            "{{payload.0}}",
            "{{payload.1}}",
            "{{payload.2}}",
            "{{payload.3}}"
        ],
        "brightness": "{{payload.4}}"
    }

Entity id:

    {{topic}}


---


| data object    | description                                                                      |
| -------------- | ---------------------------------------------------------------------------------|
| `start.time`   | start time, begin fading, `"hh:mm" or "suncalc event"`                           |
| `start.offset` | start offset in minutes, `integer`                                               |
| `start.value`  | start value in percent, `integer` or `array [red, green, blue, brigthness, ...]`      |
| `end.time`     | end time, stop fading, `"hh:mm" or "suncalc event"`                              |
| `end.offset`   | end offset in minutes, `integer`                                                 |
| `end.value`    | end value in percent, `integer` or `array [red, green, blue, brigthness, ...]`        |
| `topic`        | topic, e.q. a MQTT topic/ command like a channel or the light entity             |

### Interval

The interval in seconds to refresh the topics. Default: `1`   

### Latitude and Longitude

The coordinates of the location to calculate the correct sun events.

### Use previous state of event on reload

If this is checked, the Time Controller will emit the last state of events on reload. Default: `false`    

### Use rgb mode

Use [red, green, blue, brightness, ...] instead of a single value for one channel.

### output type

If true the output is returned in Percent else as integer (0-255).

### possible suncalc events

https://github.com/mourner/suncalc

| sunclac event    | datetime                 |
| ---------------- | ------------------------ |
| `nadir`          | 2020-04-13T01:14:05.769Z |
| `nightEnd`       | 2020-04-13T04:14:23.086Z |
| `nauticalDawn`   | 2020-04-13T05:02:54.596Z |
| `dawn`           | 2020-04-13T05:46:23.778Z |
| `sunrise`        | 2020-04-13T06:21:37.913Z |
| `sunriseEnd`     | 2020-04-13T06:25:11.302Z |
| `goldenHourEnd`  | 2020-04-13T07:06:30.077Z |
| `solarNoon`      | 2020-04-13T13:14:05.769Z |
| `goldenHour`     | 2020-04-13T19:21:41.462Z |
| `sunsetStart`    | 2020-04-13T20:03:00.236Z |
| `sunset`         | 2020-04-13T20:06:33.626Z |
| `dusk`           | 2020-04-13T20:41:47.761Z |
| `nauticalDusk`   | 2020-04-13T21:25:16.942Z |
| `night`          | 2020-04-13T22:13:48.453Z |

## Inputs

| msg.payload       | description                                       |
| ----------------- | ------------------------------------------------- |
| `"on"`            | start the timecontroller interval                 |
| `"off"`           | stop the timecontroller interval                  |
| `"hh:mm"`         | emit events at given time once without interval   |
| `"suncalc event"` | emit events at given time once without interval   | 

## Programmatic Control

todo


# Coming soon/ Todo

- tests for multi value mode
- ~~implement suncalc events with offset~~
- fullcalendar to define the time events in the frontend
- programmatic control
- instant on/ off events
