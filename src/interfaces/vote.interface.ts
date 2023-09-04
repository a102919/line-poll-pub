export type VoteOptions = "A" | "B" | "popcorn" | "popcornCancel" | "drink" | "drinkCancel" | "drinkMenu" | null;

export interface UserData {
    pageId: string;
    userName: string;
    choice: VoteOptions;
    addPopcorn: boolean;
    drink: string|undefined;
    userId?: string;
}

// userVotes
export interface UserVotes {
    [userId: string]: UserData;
}
