# Time Controller

Time Controller is a node-red node for light controller (or other devices) that can fade the light or color channels in
a specified time range. It is possible to control each channel separately or in rgb mode. It calculates the values
depending on the start and end value and time.   
The input values can be an integer or an array. The range doesn't matter, so it is possible to use percentages or rgb
values or what ever you'd like.

## Configuration

### Data

At the moment Data is defined as an array of objects including the start time and value, the end time and value and the
topic. The values can be an integer or an array of integers. It doesn't matter whether they are percentages or color
values.    
See `example.json` for a full set of a RGBWW controller.

Each object has the following format:

     {
        "start": {
            "time": "06:00:10",
            "value": 0
        },
        "end": {
            "time": "solarNoon",
            "offset": 10,
            "value": 78
        },
        "topic": "rgbw/cmnd/channel1"
    },
    {
       "start": {
           "time": "06:00",
           "value": [80, 50, 10, 100, 100]
       },
       "end": {
           "time": "solarNoon",
           "offset": 10,
           "value": [500, 50, 10, 1, 255]
       },
       "topic": "light-entity"
    }

Example for the home-assistant call service node if the input is defined as array

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

Or:

    {
        "brightness_pct": "{{payload.0}}",
        "color_temp": "{{payload.1}}"
    }

Entity id:

    {{topic}}

---

| data object    | description                                                                      |
| -------------- | ---------------------------------------------------------------------------------|
| `start.time`   | start time, begin fading, `"hh:mm:ss" or "suncalc event"`                           |
| `start.offset` | start offset in minutes, `integer`                                               |
| `start.value`  | start value, `integer` or `array [red, green, blue, brigthness, ...]`      |
| `end.time`     | end time, stop fading, `"hh:mm:ss" or "suncalc event"`                              |
| `end.offset`   | end offset in minutes, `integer`                                                 |
| `end.value`    | end value, `integer` or `array [red, green, blue, brigthness, ...]`        |
| `topic`        | topic, e.q. a MQTT topic/ command like a channel or the light entity             |

### Interval

The interval in seconds to refresh the topics. Default: `1`

### Latitude and Longitude

The coordinates of the location to calculate the correct sun events.

### Use previous state of event on reload

If enabled then the Time Controller will emit the state of the previous event. Default: `false`

### Output type

If enabled then the input values must be in percentage and will be returned as color value (0 - 255).

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
| `"hh:mm:ss"`      | emit events at given time once without interval   |
| `"suncalc event"` | emit events at given time once without interval   | 

## Programmatic Control

todo

# Coming soon/ Todo

- fullcalendar to define the time events in the frontend
- programmatic control
- instant on/ off events
