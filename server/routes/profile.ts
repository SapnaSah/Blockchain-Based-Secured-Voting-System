import { Router } from "express";
import multer from "multer";
import path from "path";
import { storage } from "../storage";

const router = Router();

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Update profile information
router.patch("/profile", async (req, res) => {
  if (!req.user) return res.sendStatus(401);
  
  try {
    const updatedUser = await storage.updateUser(req.user.id, {
      displayName: req.body.displayName,
      bio: req.body.bio,
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Upload avatar
router.post("/profile/avatar", upload.single("avatar"), async (req, res) => {
  if (!req.user) return res.sendStatus(401);
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const avatarUrl = `/uploads/${req.file.filename}`;
    const updatedUser = await storage.updateUser(req.user.id, {
      avatarUrl,
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
