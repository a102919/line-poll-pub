import { Client } from "@line/bot-sdk";
import { handleVote, handleDrink, sendActionButtons, sendAddButtons } from "../utils/lineBotHelper";
import * as dotenv from "dotenv";

dotenv.config();
import { UserVotes } from "../interfaces/vote.interface";
import {
  initializeUserVotesFromNotion,
} from "../utils/notionHelper"; // 路徑根據你的文件結構而定

let userVotes: UserVotes = {};

// 初始化 userVotes
initializeUserVotesFromNotion().then((data) => {
  console.log("Initialized userVotes from Notion");
  userVotes = data;
  console.log(userVotes);
});

export const handleLineVote = async (client: Client, event: any, replyToken: string) => {
  if (event.type === "postback") {
    handleVote(client, event, replyToken, userVotes);
  } else if (event.type === "message" && event.message.text === "/action") {
    sendActionButtons(client, replyToken, userVotes);
  }
  // 加購專區
  else if (event.type === "message" && event.message.text === "/add") {
    sendAddButtons(client, replyToken);
  }
  // 加點飲料
  else if (event.type === "message") {
    handleDrink(client, event, replyToken, userVotes);
  }
};
