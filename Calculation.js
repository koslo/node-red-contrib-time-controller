class Calculation {
    /**
     *
     * @param {object} config
     * @param {moment} now
     * @param {object} event
     */
    constructor(config, now, event) {
        this.config = config
        this.now = now
        this.event = event
    }

    /**
     *
     * @returns {number|array}
     */
    getValue() {
        const startTime = this.event.start.moment.valueOf()
        const endTime = this.event.end.moment.valueOf()

        if(this.config.useRGB){
            let values = [];
            for(let i =  0; i < this.event.start.value.length; i++){
                values.push(this._getValue(startTime, endTime, this.event.start.value[i], this.event.end.value[i]));
            }
            return values
        } else {
            return this._getValue(startTime, endTime, this.event.start.value, this.event.end.value)
        }
    }

    /**
     *
     * @param {int} startTime
     * @param {int} endTime
     * @param {int} startValue
     * @param {int} endValue
     *
     * @returns {number}
     */
    _getValue(startTime, endTime, startValue, endValue) {
        // return Math.round((((this.now.valueOf() - startTime) / (endTime - startTime)) * (endValue - startValue) + startValue) * 100) / 100;
        return Math.round(((this.now.valueOf() - startTime) / (endTime - startTime)) * (endValue - startValue) + startValue)
    }
}

module.exports = Calculation
