import express from "express";
import * as line from "@line/bot-sdk";
import * as dotenv from "dotenv";
import { handleLineVote } from "../controllers/voteController";

dotenv.config();

const router = express.Router();
const channelAccessToken = process.env.CHANNEL_ACCESS_TOKEN;
const channelSecret = process.env.CHANNEL_SECRET;
if (!channelAccessToken || !channelSecret) {
  throw new Error('Environment variables CHANNEL_ACCESS_TOKEN and CHANNEL_SECRET must be set');
}
const config: any = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || "",
  channelSecret: process.env.CHANNEL_SECRET || "",
};

const client = new line.Client(config);

router.post('/webhook', line.middleware(config), async (req, res) => {
  const events = req.body.events;
  for (const event of events) {
    if (event.type === 'postback' || event.type === 'message') {
      await handleLineVote(client, event, event.replyToken);
    }
  }
  res.sendStatus(200);
});

export default router;
