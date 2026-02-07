export interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  xp: number;
}

// Mock Social API
export const SocialAPI = {
  getFriends: async (): Promise<Friend[]> => {
    return [
      { id: '1', name: 'Alice', avatar: '/avatars/1.png', status: 'online', xp: 1200 },
      { id: '2', name: 'Bob', avatar: '/avatars/2.png', status: 'offline', xp: 800 },
    ];
  },

  addFriend: async (friendId: string): Promise<boolean> => {
    console.log(`Friend request sent to ${friendId}`);
    return true;
  },

  removeFriend: async (friendId: string): Promise<boolean> => {
    console.log(`Removed friend ${friendId}`);
    return true;
  }
};
