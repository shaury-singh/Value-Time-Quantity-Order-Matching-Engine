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

function calculatePercentile(sortedArray, percentile) {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (lower === upper) {
        return sortedArray[lower];
    }
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

async function waitForQueuesEmpty(engine, timeout = 60000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (engine.dbOrderQueue.length === 0 && engine.dbMatchedQueue.length === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    return false;
}

async function stressTest(totalOrders) {
    const latencies = [];
    const burstWindow = 100; 
    let maxBurstRate = 0;
    let burstStartTime = 0;
    let burstCount = 0;
    
    const overallStart = process.hrtime.bigint();
    
    for (let i = 0; i < totalOrders; i++) {
        const order = randomOrder();
        const orderStartTime = process.hrtime.bigint();
        const time = Date.now();
        const orderID = i;
        
        if (i % burstWindow === 0) {
            if (i > 0) {
                const bursElapsedNs = process.hrtime.bigint() - burstStartTime;
                const burstElapsedMs = Number(bursElapsedNs) / 1e6;
                const burstRate = (burstWindow / burstElapsedMs) * 1000; 
                if (burstRate > maxBurstRate) {
                    maxBurstRate = burstRate;
                }
            }
            burstStartTime = process.hrtime.bigint();
        }
        
        if (order.type === "buy") {
            const currIdx = engine.buyBook[shareIndex].length - 1;
            engine.enqueueBuyOrder("JSW", order.price, order.qty, time, currIdx, orderID, shareIndex);
        } else {
            const currIdx = engine.sellBook[shareIndex].length - 1;
            engine.enqueueSellOrder("JSW", order.price, order.qty, time, currIdx, orderID, shareIndex);
        }
        
        engine.matchOrders(shareIndex);
        
        const orderEndTime = process.hrtime.bigint();
        const latencyMs = Number(orderEndTime - orderStartTime) / 1e6;
        latencies.push(latencyMs);
    }
    
    const overallEnd = process.hrtime.bigint();
    const totalDurationMs = Number(overallEnd - overallStart) / 1e6;
    const totalDurationSeconds = totalDurationMs / 1000;

    console.log("\nWaiting for database operations to complete...");
    const dbProcessed = await waitForQueuesEmpty(engine);
    
    if (!dbProcessed) {
        console.warn("Warning: Database operations did not complete within timeout period");
    } else {
        console.log("All orders successfully stored in database!");
    }
    latencies.sort((a, b) => a - b);
    
    const ordersPerSecond = totalOrders / totalDurationSeconds;
    const p50 = calculatePercentile(latencies, 50);
    const p95 = calculatePercentile(latencies, 95);
    const p99 = calculatePercentile(latencies, 99);
    const p99_9 = calculatePercentile(latencies, 99.9);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLatency = latencies[latencies.length - 1];
    const minLatency = latencies[0];

    console.log("\n========== STRESS TEST RESULTS ==========");
    console.log(`Total Orders: ${totalOrders.toLocaleString()}`);
    console.log(`Total Duration: ${totalDurationMs.toFixed(2)} ms (${totalDurationSeconds.toFixed(2)} seconds)`);
    console.log("\n--- Throughput ---");
    console.log(`Orders Per Second: ${ordersPerSecond.toFixed(2)}`);
    console.log(`Peak Burst Load: ${maxBurstRate.toFixed(2)} orders/second`);
    console.log(`Matching Speed: ${ordersPerSecond.toFixed(2)} orders/second`);
    console.log("\n--- Latency Percentiles (ms) ---");
    console.log(`P50 (Median): ${p50.toFixed(4)} ms`);
    console.log(`P95: ${p95.toFixed(4)} ms`);
    console.log(`P99: ${p99.toFixed(4)} ms`);
    console.log(`P99.9: ${p99_9.toFixed(4)} ms`);
    console.log("\n--- Additional Latency Stats (ms) ---");
    console.log(`Average Latency: ${avgLatency.toFixed(4)} ms`);
    console.log(`Min Latency: ${minLatency.toFixed(4)} ms`);
    console.log(`Max Latency: ${maxLatency.toFixed(4)} ms`);
    console.log("========================================\n");
    process.exit(0);
}

stressTest(1000000).catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});