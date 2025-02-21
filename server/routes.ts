import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import profileRoutes from "./routes/profile";
import path from "path";
import fs from "fs";
import express from "express";
import { createHash } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploaded files
  app.use("/uploads", express.static(uploadsDir));

  setupAuth(app);

  // Register profile routes
  app.use("/api", profileRoutes);

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // WebSocket error handling
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  // Connection handling
  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    ws.on('error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  // Broadcast updates to all connected clients
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(data));
        } catch (error) {
          console.error('Error broadcasting message:', error);
        }
      }
    });
  };

  // Admin routes
  app.post("/api/elections", async (req, res) => {
    try {
      if (!req.user?.isAdmin) return res.sendStatus(403);

      const election = await storage.createElection({
        ...req.body,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
      });
      broadcast({ type: "NEW_ELECTION", election });
      res.json(election);
    } catch (error) {
      console.error('Error creating election:', error);
      res.status(500).json({ error: "Failed to create election" });
    }
  });

  app.post("/api/candidates", async (req, res) => {
    try {
      if (!req.user?.isAdmin) return res.sendStatus(403);

      const candidate = await storage.createCandidate(req.body);
      broadcast({ type: "NEW_CANDIDATE", candidate });
      res.json(candidate);
    } catch (error) {
      console.error('Error creating candidate:', error);
      res.status(500).json({ error: "Failed to create candidate" });
    }
  });

  // Voter routes
  app.get("/api/elections", async (req, res) => {
    try {
      const elections = await storage.getElections();
      res.json(elections);
    } catch (error) {
      console.error('Error fetching elections:', error);
      res.status(500).json({ error: "Failed to fetch elections" });
    }
  });

  app.get("/api/elections/:id/candidates", async (req, res) => {
    try {
      const candidates = await storage.getCandidates(Number(req.params.id));
      res.json(candidates);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      res.status(500).json({ error: "Failed to fetch candidates" });
    }
  });

  app.post("/api/vote", async (req, res) => {
    try {
      if (!req.user) return res.sendStatus(401);

      const voterHash = createHash('sha256')
        .update(req.user.id.toString())
        .digest('hex');

      const vote = await storage.castVote({
        ...req.body,
        voterHash,
        timestamp: new Date(),
      });

      broadcast({ type: "NEW_VOTE", vote });
      res.json(vote);
    } catch (error) {
      console.error('Error casting vote:', error);
      res.status(500).json({ error: "Failed to cast vote" });
    }
  });

  app.get("/api/elections/:id/results", async (req, res) => {
    try {
      const votes = await storage.getVotes(Number(req.params.id));
      res.json(votes);
    } catch (error) {
      console.error('Error fetching election results:', error);
      res.status(500).json({ error: "Failed to fetch election results" });
    }
  });

  return httpServer;
}