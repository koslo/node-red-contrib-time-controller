# Time Controller

Time Controller is a node-red plugin for RGBW Controller (or other devices) where all channels are managed separatly. It is designed to fade in or fade out each channel in a specified time range. It calculates the percentage of each channel depending on the start and end value and time.

## Configuration

### Data

At the moment Data is defined as an array of objects including the start time and value, the end time and value and the topic. See `exapmle.json` for a full set of a RGBWW controller.

Each object has the following format:   

     {
        "start": {
            "time": "06:00",
            "value": 0
        },
        "end": {
            "time": "06:30",
            "value": 100
        },
        "topic": "rgbw/cmnd/channel1"
    }

| data object   | description                                      |
| ------------- | ---------------------------------------          |
| `start.time`  | start time, begin fading, `"hh:mm"`              |
| `start.value` | start value, `integer`                           |
| `end.time`    | end time, stop fading, `"hh:mm"`                 |
| `end.value`   | end value, `integer`                             |
| `topic`       | topic, e.q. a MQTT topic/ command like a channel |

### Interval

The interval in seconds to refresh the topics. Default: `1`   

### Latitude and Longitude (unused atm)

The coordinates of the location to calculate the correct sun events.

### Use previous state of event on reload

If this is checked, the Time Controller will emit the last state of events on reload. Default: `false`    


## Inputs

| msg.payload | description                                               |
| ----------- | --------------------------------------------------------- |
| `"on"`        | start the timecontroller interval                       |
| `"off"`       | stop the timecontroller interval                        |
| `"hh:mm"`   | emit events at given time once without interval           | 

## Programmatic Control

todo


# Coming soon

- implement suncalc events with offset
- fullcalendar to define the time events in the frontend
- programmatic control
- instant on/ off events
