const WebSocket = require('ws');
const fs = require('fs');

const ws = new WebSocket('wss://api-pub.bitfinex.com/ws/2');

const payload = {
    event: 'subscribe',
    channel: 'book',
    symbol: 'tBTCF0:USTF0',
    prec: 'P0',
    freq: 'F0',
    len: '1'
}

let bids
let asks
let symbol
let channelId;

let bookConstructed = false

ws.on('open', function open() {
    ws.send(JSON.stringify(payload))
});

let lastPayload

ws.on('message', function incoming(data) {
    var response = JSON.parse(data)
    if (response.event == "subscribed") {
        channelId = response.chanId
        symbol = response.symbol
    } else if (channelId && response[0] == channelId && response[1] !== "hb") {
        if (!bookConstructed) {
            constructBook(response)
            bookConstructed = true
        } else {
            let count = response[1][1]
            let amount = response[1][2]
            if (count > 0) {
                // Add / Update book entry
                if (amount > 0) {
                    // Update / add to bids
                    upsertBid(response[1], true)
                } else if (amount < 0) {
                    // Update / add to asks
                    upsertAsk(response[1], true)
                } else {
                    throw `Unexpected amount: ${amount} : ${JSON.stringify(response)}`
                }
            } else {
                // Remove entry from the book
                if (amount === 1) {
                    // Remove from bids
                    removeBid(response[1])
                } else if (amount === -1) {
                    // Update / add to asks
                    removeAsk(response[1])
                } else {
                    throw `Unexpected amount: ${amount} : ${JSON.stringify(response)}`
                }
            }
        }
    }
    lastPayload = response;
});

function constructBook(bookSnapshot) {
    bids = bookSnapshot[1].filter((x) => Math.sign(x[2]) == 1)
    asks = bookSnapshot[1].filter((x) => Math.sign(x[2]) == -1)
}

function removeBid(bid, draw = false) {
    bids = bids.filter((x) => x[0] !== bid[0])
    if (draw)
        drawBook()
}

function removeAsk(ask, draw = false) {
    asks = asks.filter((x) => x[0] !== ask[0])
    if (draw)
        drawBook()
}

function upsertBid(bid) {
    removeBid(bid)
    bids.push(bid)
    bids.sort((a, b) => {
        if (a == b) {
            return 0
        } else if (a < b) {
            return 1
        } else {
            return -1
        }
    })
    drawBook()
}

function upsertAsk(ask) {
    removeAsk(ask)
    asks.push(ask)
    asks.sort((a, b) => {
        if (a == b) {
            return 0
        } else if (a > b) {
            return 1
        } else {
            return -1
        }
    })
    drawBook()
}

let updateCount = 0
let sizeCheck = false
let midPrice = 0
function drawBook() {
    console.clear()
    updateCount++;

    sizeCheck = asks[0] <= bids[0]
    ask = parseFloat(asks[0])
    bid = parseFloat(bids[0])
    midPrice = (ask + bid)/2

//write current book state to file if asks <= bids
    {
    if(asks[0] <= bids[0]){
        fs.writeFile(`${Date.now()}_book.json`, `${bids[0]}, ${asks[0]}`, function (err) {
    if (err) throw err;
    });}}


    console.log(`Last payload: ${JSON.stringify(lastPayload)}`)
    console.log(`\n\n`)
    console.log(`Number of updates recieved: ${updateCount}`)
    console.log(`Number of bids: ${bids.length}`)
    console.log(`Number of asks: ${bids.length}`)
    console.log(`\n\n`)
    console.log(`Highest Bid: ${bids[0]}`)
    console.log(`Lowest Ask: ${asks[0]}`)
    console.log(`\n\n`)
    console.log(`Mid Price: ${midPrice}`)
    console.log(`\n\n`)
    console.log(`ORDER BOOK [${symbol}]:`)
    for (let i = 0; i < 1; i++) {
        let bid = bids[i];
        let ask = asks[i]

        let bookRow

        if (bid) {
            amount = bid[2].toString()
            spacer = `\t`
            if (amount.length < 8)
                spacer = `\t\t`
            bookRow = `${bid[1]}\t${bid[2]}${spacer}${bid[0]}`
        }

        if (bid && ask) {
            bookRow += `\t|   `
        }

        if (ask) {
            amount = ask[2].toString()
            spacer = `\t`
            if (amount.length <8)
                spacer = `\t\t`
            bookRow += `${ask[0]}\t${ask[2]}${spacer}${ask[1]}`
        }

        console.log(bookRow)
    }
}