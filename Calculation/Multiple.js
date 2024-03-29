const CalculationBase = require('./Base')

class CalculationMultiple extends CalculationBase {
  /**
   *
   * @returns {array}
   */
  getData () {
    const values = []
    for (let i = 0; i < this.event.start.value.length; i++) {
      values.push(
        this._getValue(
          this.event.start.moment.valueOf(),
          this.event.end.moment.valueOf(),
          this.event.start.value[i],
          this.event.end.value[i]
        )
      )
    }

    return values
  }
}

module.exports = CalculationMultiple
