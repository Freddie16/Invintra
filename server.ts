import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createHttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Simulated Trading Engine Data
  const assets = [
    { id: 'btc', symbol: 'BTC/USDT', name: 'Bitcoin', type: 'CRYPTO', basePrice: 50000 },
    { id: 'eth', symbol: 'ETH/USDT', name: 'Ethereum', type: 'CRYPTO', basePrice: 2500 },
    { id: 'sol', symbol: 'SOL/USDT', name: 'Solana', type: 'CRYPTO', basePrice: 100 },
    { id: 'bnb', symbol: 'BNB/USDT', name: 'Binance Coin', type: 'CRYPTO', basePrice: 400 },
    { id: 'aapl', symbol: 'AAPL', name: 'Apple Inc.', type: 'STOCK', basePrice: 180 },
    { id: 'msft', symbol: 'MSFT', name: 'Microsoft Corp.', type: 'STOCK', basePrice: 400 },
    { id: 'amzn', symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'STOCK', basePrice: 175 },
    { id: 'googl', symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'STOCK', basePrice: 150 },
    { id: 'meta', symbol: 'META', name: 'Meta Platforms Inc.', type: 'STOCK', basePrice: 480 },
    { id: 'nflx', symbol: 'NFLX', name: 'Netflix Inc.', type: 'STOCK', basePrice: 600 },
    { id: 'tsla', symbol: 'TSLA', name: 'Tesla, Inc.', type: 'STOCK', basePrice: 200 },
    { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'STOCK', basePrice: 800 },
    { id: 'spx', symbol: 'SPX', name: 'S&P 500', type: 'INDEX', basePrice: 5000 },
    { id: 'ndx', symbol: 'NDX', name: 'Nasdaq 100', type: 'INDEX', basePrice: 18000 },
    { id: 'dji', symbol: 'DJI', name: 'Dow Jones', type: 'INDEX', basePrice: 38000 },
    { id: 'ftse', symbol: 'FTSE', name: 'FTSE 100', type: 'INDEX', basePrice: 7600 },
    { id: 'dax', symbol: 'DAX', name: 'DAX Index', type: 'INDEX', basePrice: 17000 },
    { id: 'n225', symbol: 'N225', name: 'Nikkei 225', type: 'INDEX', basePrice: 39000 },
    { id: 'nse20', symbol: 'NSE20', name: 'NSE 20 Share Index', type: 'INDEX', basePrice: 1500 },
  ];

  const assetStates: Record<string, { price: number; history: { time: string; price: number }[] }> = {};

  assets.forEach(asset => {
    let currentPrice = asset.basePrice;
    let history: { time: string; price: number }[] = [];
    for (let i = 0; i < 100; i++) {
      currentPrice += (Math.random() - 0.5) * (asset.basePrice * 0.002);
      history.push({
        time: new Date(Date.now() - (100 - i) * 60000).toISOString(),
        price: currentPrice,
      });
    }
    assetStates[asset.id] = { price: currentPrice, history };
  });

  // Background Trading Loop (Simulated)
  setInterval(() => {
    assets.forEach(asset => {
      const state = assetStates[asset.id];
      state.price += (Math.random() - 0.5) * (asset.basePrice * 0.003);
      const newPoint = {
        time: new Date().toISOString(),
        price: state.price,
      };
      state.history.push(newPoint);
      if (state.history.length > 200) state.history.shift();

      // Emit live price update to all connected clients
      io.emit("price-update", { assetId: asset.id, ...newPoint });
    });
  }, 3000);

  app.get("/api/assets", (req, res) => {
    res.json(assets.map(a => ({
      ...a,
      currentPrice: assetStates[a.id].price,
      change24h: ((assetStates[a.id].price - assetStates[a.id].history[0].price) / assetStates[a.id].history[0].price) * 100
    })));
  });

  app.get("/api/market-data/:assetId", (req, res) => {
    const assetId = req.params.assetId;
    const state = assetStates[assetId];
    if (!state) return res.status(404).json({ error: "Asset not found" });
    res.json({
      price: state.price,
      history: state.history,
    });
  });

  // M-Pesa Endpoints (Mocked for Demo)
  app.post("/api/mpesa/deposit", (req, res) => {
    const { phoneNumber, amount } = req.body;
    console.log(`M-Pesa STK Push initiated for ${phoneNumber} with amount ${amount}`);
    // Simulate STK Push response
    res.json({
      MerchantRequestID: "12345-67890",
      CheckoutRequestID: "ws_CO_123456789",
      ResponseCode: "0",
      ResponseDescription: "Success. Request accepted for processing",
      CustomerMessage: "Success. Request accepted for processing"
    });
  });

  app.post("/api/mpesa/withdraw", (req, res) => {
    const { phoneNumber, amount } = req.body;
    console.log(`M-Pesa B2C initiated for ${phoneNumber} with amount ${amount}`);
    // Simulate B2C response
    res.json({
      ConversationID: "12345-67890",
      OriginatorConversationID: "ws_CO_123456789",
      ResponseCode: "0",
      ResponseDescription: "Accept the service request successfully."
    });
  });

  // WebSocket Connection Handling
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    
    // Send initial history for all assets
    const initialData: Record<string, any> = {};
    assets.forEach(a => {
      initialData[a.id] = assetStates[a.id].history;
    });
    socket.emit("initial-history-all", initialData);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
