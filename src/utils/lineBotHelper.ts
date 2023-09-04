import { Client, TemplateMessage } from "@line/bot-sdk";
import { URLSearchParams } from "url";
import { addToNotion, updateNotion } from "./notionHelper";
import { UserVotes, UserData, VoteOptions } from "../interfaces/vote.interface";


const maxVotes = 1;

export const buttonsActionTemplate: TemplateMessage = {
    type: 'template',
    altText: '活動群選項',
    template: {
        type: 'buttons',
        thumbnailImageUrl: 'https://meet.eslite.com/Content/Images/Article/PussinBoots_TheLastWish_20220816172016.jpg',
        title: '活動群選項',
        text: '請選擇一個選項',
        actions: [
            {
                type: 'postback',
                label: 'A廳',
                data: 'action=select&item=A'
            },
            {
                type: 'postback',
                label: 'B廳',
                data: 'action=select&item=B'
            },
            {
                type: 'message',
                label: '加購爆米花或飲料',
                text: '/add'
            },
            {
                type: 'postback',
                label: '顯示我的訂單',
                data: 'action=show'
            }
        ],
    },
};

// 加購選項
const buttonsAddPopcornTemplate: TemplateMessage = {
    type: 'template',
    altText: '爆米花加購專區',
    template: {
        type: 'buttons',
        thumbnailImageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkCiXRlnOiiAHTtNs69pB51el9mZRqVpCSgw&usqp=CAU',
        title: '爆米花加購專區',
        text: '請選擇要不要加購爆米花或取消加購',
        actions: [
            {
                type: 'postback',
                label: '加購爆米花',
                data: 'action=add&item=popcorn'
            },
            {
                type: 'postback',
                label: '取消加購爆米花',
                data: 'action=add&item=popcornCancel'
            }
        ],
    },
};
const buttonsAddDrinkTemplate: TemplateMessage = {
    type: 'template',
    altText: '飲料加購專區',
    template: {
        type: 'buttons',
        thumbnailImageUrl: 'https://i.imgur.com/I29Dj3M.jpg',
        title: '飲料加購專區',
        text: '請選擇要加購的飲料或取消加購',
        actions: [
            {
                type: 'postback',
                label: '加購或修改飲料',
                data: 'action=add&item=drink'
            },
            {
                type: 'postback',
                label: '取消加購飲料',
                data: 'action=add&item=drinkCancel'
            },
            {
                type: 'postback',
                label: '查看菜單',
                data: 'action=add&item=drinkMenu'
            }
        ],
    },
};

// 發送活動選項
export async function sendActionButtons(client: Client, replyToken: string, userVotes: UserVotes) {
    await client.replyMessage(replyToken, buttonsActionTemplate).catch((err) => {
        console.error("replyMessage error:", err);
    });
}

// 發送加購選項
export async function sendAddButtons(client: Client, replyToken: string) {
    await client.replyMessage(replyToken, [buttonsAddPopcornTemplate, buttonsAddDrinkTemplate]).catch((err) => {
        console.error("replyMessage error:", err);
    });
}

export const handleVote = async (
    client: Client,
    event: any,
    replyToken: string,
    userVotes: UserVotes
) => {
    // 取得 postback 資料
    const postData = new URLSearchParams(event.postback.data);
    const action = postData.get("action");
    const item = postData.get("item") as VoteOptions; // 請確保 VoteOptions 包括你的所有選項

    // 取得用戶資訊 
    const userId = event.source.userId;
    const groupId = event.source.groupId;
    const profile = await client.getGroupMemberProfile(groupId, userId);
    const userName = profile.displayName;

    if (action === "select") {
        if (item) {
            // 計算選項票數，同一個選項的票數超過 maxVotes 則請用戶重新選擇
            const votesItem = Object.values(userVotes).filter((vote) => vote.choice === item && vote.userId !== userId);
            if (votesItem.length >= maxVotes) {
                await client.pushMessage(groupId, {
                    type: "text",
                    text: `選項 ${item} 已滿，請重新選擇`,
                });
                return;
            }
            
            if (userVotes[userId]) {
                // 更新 Notion 資料
                userVotes[userId].choice = item;
                updateNotion(userVotes[userId]);
            } else {
                // 新增到 Notion 資料庫
                userVotes[userId] = {
                    userName,
                    choice: item,
                    addPopcorn: false,
                    pageId: "",
                    drink: undefined,
                    userId,
                };
                addToNotion(userId, userName, item, userVotes[userId].addPopcorn).then((data) => {
                    userVotes[userId].pageId = data;
                })
            }

            // 目前A廳與B廳的票數
            const votes = Object.values(userVotes);
            const votesA = votes.filter((vote) => vote.choice === "A");
            const votesB = votes.filter((vote) => vote.choice === "B");
            let text = `你（${userName}）已選擇 ${item}廳\nA廳剩餘: ${maxVotes - votesA.length}位\nB廳剩餘: ${maxVotes - votesB.length}位`;
            await client.replyMessage(replyToken, {
                type: "text",
                text: text,
            });
        }
    } else if (action === "add") {
        // 加購爆米花與飲料前需要先選擇 A 或 B
        if (!userVotes[userId]) {
            await client.replyMessage(replyToken, {
                type: "text",
                text: `你（${userName}）還沒有選擇 A廳 或 B廳,請先選擇您要觀看的場地`,
            });
            return;
        }

        // 爆米花
        if (item === "popcorn" || item === "popcornCancel"){
            let text = "";
            if (item === "popcorn") {
                userVotes[userId].addPopcorn = true;
                text = `你（${userName}）已選擇加購爆米花`;
            } else if (item === "popcornCancel") {
                userVotes[userId].addPopcorn = false;
                text = `你（${userName}）已取消加購爆米花`;
            }
            await client.replyMessage(replyToken, {
                type: "text",
                text: text,
            });
            const userChoice = userVotes[userId].choice;
            if (userChoice !== null) {
                await updateNotion(userVotes[userId]);
            }
        }

        // 飲料
        if (item === "drink" || item === "drinkCancel" || item === "drinkMenu"){
            if(item === "drink"){
                await client.replyMessage(replyToken,
                    {
                    type: 'text',
                    text: '請輸入你的飲料\n飲料名稱(空白) 糖度(空白) 冰塊(空白) 加料(非必填)\n範例：波霸奶茶 微糖 微冰 加愛玉',
                    },
                );
                // 進入飲料選擇狀態
                userVotes[userId].drink = "";
                await updateNotion(userVotes[userId]);
            } else if (item === "drinkCancel"){
                userVotes[userId].drink = undefined;
                await updateNotion(userVotes[userId]);
                await client.replyMessage(replyToken, {
                    type: "text",
                    text: `你（${userName}）已取消加購飲料`,
                });
            } else if (item === "drinkMenu"){
                await client.replyMessage(replyToken, 
                    {
                        type: 'image',
                        originalContentUrl: "https://i.imgur.com/tz8R3BG.jpg",
                        previewImageUrl: "https://i.imgur.com/tz8R3BG.jpg"
                    }
                );
            }
        }

    } else if (action === "show") {
        const { choice, addPopcorn } = userVotes[userId];
        let text = "";
        if (choice === null) {
            text = "你還沒有投票";
        } else {
           // 顯示用戶選擇的選項與是否加購爆米花與飲料
            console.log(userVotes[userId]);
            text = `你（${userName}）已選擇 ${choice}廳\n加購爆米花: ${addPopcorn ? "是" : "否"}\n加購飲料: ${userVotes[userId].drink ?? "否"}`;
        }
        await client.replyMessage(replyToken, {
            type: "text",
            text: text,
        });
    }
};

export const handleDrink = async (
    client: Client,
    event: any,
    replyToken: string,
    userVotes: UserVotes
) => {
    // 取得用戶資訊 
    const userId = event.source.userId;
    const groupId = event.source.groupId;
    const profile = await client.getGroupMemberProfile(groupId, userId);
    const userName = profile.displayName;

    if (!userVotes[userId]) {
        await client.replyMessage(replyToken, {
            type: "text",
            text: `你（${userName}）還沒有選擇 A廳 或 B廳`,
        });
        return;
    }

    if(userVotes[userId].drink === ""){
        // 取得用戶選擇的飲料
        const drink = event.message.text;

        // 判斷有沒有少選,用空格切割1,2,3必選
        const drinkArray = drink.split(" ");
        if(drinkArray.length < 3){
            await client.replyMessage(replyToken, {
                type: "text",
                text: `你（${userName}）的飲料選擇不完整，請重新選擇`,
            });
            return;
        }

        userVotes[userId].drink = drink;
        await client.replyMessage(replyToken, {
            type: "text",
            text: `你（${userName}）已選擇 ${drink}`,
        });
        const userChoice = userVotes[userId].drink;
        if (userChoice !== null) {
            await updateNotion(userVotes[userId]);
        }
    }



}