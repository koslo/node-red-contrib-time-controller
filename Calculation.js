class Calculation {
  /**
   *
   * @param {moment} now
   * @param {object} event
   */
  constructor (now, event) {
    this.now = now
    this.event = event
  }

  /**
   *
   * @param {boolean} outputAsRgbValue
   *
   * @returns {number}
   */
  getValue (outputAsRgbValue = false) {
    const startTime = this.event.start.moment.valueOf()
    const endTime = this.event.end.moment.valueOf()

    return this._getValue(
      startTime,
      endTime,
      this.event.start.value,
      this.event.end.value,
      outputAsRgbValue
    )
  }

  /**
   *
   * @param {boolean} outputAsRgbValue
   *
   * @returns {array}
   */
  getValues (outputAsRgbValue = false) {
    const startTime = this.event.start.moment.valueOf()
    const endTime = this.event.end.moment.valueOf()

    const values = []
    for (let i = 0; i < this.event.start.value.length; i++) {
      values.push(
        this._getValue(
          startTime,
          endTime,
          this.event.start.value[i],
          this.event.end.value[i],
          outputAsRgbValue
        )
      )
    }

    return values
  }

  /**
   *
   * @param {int} startTime
   * @param {int} endTime
   * @param {int} startValue
   * @param {int} endValue
   * @param {boolean} outputAsRgbValue
   *
   * @returns {number}
   */
  _getValue (startTime, endTime, startValue, endValue, outputAsRgbValue = false) {
    let value = Math.round(((this.now.valueOf() - startTime) / (endTime - startTime)) * (endValue - startValue) + startValue)

    // TODO throw exception
    if (isNaN(value)) {
      value = 0
    }

    if (outputAsRgbValue) {
      value = parseInt(value * 2.55)
    }

    return value
  }
}

module.exports = Calculation
