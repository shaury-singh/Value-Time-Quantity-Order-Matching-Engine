import {addOrderIntoDatabase, addMatchedOrderIntoDatabase} from "./database.js";

export default class Engine {
    constructor() {
        this.sellBook = [];
        this.buyBook = [];
        this.dbOrderQueue = [];
        this.dbMatchedQueue = [];
        this.startDBMatchedOrderWorker();
        this.startDBPlaceOrderWorker();
        this.orderHash = {};
    }

    initializeShare(shareIndex) {
        if (!this.sellBook[shareIndex]) this.sellBook[shareIndex] = [];
        if (!this.buyBook[shareIndex]) this.buyBook[shareIndex] = [];
    }

    enqueueSellOrder(shareName, value, qty, time, currIdx, orderID, shareIndex) {
        this.initializeShare(shareIndex);
        if (currIdx === this.sellBook[shareIndex].length - 1) {
            this.sellBook[shareIndex].push({ shareName, value, time, qty, orderID});
            currIdx = this.sellBook[shareIndex].length - 1;
            this.orderHash[orderID] = {"shareIndex":shareIndex,"orderIndex":currIdx};
            this.dbOrderQueue.push({"type":"sell","value":value,"qty":qty,"shareName":shareName,"shareIndex":shareIndex,"userID":"Shaury Singh"});
            // await addOrderIntoDatabase("sell", value, qty, shareName, "Shaury Singh");
        }
        let parentIdx = Math.floor((currIdx - 1) / 2);
        if (currIdx > 0) {
            if (this.sellBook[shareIndex][currIdx].value < this.sellBook[shareIndex][parentIdx].value) {
                let parentOrderID = this.sellBook[shareIndex][parentIdx].orderID;
                let temp = this.sellBook[shareIndex][currIdx];
                this.sellBook[shareIndex][currIdx] = this.sellBook[shareIndex][parentIdx];
                this.sellBook[shareIndex][parentIdx] = temp;
                this.orderHash[orderID]["orderIndex"] = parentIdx;
                this.orderHash[parentOrderID]["orderIndex"] = currIdx; 
                return this.enqueueSellOrder(shareName, value, qty, time, parentIdx, orderID, shareIndex);
            } else if (this.sellBook[shareIndex][currIdx].value === this.sellBook[shareIndex][parentIdx].value) {
                if (this.sellBook[shareIndex][currIdx].time < this.sellBook[shareIndex][parentIdx].time) {
                    let parentOrderID = this.sellBook[shareIndex][parentIdx].orderID;
                    let temp = this.sellBook[shareIndex][currIdx];
                    this.sellBook[shareIndex][currIdx] = this.sellBook[shareIndex][parentIdx];
                    this.sellBook[shareIndex][parentIdx] = temp;
                    this.orderHash[orderID]["orderIndex"] = parentIdx;
                    this.orderHash[parentOrderID]["orderIndex"] = currIdx; 
                    return this.enqueueSellOrder(shareName, value, qty, time, parentIdx, orderID, shareIndex);
                } else if (this.sellBook[shareIndex][currIdx].time === this.sellBook[shareIndex][parentIdx].time && this.sellBook[shareIndex][currIdx].qty > this.sellBook[shareIndex][parentIdx].qty) {
                    let parentOrderID = this.sellBook[shareIndex][parentIdx].orderID;
                    let temp = this.sellBook[shareIndex][currIdx];
                    this.sellBook[shareIndex][currIdx] = this.sellBook[shareIndex][parentIdx];
                    this.sellBook[shareIndex][parentIdx] = temp;
                    this.orderHash[orderID]["orderIndex"] = parentIdx;
                    this.orderHash[parentOrderID]["orderIndex"] = currIdx; 
                    return this.enqueueSellOrder(shareName, value, qty, time, parentIdx, orderID, shareIndex);
                }
            }
        }
    }

    enqueueBuyOrder(shareName, value, qty, time, currIdx, orderID, shareIndex) {
        this.initializeShare(shareIndex);
        if (currIdx === this.buyBook[shareIndex].length - 1) {
            this.buyBook[shareIndex].push({ shareName, value, time, qty, orderID });
            currIdx = this.buyBook[shareIndex].length - 1;
            this.orderHash[orderID] = {"shareIndex":shareIndex,"orderIndex":currIdx};
            this.dbOrderQueue.push({"type":"buy","value":value,"qty":qty,"shareName":shareName,"shareIndex":shareIndex,"userID":"Shaury Singh"});
            // await addOrderIntoDatabase("buy", value, qty, shareName, "Vedant Ere");
        }
        let parentIdx = Math.floor((currIdx - 1) / 2);
        if (currIdx > 0) {
            if (this.buyBook[shareIndex][currIdx].value > this.buyBook[shareIndex][parentIdx].value) {
                let parentOrderID = this.buyBook[shareIndex][parentIdx].orderID;
                let temp = this.buyBook[shareIndex][currIdx];
                this.buyBook[shareIndex][currIdx] = this.buyBook[shareIndex][parentIdx];
                this.buyBook[shareIndex][parentIdx] = temp;
                this.orderHash[orderID]["orderIndex"] = parentIdx;
                this.orderHash[parentOrderID]["orderIndex"] = currIdx;
                return this.enqueueBuyOrder(shareName, value, qty, time, parentIdx, orderID, shareIndex);
            } else if (this.buyBook[shareIndex][currIdx].value === this.buyBook[shareIndex][parentIdx].value) {
                if (this.buyBook[shareIndex][currIdx].time < this.buyBook[shareIndex][parentIdx].time) {
                    let parentOrderID = this.buyBook[shareIndex][parentIdx].orderID;
                    let temp = this.buyBook[shareIndex][currIdx];
                    this.buyBook[shareIndex][currIdx] = this.buyBook[shareIndex][parentIdx];
                    this.buyBook[shareIndex][parentIdx] = temp;
                    this.orderHash[orderID]["orderIndex"] = parentIdx;
                    this.orderHash[parentOrderID]["orderIndex"] = currIdx;
                    return this.enqueueBuyOrder(shareName, value, qty, time, parentIdx, orderID, shareIndex);
                } else if (this.buyBook[shareIndex][currIdx].time === this.buyBook[shareIndex][parentIdx].time && this.buyBook[shareIndex][currIdx].qty > this.buyBook[shareIndex][parentIdx].qty
                ) {
                    let parentOrderID = this.buyBook[shareIndex][parentIdx].orderID;
                    let temp = this.buyBook[shareIndex][currIdx];
                    this.buyBook[shareIndex][currIdx] = this.buyBook[shareIndex][parentIdx];
                    this.buyBook[shareIndex][parentIdx] = temp;
                    this.orderHash[orderID]["orderIndex"] = parentIdx;
                    this.orderHash[parentOrderID]["orderIndex"] = currIdx;
                    return this.enqueueBuyOrder(shareName, value, qty, time, parentIdx, orderID, shareIndex);
                }
            }
        }
    }

    hasSellPriority(shareIndex, orderA, orderB) {
        if (this.sellBook[shareIndex][orderA].value < this.sellBook[shareIndex][orderB].value) {
            return orderA;
        } else if (this.sellBook[shareIndex][orderA].value === this.sellBook[shareIndex][orderB].value) {
            if (this.sellBook[shareIndex][orderA].time < this.sellBook[shareIndex][orderB].time) {
                return orderA;
            } else if (this.sellBook[shareIndex][orderA].time > this.sellBook[shareIndex][orderB].time) {
                return orderB;
            } else {
                if (this.sellBook[shareIndex][orderA].qty > this.sellBook[shareIndex][orderB].qty) {
                    return orderA;
                } else {
                    return orderB;
                }
            }
        } else {
            return orderB;
        }
    }

    hasBuyPriority(shareIndex, orderA, orderB) {
        if (this.buyBook[shareIndex][orderA].value > this.buyBook[shareIndex][orderB].value) {
            return orderA;
        } else if (this.buyBook[shareIndex][orderA].value === this.buyBook[shareIndex][orderB].value) {
            if (this.buyBook[shareIndex][orderA].time < this.buyBook[shareIndex][orderB].time) {
                return orderA;
            } else if (this.buyBook[shareIndex][orderA].time > this.buyBook[shareIndex][orderB].time) {
                return orderB;
            } else {
                if (this.buyBook[shareIndex][orderA].qty > this.buyBook[shareIndex][orderB].qty) {
                    return orderA;
                } else {
                    return orderB;
                }
            }
        } else {
            return orderB;
        }
    }

    dequeuefromSellBook(shareIndex) {
        this.initializeShare(shareIndex);
        if (this.sellBook[shareIndex].length === 0) return null;
        let orderObj = this.sellBook[shareIndex][0];
        let lastElement = this.sellBook[shareIndex].pop();
        if (this.sellBook[shareIndex].length === 0) {
            delete this.orderHash[orderObj.orderID];
            return orderObj;
        }
        this.sellBook[shareIndex][0] = lastElement;
        this.orderHash[lastElement.orderID].orderIndex = 0;
        delete this.orderHash[orderObj.orderID];
        let currIdx = 0;
        while (currIdx < this.sellBook[shareIndex].length - 1) {
            let left = currIdx * 2 + 1;
            let right = currIdx * 2 + 2;
            let leftExists = left <= this.sellBook[shareIndex].length - 1;
            let rightExists = right <= this.sellBook[shareIndex].length - 1;
            if (leftExists && rightExists) {
                let tempSwapIdx = this.hasSellPriority(shareIndex, left, right);
                let swapIdx = this.hasSellPriority(shareIndex, tempSwapIdx, currIdx);
                if (swapIdx === currIdx) break;
                let currOrderID = this.sellBook[shareIndex][currIdx].orderID;
                let swapOrderID = this.sellBook[shareIndex][swapIdx].orderID;
                let temp = this.sellBook[shareIndex][currIdx];
                this.sellBook[shareIndex][currIdx] = this.sellBook[shareIndex][swapIdx];
                this.sellBook[shareIndex][swapIdx] = temp;
                this.orderHash[currOrderID].orderIndex = swapIdx;
                this.orderHash[swapOrderID].orderIndex = currIdx;
                currIdx = swapIdx;
            } else if (leftExists) {
                if (this.hasSellPriority(shareIndex, currIdx, left) === left) {
                    let currOrderID = this.sellBook[shareIndex][currIdx].orderID;
                    let swapOrderID = this.sellBook[shareIndex][left].orderID;
                    let temp = this.sellBook[shareIndex][currIdx];
                    this.sellBook[shareIndex][currIdx] = this.sellBook[shareIndex][left];
                    this.sellBook[shareIndex][left] = temp;
                    this.orderHash[currOrderID].orderIndex = left;
                    this.orderHash[swapOrderID].orderIndex = currIdx;
                    currIdx = left;
                }
                break;
            } else {
                break;
            }
        }
        return orderObj;
    }

    dequeuefromBuyBook(shareIndex) {
        this.initializeShare(shareIndex);
        if (this.buyBook[shareIndex].length === 0) return null;
        let orderObj = this.buyBook[shareIndex][0];
        let lastElement = this.buyBook[shareIndex].pop();
        if (this.buyBook[shareIndex].length === 0) {
            delete this.orderHash[orderObj.orderID];
            return orderObj;
        }
        this.buyBook[shareIndex][0] = lastElement;
        this.orderHash[lastElement.orderID].orderIndex = 0;
        delete this.orderHash[orderObj.orderID];
        let currIdx = 0;
        while (currIdx < this.buyBook[shareIndex].length - 1) {
            let left = currIdx * 2 + 1;
            let right = currIdx * 2 + 2;
            let leftExists = left <= this.buyBook[shareIndex].length - 1;
            let rightExists = right <= this.buyBook[shareIndex].length - 1;
            if (leftExists && rightExists) {
                let tempSwapIdx = this.hasBuyPriority(shareIndex, left, right);
                let swapIdx = this.hasBuyPriority(shareIndex, tempSwapIdx, currIdx);
                if (swapIdx === currIdx) break;
                let currOrderID = this.buyBook[shareIndex][currIdx].orderID;
                let swapOrderID = this.buyBook[shareIndex][swapIdx].orderID;
                let temp = this.buyBook[shareIndex][currIdx];
                this.buyBook[shareIndex][currIdx] = this.buyBook[shareIndex][swapIdx];
                this.buyBook[shareIndex][swapIdx] = temp;
                this.orderHash[currOrderID].orderIndex = swapIdx;
                this.orderHash[swapOrderID].orderIndex = currIdx;
                currIdx = swapIdx;
            } else if (leftExists) {
                if (this.hasBuyPriority(shareIndex, currIdx, left) === left) {
                    let currOrderID = this.buyBook[shareIndex][currIdx].orderID;
                    let swapOrderID = this.buyBook[shareIndex][left].orderID;
                    let temp = this.buyBook[shareIndex][currIdx];
                    this.buyBook[shareIndex][currIdx] = this.buyBook[shareIndex][left];
                    this.buyBook[shareIndex][left] = temp;
                    this.orderHash[currOrderID].orderIndex = left;
                    this.orderHash[swapOrderID].orderIndex = currIdx;
                    currIdx = left;
                }
                break;
            } else {
                break;
            }
        }
        return orderObj;
    }

    fetchCurrentMarketValue(upperCircuit, lowerCircuit,shareIndex){
        if (this.sellBook[shareIndex].length == 0){
            if (this.buyBook[shareIndex].length == 0){
                return {"value":lowerCircuit,"statusCode":1};
            }
            return {"value":upperCircuit,"statusCode":2};
        } else if (this.buyBook[shareIndex].length == 0 ){
            return {"value":lowerCircuit,"statusCode":4};
        } else if (this.sellBook[shareIndex][0].value <= this.buyBook[shareIndex][0].value){
            return {"value":this.sellBook[shareIndex][0].value,"statusCode":3};
        } else {
            return {"value":(this.sellBook[shareIndex][0].value + this.buyBook[shareIndex][0].value)/2,"statusCode":5};
        }
    }

    matchOrders(shareIndex){
        while (this.sellBook[shareIndex].length != 0 && this.buyBook[shareIndex].length != 0 && this.buyBook[shareIndex][0].value >= this.sellBook[shareIndex][0].value){
            let qty = this.sellBook[shareIndex][0].qty - this.buyBook[shareIndex][0].qty;
            if (qty > 0){
                this.dbMatchedQueue.push({"value":this.sellBook[shareIndex][0].value,"qty":Math.min(this.sellBook[shareIndex][0].qty,this.buyBook[shareIndex][0].qty),"ShareName":"JSW","SellID":"Shaury Singh","BuyID":"Vedant Ere"});
                // await addMatchedOrderIntoDatabase(this.sellBook[shareIndex][0].value,Math.min(this.sellBook[shareIndex][0].qty,this.buyBook[shareIndex][0].qty),"JSW","Shaury Singh","Vedant Ere");
                let buyOrder = this.dequeuefromBuyBook(shareIndex); 
                this.sellBook[shareIndex][0].qty = qty;
                console.log(`${JSON.stringify(this.sellBook[shareIndex][0])} matched to ${JSON.stringify(buyOrder)}`);
            } else if (qty == 0) {
                this.dbMatchedQueue.push({"value":this.sellBook[shareIndex][0].value,"qty":this.sellBook[shareIndex][0].qty,"ShareName":"JSW","SellID":"Shaury Singh","BuyID":"Vedant Ere"});
                // await addMatchedOrderIntoDatabase(this.sellBook[shareIndex][0].value,this.sellBook[shareIndex][0].qty,"JSW","Shaury Singh","Vedant Ere");
                let sellOrder = this.dequeuefromSellBook(shareIndex);
                let buyOrder = this.dequeuefromBuyBook(shareIndex); 
                console.log(`${JSON.stringify(sellOrder)} matched to ${JSON.stringify(buyOrder)}`);
            } else {
                this.dbMatchedQueue.push({"value":this.sellBook[shareIndex][0].value,"qty":Math.min(this.sellBook[shareIndex][0].qty,this.buyBook[shareIndex][0].qty),"ShareName":"JSW","SellID":"Shaury Singh","BuyID":"Vedant Ere"});
                // await addMatchedOrderIntoDatabase(this.sellBook[shareIndex][0].value,Math.min(this.sellBook[shareIndex][0].qty,this.buyBook[shareIndex][0].qty),"JSW","Shaury Singh","Vedant Ere");
                let sellOrder = this.dequeuefromSellBook(shareIndex);
                this.buyBook[shareIndex][0].qty = (qty*-1);
                console.log(`${JSON.stringify(sellOrder)} matched to ${JSON.stringify(this.buyBook[shareIndex][0])}`);
            }
        }
        return this.dbMatchedQueue;
        // console.log(`Current Market Value is: ${JSON.stringify(this.fetchCurrentMarketValue(150.23,200.48,shareIndex))}`);
    }

    showdbQueue() {
        for (let i=0; i<this.dbOrderQueue.length; i++){
            console.log(JSON.stringify(this.dbOrderQueue[i]));
        }    
    }

    showMatchedQueue(){
        for (let i=0; i<this.dbMatchedQueue.length; i++){
            console.log(JSON.stringify(this.dbMatchedQueue[i]));
        }
    }

    async startDBMatchedOrderWorker(){
        while (true){
            if (this.dbMatchedQueue.length == 0){
                await new Promise(resolve => setTimeout(resolve,10));
                continue;
            }
            const trade = this.dbMatchedQueue.shift();
            try{
                await addMatchedOrderIntoDatabase(trade.value,trade.qty,trade.ShareName,trade.BuyID,trade.SellID);
            } catch(err){
                console.log("DB failed, pushing back to queue");
                this.dbMatchedQueue.unshift(trade);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }

    async startDBPlaceOrderWorker(){
        while (true){
            if (this.dbOrderQueue.length == 0){
                await new Promise(resolve => setTimeout(resolve,10));
                continue;
            }
            const order = this.dbOrderQueue.shift();
            try{
                await addOrderIntoDatabase(order.type,order.value,order.qty,order.shareName,order.userID);
            } catch(err){
                console.log("Order Placement Failed, pushing back to queue");
                this.dbOrderQueue.unshift(order);
                await new Promise(resolve => setTimeout(resolve,10));
            }
        }
    }

    cancelBuyOrder(orderID){
        const shareIndex = this.orderHash[orderID]["shareIndex"];
        let currIdx = this.orderHash[orderID]["orderIndex"];
        this.buyBook[shareIndex][currIdx] = this.buyBook[shareIndex][this.buyBook[shareIndex].length-1];
        this.buyBook[shareIndex].pop();
        while (currIdx < this.buyBook[shareIndex].length-1 && currIdx > 0){
            let parentIdx = Math.floor((currIdx-1)/2);
            if (this.hasBuyPriority(shareIndex,parentIdx,currIdx) == parentIdx){
                // bubble DOWN
            } else {
                // bubble UP
            }
        }
    }
}

async function runEngine() {
    const engine = new Engine();
    const shareIndex = 0;
    engine.initializeShare(shareIndex);
    engine.enqueueSellOrder("JSW", 148.55, 5, Date.now(), engine.sellBook[shareIndex].length - 1, 1, shareIndex);
    engine.enqueueSellOrder("JSW", 148.70, 3, Date.now(), engine.sellBook[shareIndex].length - 1, 12, shareIndex);
    engine.enqueueSellOrder("JSW", 148.35, 10, Date.now(), engine.sellBook[shareIndex].length - 1, 13, shareIndex);
    engine.enqueueSellOrder("JSW", 148.15, 13, Date.now(), engine.sellBook[shareIndex].length - 1, 14, shareIndex);
    engine.enqueueSellOrder("JSW", 148.85, 28, Date.now(), engine.sellBook[shareIndex].length - 1, 15, shareIndex);
    engine.enqueueBuyOrder("JSW", 148.35, 1, Date.now(), engine.buyBook[shareIndex].length - 1, 16, shareIndex);
    engine.enqueueBuyOrder("JSW", 148.40, 3, Date.now(), engine.buyBook[shareIndex].length - 1, 17, shareIndex);
    engine.enqueueBuyOrder("JSW", 148.38, 50, Date.now(), engine.buyBook[shareIndex].length - 1, 18, shareIndex);
    engine.enqueueSellOrder("JSW", 148.15, 2, Date.now(), engine.sellBook[shareIndex].length - 1, 19, shareIndex);
    const sameTime = Date.now();
    engine.enqueueBuyOrder("JSW", 148.40, 10, sameTime, engine.buyBook[shareIndex].length - 1, 20, shareIndex);
    engine.enqueueBuyOrder("JSW", 148.40, 2, sameTime, engine.buyBook[shareIndex].length - 1, 21, shareIndex);
    engine.matchOrders(shareIndex);
    console.log("------------- SELL BOOK ---------------");
    console.log(engine.sellBook[shareIndex]);
    console.log("------------- BUY BOOK ----------------");
    console.log(engine.buyBook[shareIndex]);
    console.log("--------------DB Queue ----------------");
    engine.showdbQueue();
    console.log("--------------Matched Order Queue------");
    engine.showMatchedQueue();
    console.log("--------------Order Hash---------------");
    console.log(engine.orderHash);
}
runEngine();