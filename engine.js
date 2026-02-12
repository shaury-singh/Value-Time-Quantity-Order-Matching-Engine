class Engine {
    constructor() {
        this.sellBook = {};
        this.buyBook = {};
    }

    initializeShare(shareIndex) {
        if (!this.sellBook[shareIndex]) this.sellBook[shareIndex] = [];
        if (!this.buyBook[shareIndex]) this.buyBook[shareIndex] = [];
    }

    async enqueueSellOrder(shareName, value, qty, time, currIdx, shareIndex) {
        this.initializeShare(shareIndex);
        if (currIdx === this.sellBook[shareIndex].length - 1) {
            this.sellBook[shareIndex].push({ shareName, value, time, qty });
            currIdx = this.sellBook[shareIndex].length - 1;
            await addOrderIntoDatabase("sell", value, qty, shareName, "Shaury Singh");
        }
        let parentIdx = Math.floor((currIdx - 1) / 2);
        if (currIdx > 0) {
            if (this.sellBook[shareIndex][currIdx].value < this.sellBook[shareIndex][parentIdx].value) {
                let temp = this.sellBook[shareIndex][currIdx];
                this.sellBook[shareIndex][currIdx] = this.sellBook[shareIndex][parentIdx];
                this.sellBook[shareIndex][parentIdx] = temp;
                return this.enqueueSellOrder(shareName, value, qty, time, parentIdx, shareIndex);
            } else if (this.sellBook[shareIndex][currIdx].value === this.sellBook[shareIndex][parentIdx].value) {
                if (this.sellBook[shareIndex][currIdx].time < this.sellBook[shareIndex][parentIdx].time) {
                    let temp = this.sellBook[shareIndex][currIdx];
                    this.sellBook[shareIndex][currIdx] = this.sellBook[shareIndex][parentIdx];
                    this.sellBook[shareIndex][parentIdx] = temp;
                    return this.enqueueSellOrder(shareName, value, qty, time, parentIdx, shareIndex);
                } else if (
                    this.sellBook[shareIndex][currIdx].time === this.sellBook[shareIndex][parentIdx].time &&
                    this.sellBook[shareIndex][currIdx].qty > this.sellBook[shareIndex][parentIdx].qty
                ) {
                    let temp = this.sellBook[shareIndex][currIdx];
                    this.sellBook[shareIndex][currIdx] = this.sellBook[shareIndex][parentIdx];
                    this.sellBook[shareIndex][parentIdx] = temp;
                    return this.enqueueSellOrder(shareName, value, qty, time, parentIdx, shareIndex);
                }
            }
        }
    }

    async enqueueBuyOrder(shareName, value, qty, time, currIdx, shareIndex) {
        this.initializeShare(shareIndex);
        if (currIdx === this.buyBook[shareIndex].length - 1) {
            this.buyBook[shareIndex].push({ shareName, value, time, qty });
            currIdx = this.buyBook[shareIndex].length - 1;
            await addOrderIntoDatabase("buy", value, qty, shareName, "Vedant Ere");
        }
        let parentIdx = Math.floor((currIdx - 1) / 2);
        if (currIdx > 0) {
            if (this.buyBook[shareIndex][currIdx].value > this.buyBook[shareIndex][parentIdx].value) {
                let temp = this.buyBook[shareIndex][currIdx];
                this.buyBook[shareIndex][currIdx] = this.buyBook[shareIndex][parentIdx];
                this.buyBook[shareIndex][parentIdx] = temp;
                return this.enqueueBuyOrder(shareName, value, qty, time, parentIdx, shareIndex);
            } else if (this.buyBook[shareIndex][currIdx].value === this.buyBook[shareIndex][parentIdx].value) {
                if (this.buyBook[shareIndex][currIdx].time < this.buyBook[shareIndex][parentIdx].time) {
                    let temp = this.buyBook[shareIndex][currIdx];
                    this.buyBook[shareIndex][currIdx] = this.buyBook[shareIndex][parentIdx];
                    this.buyBook[shareIndex][parentIdx] = temp;
                    return this.enqueueBuyOrder(shareName, value, qty, time, parentIdx, shareIndex);
                } else if (
                    this.buyBook[shareIndex][currIdx].time === this.buyBook[shareIndex][parentIdx].time &&
                    this.buyBook[shareIndex][currIdx].qty > this.buyBook[shareIndex][parentIdx].qty
                ) {
                    let temp = this.buyBook[shareIndex][currIdx];
                    this.buyBook[shareIndex][currIdx] = this.buyBook[shareIndex][parentIdx];
                    this.buyBook[shareIndex][parentIdx] = temp;
                    return this.enqueueBuyOrder(shareName, value, qty, time, parentIdx, shareIndex);
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
        if (this.sellBook[shareIndex].length === 0) return orderObj;
        this.sellBook[shareIndex][0] = lastElement;
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
                let temp = this.sellBook[shareIndex][currIdx];
                this.sellBook[shareIndex][currIdx] = this.sellBook[shareIndex][swapIdx];
                this.sellBook[shareIndex][swapIdx] = temp;
                currIdx = swapIdx;
            } else if (leftExists) {
                if (this.hasSellPriority(shareIndex, currIdx, left) === left) {
                    let temp = this.sellBook[shareIndex][currIdx];
                    this.sellBook[shareIndex][currIdx] = this.sellBook[shareIndex][left];
                    this.sellBook[shareIndex][left] = temp;
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
        if (this.buyBook[shareIndex].length === 0) return orderObj;
        this.buyBook[shareIndex][0] = lastElement;
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
                let temp = this.buyBook[shareIndex][currIdx];
                this.buyBook[shareIndex][currIdx] = this.buyBook[shareIndex][swapIdx];
                this.buyBook[shareIndex][swapIdx] = temp;
                currIdx = swapIdx;
            } else if (leftExists) {
                if (this.hasBuyPriority(shareIndex, currIdx, left) === left) {
                    let temp = this.buyBook[shareIndex][currIdx];
                    this.buyBook[shareIndex][currIdx] = this.buyBook[shareIndex][left];
                    this.buyBook[shareIndex][left] = temp;
                }
                break;
            } else {
                break;
            }
        }
        return orderObj;
    }
}

async function runEngine() {
    const engine = new Engine();
    const shareIndex = 0;
    engine.initializeShare(shareIndex);
    await engine.enqueueSellOrder("JSW", 148.55, 5, Date.now(), engine.sellBook[shareIndex].length - 1, shareIndex);
    await engine.enqueueSellOrder("JSW", 148.70, 3, Date.now(), engine.sellBook[shareIndex].length - 1, shareIndex);
    await engine.enqueueSellOrder("JSW", 148.35, 10, Date.now(), engine.sellBook[shareIndex].length - 1, shareIndex);
    await engine.enqueueSellOrder("JSW", 148.15, 13, Date.now(), engine.sellBook[shareIndex].length - 1, shareIndex);
    await engine.enqueueSellOrder("JSW", 148.85, 28, Date.now(), engine.sellBook[shareIndex].length - 1, shareIndex);
    await engine.enqueueBuyOrder("JSW", 148.35, 1, Date.now(), engine.buyBook[shareIndex].length - 1, shareIndex);
    await engine.enqueueBuyOrder("JSW", 148.40, 3, Date.now(), engine.buyBook[shareIndex].length - 1, shareIndex);
    await engine.enqueueBuyOrder("JSW", 148.38, 50, Date.now(), engine.buyBook[shareIndex].length - 1, shareIndex);
    await engine.enqueueSellOrder("JSW", 148.15, 2, Date.now(), engine.sellBook[shareIndex].length - 1, shareIndex);
    const sameTime = Date.now();
    await engine.enqueueBuyOrder("JSW", 148.40, 10, sameTime, engine.buyBook[shareIndex].length - 1, shareIndex);
    await engine.enqueueBuyOrder("JSW", 148.40, 2, sameTime, engine.buyBook[shareIndex].length - 1, shareIndex);
    await engine.matchOrders(shareIndex);
    console.log("------------- SELL BOOK ---------------");
    console.log(engine.sellBook[shareIndex]);
    console.log("------------- BUY BOOK ----------------");
    console.log(engine.buyBook[shareIndex]);
}

runEngine();