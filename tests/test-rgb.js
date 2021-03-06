/* eslint-disable max-lines,max-lines-per-function */
/* eslint-env mocha */

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

// todo suncalc events in example.json

const { assert } = require('chai')
const data = require('../examples/example-rgb.json')
const _ = require('lodash')
const mock = require('node-red-contrib-mock-node')
const nodeRedModule = require('../index.js')
const LAT = 51.51
const LNG = 1.86

let activeNode

/**
 *
 * @param {object} configOverrides
 * @returns {nodeRedModule}
 */
function newNode (configOverrides) {
  const config = {
    name: 'test-node',
    interval: 1,
    data: JSON.stringify(data),
    lat: LAT,
    lng: LNG,
  }
  if (configOverrides) {
    _.assign(config, configOverrides)
  }

  return mock(nodeRedModule, config)
}

/**
 *
 * @param {string} payload
 * @param {object|null} overrides
 * @returns {nodeRedModule}
 */
function createNodeAndEmit (payload, overrides = null) {
  const node = newNode(overrides)
  node.emit('input', {
    payload: payload
  })

  activeNode = node

  return node
}

describe('time-controller', () => {
  afterEach(() => {
    activeNode && activeNode.emit('close') && (activeNode = null)
  })

  it('should be on [67,37,34,34,100] at 06:00:30', () => {
    const node = createNodeAndEmit('06:00:30')

    assert.equal(node.status().text, 'running [67,37,34,34,100]')
    assert.equal(node.sent(0).topic, 'light.office_aq_rgbw')
    assert.deepEqual(node.sent(0).payload, [67, 37, 34, 34, 100])
  })

  it('should be on [100,55,50,50,100] at 06:30', () => {
    const node = createNodeAndEmit('06:30')

    assert.equal(node.status().text, 'running [100,55,50,50,100]')
    assert.equal(node.sent(0).topic, 'light.office_aq_rgbw')
    assert.deepEqual(node.sent(0).payload, [100, 55, 50, 50, 100])
  })

  it('should be on [51,56,62,67,73] at 20:30', () => {
    const node = createNodeAndEmit('20:30')

    assert.equal(node.status().text, 'running [51,56,62,67,73]')
    assert.equal(node.sent(0).topic, 'light.office_aq_rgbw')
    assert.deepEqual(node.sent(0).payload, [51, 56, 62, 67, 73])
  })

  it('should be on [130,142,158,170,186] at 20:30', () => {
    const node = createNodeAndEmit('20:30', { outputAsRgbValue: 'true' })

    assert.equal(node.status().text, 'running [130,142,158,170,186]')
    assert.equal(node.sent(0).topic, 'light.office_aq_rgbw')
    assert.deepEqual(node.sent(0).payload, [130, 142, 158, 170, 186])
  })

  it('should be on [100, 55, 50, 50, 100] at 12:00', () => {
    activeNode = newNode({
      outputAsRgbValue: 'true',
      usePreviousEventOnReload: 'true',
      overrideNow: '12:00'
    })

    assert.equal(activeNode.status().text, 'running [100,55,50,50,100]')
    assert.equal(activeNode.sent(0).topic, 'light.office_aq_rgbw')
    assert.deepEqual(activeNode.sent(0).payload, [100, 55, 50, 50, 100])
  })
})
