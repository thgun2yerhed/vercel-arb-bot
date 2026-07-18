const https = require('https');

const JUPITER = "https://quote-api.jup.ag/v6/quote";
const USDC = "EPjFWaLb3odccccVvM4TdcZkS93vXqbNXCLFiRaKVnPU";
const USDT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenEP9";
const SOL = "So11111111111111111111111111111111111111112";

async function getPrice(inputMint, outputMint, amount) {
    return new Promise((resolve) => {
        const url = `${JUPITER}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=100`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(parseInt(json.outAmount) || null);
                } catch {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

export default async (req, res) => {
    try {
        const usdc = await getPrice(SOL, USDC, 1000000000);
        const usdt = await getPrice(SOL, USDT, 1000000000);
        
        if (usdc && usdt) {
            const spread = Math.abs(usdc - usdt) / Math.max(usdc, usdt);
            if (spread > 0.005) {
                console.log(`ARBITRAGE: ${(spread*100).toFixed(2)}% | USDC: ${usdc} | USDT: ${usdt}`);
            }
            res.json({ timestamp: new Date().toISOString(), spread: (spread*100).toFixed(3), usdc, usdt });
        } else {
            res.json({ error: "Price fetch failed", timestamp: new Date().toISOString() });
        }
    } catch (e) {
        res.json({ error: e.message });
    }
};
