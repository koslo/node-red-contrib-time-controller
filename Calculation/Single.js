const CalculationBase = require('./Base')

class CalculationSingle extends CalculationBase {
  /**
   *
   * @returns {number}
   */
  getData () {
    const startTime = this.event.start.moment.valueOf()
    const endTime = this.event.end.moment.valueOf()

    return this._getValue(
      startTime,
      endTime,
      this.event.start.value,
      this.event.end.value
    )
  }
}

module.exports = CalculationSingle
