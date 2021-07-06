const CalculationBase = require('./Base')

class CalculationMultiple extends CalculationBase {
  /**
   *
   * @returns {array}
   */
  getData () {
    const startTime = this.event.start.moment.valueOf()
    const endTime = this.event.end.moment.valueOf()

    const values = []
    for (let i = 0; i < this.event.start.value.length; i++) {
      values.push(
        this._getValue(
          startTime,
          endTime,
          this.event.start.value[i],
          this.event.end.value[i]
        )
      )
    }

    return values
  }
}

module.exports = CalculationMultiple
