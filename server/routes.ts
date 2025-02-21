import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { insertCandidateSchema, insertElectionSchema } from "@shared/schema";
import crypto from 'crypto';

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Broadcast updates to all connected clients
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Admin routes
  app.post("/api/elections", async (req, res) => {
    if (!req.user?.isAdmin) return res.sendStatus(403);
    
    const election = await storage.createElection({
      ...req.body,
      startTime: new Date(req.body.startTime),
      endTime: new Date(req.body.endTime),
    });
    broadcast({ type: "NEW_ELECTION", election });
    res.json(election);
  });

  app.post("/api/candidates", async (req, res) => {
    if (!req.user?.isAdmin) return res.sendStatus(403);
    
    const candidate = await storage.createCandidate(req.body);
    broadcast({ type: "NEW_CANDIDATE", candidate });
    res.json(candidate);
  });

  // Voter routes
  app.get("/api/elections", async (req, res) => {
    const elections = await storage.getElections();
    res.json(elections);
  });

  app.get("/api/elections/:id/candidates", async (req, res) => {
    const candidates = await storage.getCandidates(Number(req.params.id));
    res.json(candidates);
  });

  app.post("/api/vote", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const voterHash = crypto
      .createHash('sha256')
      .update(req.user.id.toString())
      .digest('hex');

    const vote = await storage.castVote({
      ...req.body,
      voterHash,
      timestamp: new Date(),
    });

    broadcast({ type: "NEW_VOTE", vote });
    res.json(vote);
  });

  app.get("/api/elections/:id/results", async (req, res) => {
    const votes = await storage.getVotes(Number(req.params.id));
    res.json(votes);
  });

  return httpServer;
}
