class Calculation {
    /**
     *
     * @param {moment} now
     * @param {object} event
     */
    constructor(now, event) {
        this.now = now
        this.event = event
    }

    /**
     *
     * @returns {number}
     */
    getValue() {
        const startTime = this.event.start.moment.valueOf()
        const endTime = this.event.end.moment.valueOf()
        this.now = this.now.valueOf()

        const startValue = this.event.start.value
        const endValue = this.event.end.value

        // return Math.round((((this.now - startTime) / (endTime - startTime)) * (endValue - startValue) + startValue) * 100) / 100;
        return Math.round(((this.now - startTime) / (endTime - startTime)) * (endValue - startValue) + startValue)
    }
}

module.exports = Calculation