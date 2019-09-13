const moment = require('moment');
// const sunCalc = require('suncalc');
const _ = require('lodash');

class TimeController {
    constructor(node, config) {
        this.config = config;
        this.node = node;
        this.interval = null;
        this.status = {};

        this.setEvents();

        this.start();
    }

    init() {
        let data = JSON.parse(this.config.data);
        data = _.sortBy(data, ['topic', 'start']);

        this.node.data = _.filter(data, event => {
            //for order
            this.status[event.topic] = 0;

            return !this.hasConfigError(event);
        });

        this.config.interval = this.config.interval || 1;
        this.config.usePreviousEventOnReload = (this.config.usePreviousEventOnReload + '').toLowerCase() === 'true';

        // for testing
        if (this.config.overideNow) {
            const now = this.createMoment(this.config.overideNow);
            if (moment.isMoment(now)) {
                this.node.now = () => now;
            }
        }
    }
    //todo better solution?
    hasConfigError(event) {
        let error = false;
        if (_.has(event, 'start')) {
            error |= this.hasEventTimeError(event, 'start');
            error |= this.hasEventValueError(event, 'start');
        } else {
            this.node.error("start is undefined");
            error = true;
        }
        if (_.has(event, 'end')) {
            error |= this.hasEventTimeError(event, 'end');
            error |= this.hasEventValueError(event, 'end');
        } else {
            this.node.error("end is undefined");
            error = true;
        }
        if (!_.has(event, 'topic')) {
            this.node.error("topic is undefined");
            error = true;
        }

        return error;
    }

    hasEventTimeError(event, key) {
        if (_.has(event[key], 'time')) {
            const matches = new RegExp('(\\d+):(\\d+)', 'u').exec(event[key].time);
            if (!matches) {
                this.node.error(key + " time should be a string of format hh:mm; given: " + event[key].time);
                return true;
            }
        } else {
            this.node.error(key + " time is undefined");
            return true;
        }
        return false;
    }

    hasEventValueError(event, key) {
        if (_.has(event[key], 'value')) {
            if (!_.isNumber(event[key].value)) {
                this.node.error(key + " value is not a number; given: " + event[key].value);
                return true;
            }
        } else {
            this.node.error(key + " value is undefined");
            return true;
        }

        return false;
    }

    sendPreviousEvents() {
        const now = this.node.now();
        let previousEvent = {};

        //todo find a solution if it is in the early morning and we have to find the last event
        this.node.data.forEach(event => {
            event.end.moment = this.createMoment(event.end.time);
            if (event.end.moment && event.end.moment.isSameOrBefore(now)) {
                _.set(previousEvent, event.topic, event);
            }
        });

        _.forEach(previousEvent, event => {
            this.node.send({
                payload: event.end.value,
                topic: event.topic
            });
            this.status[event.topic] = event.end.value;
        });

        this.setStatus();
    }

    parseTime(time) {
        const matches = new RegExp('(\\d+):(\\d+)', 'u').exec(time);
        if (matches && matches.length) {
            return {
                h: +matches[1],
                m: +matches[2]
            };
        }
        return false;
    }

    createMoment(time) {
        time = this.parseTime(time);
        if (time) {
            return moment()
                .hour(time.h)
                .minute(time.m)
                .seconds(0)
                .millisecond(0);
        }

        return null;
    }

    calculateValue(now, event) {
        const startTime = event.start.moment.valueOf();
        const endTime = event.end.moment.valueOf();
        now = now.valueOf();

        const startValue = event.start.value;
        const endValue = event.end.value;

        // return Math.round((((now - startTime) / (endTime - startTime)) * (endValue - startValue) + startValue) * 100) / 100;
        return Math.round(((now - startTime) / (endTime - startTime)) * (endValue - startValue) + startValue);
    }

    schedule(msg) {
        let now = this.node.now();
        if (msg && moment.isMoment(msg.payload)) {
            now = msg.payload;
        }
        now.seconds(0).millisecond(0);

        this.node.data.forEach(event => {
            //todo suncalc
            // const sunCalcTimes = sunCalc.getTimes(new Date(), config.lat, config.lon);
            //todo offset

            event.start.moment = this.createMoment(event.start.time);
            event.end.moment = this.createMoment(event.end.time);
            if (event.start.moment && event.end.moment && now.isBetween(event.start.moment, event.end.moment, null, '[]')) {
                msg = {
                    payload: this.calculateValue(now, event),
                    topic: event.topic
                };

                this.node.send(msg);

                this.status[msg.topic] = msg.payload;
            }
        });
        this.setStatus();
    }

    setStatus() {
        this.node.status({
            fill: "green",
            shape: "dot",
            text: "running [" + _.values(this.status).join(", ") + "]"
        });
    }

    run() {
        this.interval = setInterval(() => this.schedule(), this.config.interval * 1000);
    }

    start() {
        this.stop();
        this.init();
        this.config.usePreviousEventOnReload && this.sendPreviousEvents();
        this.run();
    }

    stop() {
        this.node.status({
            fill: "red",
            shape: "ring",
            text: "stopped"
        });
        clearInterval(this.interval);
        delete this.interval;
    }

    setEvents() {
        this.node.on('input', (msg) => {
            //todo config via payload?
            if (msg.payload === 'on') {
                this.start();
            } else if (msg.payload === 'off') {
                this.stop();
            } else {
                msg.payload = this.createMoment(msg.payload);
                if (moment.isMoment(msg.payload)) {
                    this.init();
                    this.stop();
                    this.schedule(msg);
                }
            }
        });

        this.node.on('close', () => {
            this.stop();
        });

        // to allow testing
        this.node.now = () => moment().seconds(0).millisecond(0);
    }
}

module.exports = TimeController;