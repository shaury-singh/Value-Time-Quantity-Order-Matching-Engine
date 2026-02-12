import {addOrderIntoDatabase, addMatchedOrderIntoDatabase} from "./database.js";

let sellBook = [];
let buyBook = [];

async function enqueueSellOrder(shareName, value, qty, time, currIdx){
    if (currIdx == sellBook.length-1){
        sellBook.push({shareName,value,time,qty});
        currIdx = sellBook.length - 1;
        await addOrderIntoDatabase("sell",value,qty,"JSW","Shaury Singh");
    }
    let parentIdx = Math.floor((currIdx-1)/2); 
    if (currIdx > 0){
        if (sellBook[currIdx].value < sellBook[parentIdx].value){
            let temp = sellBook[currIdx];
            sellBook[currIdx] = sellBook[parentIdx];
            sellBook[parentIdx] = temp;
            return enqueueSellOrder(shareName, value, qty, time, parentIdx);
        } else if (sellBook[currIdx].value == sellBook[parentIdx].value){
            if (sellBook[currIdx].time < sellBook[parentIdx].time){
                let temp = sellBook[currIdx];
                sellBook[currIdx] = sellBook[parentIdx];
                sellBook[parentIdx] = temp;
                return enqueueSellOrder(shareName, value, qty, time, parentIdx);
            }else if (sellBook[currIdx].time == sellBook[parentIdx].time && sellBook[currIdx].qty > sellBook[parentIdx].qty){
                let temp = sellBook[currIdx];
                sellBook[currIdx] = sellBook[parentIdx];
                sellBook[parentIdx] = temp;
                return enqueueSellOrder(shareName, value, qty, time, parentIdx);
            }
        }
    }
}

async function enqueueBuyOrder(shareName, value, qty, time, currIdx){
    if (currIdx == buyBook.length-1){
        buyBook.push({shareName,value,time,qty});
        currIdx = buyBook.length - 1;
        await addOrderIntoDatabase("buy",value,qty,"JSW","Vedant Ere");
    }
    let parentIdx = Math.floor((currIdx-1)/2); 
    if (currIdx > 0){
        if (buyBook[currIdx].value > buyBook[parentIdx].value){
            let temp = buyBook[currIdx];
            buyBook[currIdx] = buyBook[parentIdx];
            buyBook[parentIdx] = temp;
            return enqueueBuyOrder(shareName, value, qty, time, parentIdx);
        } else if (buyBook[currIdx].value == buyBook[parentIdx].value){
            if (buyBook[currIdx].time < buyBook[parentIdx].time){
                let temp = buyBook[currIdx];
                buyBook[currIdx] = buyBook[parentIdx];
                buyBook[parentIdx] = temp;
                return enqueueBuyOrder(shareName, value, qty, time, parentIdx);
            }else if (buyBook[currIdx].time == buyBook[parentIdx].time && buyBook[currIdx].qty > buyBook[parentIdx].qty){
                let temp = buyBook[currIdx];
                buyBook[currIdx] = buyBook[parentIdx];
                buyBook[parentIdx] = temp;
                return enqueueBuyOrder(shareName, value, qty, time, parentIdx);
            }
        }
    }
}

function hasSellPriority(orderA, orderB){
    if (sellBook[orderA].value < sellBook[orderB].value){
        return orderA;
    } else if (sellBook[orderA].value == sellBook[orderB].value){
        if (sellBook[orderA].time < sellBook[orderB].time){
            return orderA;
        }
        else if (sellBook[orderA].time > sellBook[orderB].time){
            return orderB;
        } else {
            if (sellBook[orderA].qty > sellBook[orderB].qty){
                return orderA;
            } else {
                return orderB;
            }
        }
    } else{
        return orderB;
    }
}

function hasBuyPriority(orderA, orderB){
    if (buyBook[orderA].value > buyBook[orderB].value){
        return orderA;
    } else if (buyBook[orderA].value == buyBook[orderB].value){
        if (buyBook[orderA].time < buyBook[orderB].time){
            return orderA;
        }
        else if (buyBook[orderA].time > buyBook[orderB].time){
            return orderB;
        } else {
            if (buyBook[orderA].qty > buyBook[orderB].qty){
                return orderA;
            } else {
                return orderB;
            }
        }
    } else{
        return orderB;
    }
}

function dequeuefromSellBook(){
    if (sellBook.length === 0) return null;
    let orderObj = sellBook[0];
    let lastElement = sellBook.pop();
    if (sellBook.length === 0) return orderObj;
    sellBook[0] = lastElement;
    let currIdx = 0; 
    while (currIdx < sellBook.length-1){
        let leftChildIdx = currIdx*2+1;
        let RightChildIdx = currIdx*2+2;
        let leftChildExists = leftChildIdx <= sellBook.length-1;
        let rightChildExists = RightChildIdx <= sellBook.length-1;
        if (leftChildExists && rightChildExists){
            let tempSwapIdx = hasSellPriority(leftChildIdx,RightChildIdx);
            let swapIdx = hasSellPriority(tempSwapIdx,currIdx);
            if (swapIdx == currIdx){
                break;
            }
            let temp = sellBook[currIdx];
            sellBook[currIdx] = sellBook[swapIdx];
            sellBook[swapIdx] = temp;
            currIdx = swapIdx;
        } else if (leftChildExists && rightChildExists == false){
            if (hasSellPriority(currIdx,leftChildIdx) == leftChildIdx){
                let temp = sellBook[currIdx];
                sellBook[currIdx] = sellBook[leftChildIdx];
                sellBook[leftChildIdx] = temp;
                break;
            }
            break;
        }
    }
    return orderObj;
}

function dequeuefromBuyBook(){
    if (buyBook.length === 0) return null;
    let orderObj = buyBook[0];
    let lastElement = buyBook.pop();
    if (buyBook.length === 0) return orderObj;
    buyBook[0] = lastElement;
    let currIdx = 0; 
    while (currIdx < buyBook.length-1){
        let leftChildIdx = currIdx*2+1;
        let RightChildIdx = currIdx*2+2;
        let leftChildExists = leftChildIdx <= buyBook.length-1;
        let rightChildExists = RightChildIdx <= buyBook.length-1;
        if (leftChildExists && rightChildExists){
            let tempSwapIdx = hasBuyPriority(leftChildIdx,RightChildIdx);
            let swapIdx = hasBuyPriority(tempSwapIdx,currIdx);
            if (swapIdx == currIdx){
                break;
            }
            let temp = buyBook[currIdx];
            buyBook[currIdx] = buyBook[swapIdx];
            buyBook[swapIdx] = temp;
            currIdx = swapIdx;
        } else if (leftChildExists && rightChildExists == false){
            if (hasBuyPriority(currIdx,leftChildIdx) == leftChildIdx){
                let temp = buyBook[currIdx];
                buyBook[currIdx] = buyBook[leftChildIdx];
                buyBook[leftChildIdx] = temp;
                break;
            }
            break;
        }
    }
    return orderObj;
}

async function matchOrders(){
    while (sellBook.length != 0 && buyBook.length != 0 && buyBook[0].value >= sellBook[0].value){
        let qty = sellBook[0].qty - buyBook[0].qty;
        if (qty > 0){
            await addMatchedOrderIntoDatabase(sellBook[0].value,Math.min(sellBook[0].qty,buyBook[0].qty),"JSW","Shaury Singh","Vedant Ere");
            let buyOrder = dequeuefromBuyBook(); 
            sellBook[0].qty = qty;
            console.log(`${JSON.stringify(sellBook[0])} matched to ${JSON.stringify(buyOrder)}`);
        } else if (qty == 0) {
            await addMatchedOrderIntoDatabase(sellBook[0].value,sellBook[0].qty,"JSW","Shaury Singh","Vedant Ere");
            let sellOrder = dequeuefromSellBook();
            let buyOrder = dequeuefromBuyBook(); 
            console.log(`${JSON.stringify(sellOrder)} matched to ${JSON.stringify(buyOrder)}`);
        } else {
            await addMatchedOrderIntoDatabase(sellBook[0].value,Math.min(sellBook[0].qty,buyBook[0].qty),"JSW","Shaury Singh","Vedant Ere");
            let sellOrder = dequeuefromSellBook();
            buyBook[0].qty = (qty*-1);
            console.log(`${JSON.stringify(sellOrder)} matched to ${JSON.stringify(buyBook[0])}`);
        }
    }
    console.log(`Current Market Value is: ${JSON.stringify(fetchCurrentMarketValue(150.23,200.48))}`);
}

function fetchCurrentMarketValue(upperCircuit, lowerCircuit){
    if (sellBook.length == 0){
        if (buyBook.length == 0){
            return {"value":lowerCircuit,"statusCode":1};
        }
        return {"value":upperCircuit,"statusCode":2};
    } else if (buyBook.length == 0 ){
        return {"value":lowerCircuit,"statusCode":4};
    } else if (sellBook[0].value <= buyBook[0].value){
        return {"value":sellBook[0].value,"statusCode":3};
    } else {
        return {"value":(sellBook[0].value + buyBook[0].value)/2,"statusCode":5};
    }
}

async function runEngine(){
    await enqueueSellOrder("JSW", 148.55, 5, Date.now(), sellBook.length-1);
    await enqueueSellOrder("JSW", 148.70, 3, Date.now(), sellBook.length-1);
    await enqueueBuyOrder("JSW", 148.35, 1, Date.now(), buyBook.length-1);
    await enqueueBuyOrder("JSW", 148.40, 3, Date.now(), buyBook.length-1);
    await enqueueSellOrder("JSW", 148.35, 10, Date.now(), sellBook.length-1);
    await enqueueSellOrder("JSW", 148.15, 13, Date.now(), sellBook.length-1);
    await enqueueBuyOrder("JSW", 148.38, 50, Date.now(), buyBook.length-1);
    await enqueueSellOrder("JSW", 148.85, 28, Date.now(), sellBook.length-1);
    await matchOrders();
    console.log("-------------sellBook---------------");
    console.log(sellBook);
    console.log("-------------buyBook----------------");
    console.log(buyBook);
}

runEngine();