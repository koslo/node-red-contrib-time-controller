const moment = require('moment')
const sunCalc = require('suncalc')
const _ = require('lodash')
const Calculation = require('./Calculation')

class TimeController {
    constructor(node, config) {
        /**
         * instance of node
         */
        this.node = node

        /**
         * @see https://github.com/mourner/suncalc
         *
         * possible sun events with datetime
         *
         * solarNoon: "2020-04-01T11:17:29.057Z"
         * nadir: "2020-03-31T23:17:29.057Z"
         * sunrise: "2020-04-01T04:48:24.935Z"
         * sunset: "2020-04-01T17:46:33.179Z"
         * sunriseEnd: "2020-04-01T04:51:52.625Z"
         * sunsetStart: "2020-04-01T17:43:05.489Z"
         * dawn: "2020-04-01T04:14:27.174Z"
         * dusk: "2020-04-01T18:20:30.940Z"
         * nauticalDawn: "2020-04-01T03:33:31.078Z"
         * nauticalDusk: "2020-04-01T19:01:27.036Z"
         * nightEnd: "2020-04-01T02:49:39.065Z"
         * night: "2020-04-01T19:45:19.048Z"
         * goldenHourEnd: "2020-04-01T05:32:29.758Z"
         * goldenHour: "2020-04-01T17:02:28.356Z"
         */
        this.sunCalcTimes = {
            solarNoon    : null,
            nadir        : null,
            sunrise      : null,
            sunset       : null,
            sunriseEnd   : null,
            sunsetStart  : null,
            dawn         : null,
            dusk         : null,
            nauticalDawn : null,
            nauticalDusk : null,
            nightEnd     : null,
            night        : null,
            goldenHourEnd: null,
            goldenHour   : null,
        }

        /**
         * time config
         */
        this.config = config

        /**
         * interval to check events
         */
        this.interval = null

        /**
         * node status
         */
        this.status = {}

        this.setEvents()
    }

    init() {
        let data = JSON.parse(this.config.data)
        data = _.sortBy(data, ['topic', 'start'])

        this.node.data = _.filter(data, event => {
            //for order
            this.status[event.topic] = 0

            return !this.hasConfigError(event)
        })

        this.config.interval = this.config.interval || 1
        this.config.usePreviousEventOnReload = (this.config.usePreviousEventOnReload + '').toLowerCase() === 'true'
        this.config.useRGB = (this.config.useRGB + '').toLowerCase() === 'true'

        // for testing
        if (this.config.overrideNow) {
            const now = this.createMoment(this.config.overrideNow)
            if (moment.isMoment(now)) {
                this.node.now = () => now
            }
        }
    }

    //todo better solution?
    //todo check offset?
    //todo lat, lng mandatory for suncalc?
    //todo check if suncalc event is valid date (e.q. in summer there is no night in some areas. - "Invalid Date" )
    hasConfigError(event) {
        let error = false
        if (_.has(event, 'start')) {
            error |= this.hasEventTimeError(event, 'start')
            error |= this.hasEventValueError(event, 'start')
        } else {
            this.node.error('start is undefined')
            error = true
        }
        if (_.has(event, 'end')) {
            error |= this.hasEventTimeError(event, 'end')
            error |= this.hasEventValueError(event, 'end')
        } else {
            this.node.error('end is undefined')
            error = true
        }
        if (!_.has(event, 'topic')) {
            this.node.error('topic is undefined')
            error = true
        }

        return error
    }

    hasEventTimeError(event, key) {
        if (_.has(event[key], 'time')) {
            if (!(new RegExp('(\\d+):(\\d+)', 'u').exec(event[key].time)) && !_.has(this.sunCalcTimes, event[key].time)) {
                this.node.error(key + ' time should be a string of format hh:mm or a sun event; given: ' + event[key].time)
                return true
            }
        } else {
            this.node.error(key + ' time is undefined')
            return true
        }
        return false
    }

    hasEventValueError(event, key) {
        if (_.has(event[key], 'value')) {
            if (!this.config.useRGB && !_.isNumber(event[key].value)) {
                this.node.error(key + ' value is not a number; given: ' + event[key].value)
                return true
            } else if (this.config.useRGB && !_.isArray(event[key].value)){
                this.node.error(key + ' value is not a array; given: ' + event[key].value)
                return true
            }
        } else {
            this.node.error(key + ' value is undefined')
            return true
        }

        return false
    }

    sendPreviousEvents() {
        const now = this.node.now()
        let previousEvent = {}

        //todo find a solution if it is in the early morning and we have to find the last event
        this.node.data.forEach(event => {
            event.end.moment = this.createMoment(event.end.time)
            if (event.end.moment && event.end.moment.isSameOrBefore(now)) {
                previousEvent[event.topic] = event
            }
        })

        _.forEach(previousEvent, event => {
            this.node.send({
                payload: event.end.value,
                topic  : event.topic,
            })
            this.status[event.topic] = event.end.value
        })

        this.setStatus()
    }

    /**
     *
     * @param {string} time format 'hh:mm'
     */
    parseTime(time) {
        const matches = new RegExp('(\\d+):(\\d+)', 'u').exec(time)
        if (matches && matches.length) {
            return {
                h: +matches[1],
                m: +matches[2],
            }
        }
        return false
    }

    /**
     *
     * @param {string} time format 'hh:mm' or sunlight times (@see sunCalcTimes)
     * @param {int} offset in minutes
     * @return {moment}
     */
    createMoment(time, offset = 0) {
        if (_.has(this.sunCalcTimes, time)) {
            return moment(this.sunCalcTimes[time]).
                add(offset, 'm').
                seconds(0).
                millisecond(0)
        } else {
            time = this.parseTime(time)
            if (time) {
                return moment().
                    hour(time.h).
                    minute(time.m + offset).
                    seconds(0).
                    millisecond(0)
            }
        }

        return null
    }

    schedule(msg) {
        let now = this.node.now()
        if (msg && moment.isMoment(msg.payload)) {
            now = msg.payload
        }
        now.seconds(0).millisecond(0)

        this.sunCalcTimes = sunCalc.getTimes(now, this.config.lat, this.config.lng)

        this.node.data.forEach(event => {
            event.start.moment = this.createMoment(event.start.time, _.get(event.start, 'offset', 0))
            event.end.moment = this.createMoment(event.end.time, _.get(event.end, 'offset', 0))
            if (event.start.moment && event.end.moment && now.isBetween(event.start.moment, event.end.moment, null, '[]')) {
                msg = {
                    payload: (new Calculation(this.config, now, event)).getValue(),
                    topic  : event.topic,
                }

                this.node.send(msg)

                this.status[msg.topic] = msg.payload
            }
        })
        this.setStatus()
    }

    setStatus() {
        this.node.status({
            fill : 'green',
            shape: 'dot',
            text : 'running [' + _.values(this.status).join(', ') + ']',
        })
    }

    run() {
        this.interval = setInterval(
            () => this.schedule(),
            this.config.interval * 1000,
        )
    }

    start() {
        this.stop()
        this.init()
        this.config.usePreviousEventOnReload && this.sendPreviousEvents()
        this.run()
    }

    stop() {
        this.node.status({
            fill : 'red',
            shape: 'ring',
            text : 'stopped',
        })
        clearInterval(this.interval)
        delete this.interval
    }

    setEvents() {
        this.node.on('input', (msg) => {
            //todo config via payload?
            if (msg.payload === 'on') {
                this.start()
            } else if (msg.payload === 'off') {
                this.stop()
            } else {
                msg.payload = this.createMoment(msg.payload)
                if (moment.isMoment(msg.payload)) {
                    this.init()
                    this.stop()
                    this.schedule(msg)
                }
            }
        })

        this.node.on('close', () => {
            this.stop()
        })

        // to allow testing
        this.node.now = () => moment().seconds(0).millisecond(0)
    }
}

module.exports = TimeController
