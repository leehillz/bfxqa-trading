const WebSocket = require('ws');
const fs = require('fs');
const chai = require('chai');  

const ws = new WebSocket('wss://api-pub.bitfinex.com/ws/2');

        ws.onopen = function (event) {
            let payload = JSON.stringify({
                "event": "subscribe",
                "channel": "book",
                "symbol": "tBTCUSD",
                "prec": "P0",
                "freq": "F0",
                "len": 25
              })
            ws.send(payload); 
          };

          ws.onmessage = function (event) {
              let data = JSON.parse(event.data)
              
              // We ignore the info and subscribed payloads
              if(data.event !== 'info' && data.event !== 'subscribed'){
                    ws.close();

                    chai.expect(data).to.not.be.null

                    //Returns two items, Channel ID and data
                    chai.expect(data.length).to.eq(2)

                    //Price
                    chai.expect(data[1][0][0]).to.be.a('number')
                    chai.expect(data[1][0][0]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                    //Count
                    chai.expect(data[1][0][1]).to.be.a('number')
                    chai.expect(data[1][0][1]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                    //Amount
                    chai.expect(data[1][0][2]).to.be.a('number')
                    chai.expect(data[1][0][2]).to.match(/[0-9]+[.]{0,1}[0-9]*/)

                    console.log(JSON.stringify(data))


              }   
          }
