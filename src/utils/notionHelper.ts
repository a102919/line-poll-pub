import { Client as notionClient } from "@notionhq/client";
import { UserVotes, UserData } from "../interfaces/vote.interface";

const notion = new notionClient({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_PAGE_ID;
console.log("databaseId",databaseId)
if (!databaseId) {
    throw new Error('Environment variable NOTION_PAGE_ID must be set');
}
const database = { database_id: databaseId };

export async function addToNotion(userId: string, userName: string, choice: string, addPopcorn: boolean) {
  const response = await notion.pages.create({
    parent: database,
    properties: {
      'User Name': { 
        type: 'title',
        title: [{ 
          type: 'text', 
          text: { content: userName } 
        }]
      },
      'User ID': {
        type: 'rich_text',
        rich_text: [{ 
          type: 'text', 
          text: { content: userId } 
        }]
      },
      'Choice': {
        type: 'select',
        select: { name: choice }
      },
      'Add Popcorn': {
        type: 'checkbox',
        checkbox: addPopcorn
      },
    },
  });

  console.log(`Added to Notion: ${response.id}`);
  return response.id;
}

export async function updateNotion(UserData: UserData) {
  let properties: any = {
    'Choice': {
      type: 'select',
      select: { name: UserData.choice }
    },
    'Add Popcorn': {
      type: 'checkbox',
      checkbox: UserData.addPopcorn
    }
  };
    if(UserData.drink) {
      properties['Drink'] = {
        type: 'rich_text',
        rich_text: [{
          type: 'text',
          text: { content: UserData.drink }
        }]
      }
    }else {
      properties['Drink'] = {
        type: 'rich_text',
        rich_text: [{
          type: 'text',
          text: { content: "" }
        }]
      }
    }

    const response = await notion.pages.update({
      page_id: UserData.pageId,
      properties: properties
    });

    console.log(`Updated in Notion: ${response.id}`);
  }

export async function initializeUserVotesFromNotion() {
    const results = await notion.databases.query(database);
    const userVotes: UserVotes = {};
    results.results.forEach((page: any) => {
      const pageId = page.id;
      const userId = page.properties['User ID']?.rich_text?.[0]?.text?.content;
      const userName = page.properties['User Name']?.title?.[0]?.text?.content;
      const choice = page.properties['Choice']?.select?.name;
      const addPopcorn = page.properties['Add Popcorn']?.checkbox;
      const drink = page.properties['Drink']?.rich_text?.[0]?.text?.content;

   
      if (userId && userName) { // 只有在 userId 和 userName 都存在的情況下才儲存
        userVotes[userId] = {
          userId,
          userName,
          choice: choice ?? null,  // 如果 choice 為 null 或 undefined，將其設為 null
          addPopcorn: addPopcorn ?? false,  // 如果 addPopcorn 為 null 或 undefined，將其設為 false
          pageId,
          drink: drink
        };
      }
    });
    return userVotes;
  }
  
