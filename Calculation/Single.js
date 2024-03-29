const CalculationBase = require('./Base')

class CalculationSingle extends CalculationBase {
  /**
   *
   * @returns {number}
   */
  getData () {
    return this._getValue(
      this.event.start.moment.valueOf(),
      this.event.end.moment.valueOf(),
      this.event.start.value,
      this.event.end.value
    )
  }
}

module.exports = CalculationSingle
