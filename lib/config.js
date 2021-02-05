'use strict'

const M_FEE = 0.001
const T_FEE = 0.001

module.exports = {
  M_FEE,
  T_FEE,
  M_FEE_M: 1 - M_FEE,
  T_FEE_M: 1 - T_FEE,
  DUST: { // TODO: revise, min deltas for balance equality
    BTC: 0.001,
    IOT: 0.001,
    ETH: 0.001,
    USD: 0.001,
    JPY: 0.001,
    BAT: 0.001,
    ETP: 0.001,
    AVT: 0.001,
    QTM: 0.001
  }
}
