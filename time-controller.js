/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2019 @koslo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
module.exports = function (RED) {
    const moment = require('moment');
    // const sunCalc = require('suncalc');
    const _ = require('lodash');

    function TimeControllerNode(config) {
        RED.nodes.createNode(this, config);
        let node = this;
        let interval = null;
        let status = {};

        function init() {
            let data = JSON.parse(config.data);
            data = _.sortBy(data, ['topic', 'start']);

            node.data = _.filter(data, event => {
                //for order
                status[event.topic] = 0;

                return !hasConfigError(event);
            });

            config.interval = config.interval || 1;
            config.usePreviousEventOnReload = (config.usePreviousEventOnReload + '').toLowerCase() === 'true';

            // for testing
            if (config.overideNow) {
                const now = createMoment(config.overideNow);
                if (moment.isMoment(now)) {
                    node.now = () => now;
                }
            }
        }

        //todo better solution?
        function hasConfigError(event) {
            let error = false;
            if (_.has(event, 'start')) {
                error |= hasEventTimeError(event, 'start');
                error |= hasEventValueError(event, 'start');
            } else {
                node.error("start is undefined");
                error = true;
            }
            if (_.has(event, 'end')) {
                error |= hasEventTimeError(event, 'end');
                error |= hasEventValueError(event, 'end');
            } else {
                node.error("end is undefined");
                error = true;
            }
            if (!_.has(event, 'topic')) {
                node.error("topic is undefined");
                error = true;
            }

            return error;
        }

        function hasEventTimeError(event, key) {
            if (_.has(event[key], 'time')) {
                const matches = new RegExp('(\\d+):(\\d+)', 'u').exec(event[key].time);
                if (!matches) {
                    node.error(key + " time should be a string of format hh:mm; given: " + event[key].time);
                    return true;
                }
            } else {
                node.error(key + " time is undefined");
                return true;
            }
            return false;
        }

        function hasEventValueError(event, key) {
            if (_.has(event[key], 'value')) {
                if (!_.isNumber(event[key].value)) {
                    node.error(key + " value is not a number; given: " + event[key].value);
                    return true;
                }
            } else {
                node.error(key + " value is undefined");
                return true;
            }

            return false;
        }

        function sendPreviousEvents() {
            const now = node.now();
            let previousEvent = {};

            //todo find a solution if it is in the early morning and we have to find the last event
            node.data.forEach(event => {
                event.end.moment = createMoment(event.end.time);
                if (event.end.moment && event.end.moment.isSameOrBefore(now)) {
                    _.set(previousEvent, event.topic, event);
                }
            });

            _.forEach(previousEvent, event => {
                node.send({
                    payload: event.end.value,
                    topic: event.topic
                });
                status[event.topic] = event.end.value;
            });

            setStatus();
        }

        function parseTime(time) {
            const matches = new RegExp('(\\d+):(\\d+)', 'u').exec(time);
            if (matches && matches.length) {
                return {
                    h: +matches[1],
                    m: +matches[2]
                };
            }
            return false;
        }

        function createMoment(time) {
            time = parseTime(time);
            if (time) {
                return moment()
                    .hour(time.h)
                    .minute(time.m)
                    .seconds(0)
                    .millisecond(0);
            }

            return null;
        }

        function calculateValue(now, event) {
            const startTime = event.start.moment.valueOf();
            const endTime = event.end.moment.valueOf();
            now = now.valueOf();

            const startValue = event.start.value;
            const endValue = event.end.value;

            // return Math.round((((now - startTime) / (endTime - startTime)) * (endValue - startValue) + startValue) * 100) / 100;
            return Math.round(((now - startTime) / (endTime - startTime)) * (endValue - startValue) + startValue);
        }

        function schedule(msg) {
            let now = node.now();
            if (msg && moment.isMoment(msg.payload)) {
                now = msg.payload;
            }
            now.seconds(0).millisecond(0);

            node.data.forEach(event => {
                //todo suncalc
                // const sunCalcTimes = sunCalc.getTimes(new Date(), config.lat, config.lon);
                //todo offset

                event.start.moment = createMoment(event.start.time);
                event.end.moment = createMoment(event.end.time);
                if (event.start.moment && event.end.moment && now.isBetween(event.start.moment, event.end.moment, null, '[]')) {
                    msg = {
                        payload: calculateValue(now, event),
                        topic: event.topic
                    };

                    node.send(msg);

                    status[msg.topic] = msg.payload;
                }
            });
            setStatus();
        }

        function setStatus() {
            node.status({
                fill: "green",
                shape: "dot",
                text: "running [" + _.values(status).join(", ") + "]"
            });
        }

        function run() {
            interval = setInterval(() => schedule(), config.interval * 1000);
        }

        function start() {
            stop();
            init();
            config.usePreviousEventOnReload && sendPreviousEvents();
            run();
        }

        function stop() {
            node.status({
                fill: "red",
                shape: "ring",
                text: "stopped"
            });
            clearInterval(interval);
            delete interval;
        }

        node.on('input', function (msg) {
            //todo config via payload?
            if (msg.payload === 'on') {
                start();
            } else if (msg.payload === 'off') {
                stop();
            } else {
                msg.payload = createMoment(msg.payload);
                if (moment.isMoment(msg.payload)) {
                    init();
                    stop();
                    schedule(msg);
                }
            }
        });

        node.on('close', function () {
            stop();
        });

        // to allow testing
        node.now = () => moment().seconds(0).millisecond(0);

        start();
    }

    RED.nodes.registerType("time-controller", TimeControllerNode);
}