import Engine from "./engine.js";

const engine = new Engine();
const shareIndex = 0;
engine.initializeShare(shareIndex);

function randomOrder() {
    return {
        type: Math.random() > 0.5 ? "buy" : "sell",
        price: 100 + Math.random() * 10,
        qty: Math.floor(Math.random() * 10) + 1,
        shareIndex
    };
}

async function stressTest(totalOrders) {
    const start = process.hrtime.bigint();
    for (let i = 0; i < totalOrders; i++) {
        const order = randomOrder();
        const time = Date.now();
        const orderID = i;
        if (order.type === "buy") {
            const currIdx = engine.buyBook[shareIndex].length - 1;
            engine.enqueueBuyOrder("JSW", order.price, order.qty, time, currIdx, orderID, shareIndex);
        } else {
            const currIdx = engine.sellBook[shareIndex].length - 1;
            engine.enqueueSellOrder("JSW", order.price, order.qty, time, currIdx, orderID, shareIndex);
        }
        engine.matchOrders(shareIndex);
    }
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    console.log(`Processed ${totalOrders} orders in ${durationMs} ms`);
    console.log(`Avg latency per order: ${durationMs / totalOrders} ms`);
}

stressTest(1000000);