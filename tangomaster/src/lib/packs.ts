export interface ContentPack {
  id: string;
  name: string;
  category: 'Travel' | 'Business' | 'IT' | 'General';
  difficulty: 1 | 2 | 3;
  wordCount: number;
  price: number; // in gems/coins
}

export const AVAILABLE_PACKS: ContentPack[] = [
  { id: 'travel_101', name: 'Airport Essentials', category: 'Travel', difficulty: 1, wordCount: 50, price: 0 },
  { id: 'biz_meeting', name: 'Boardroom Lingo', category: 'Business', difficulty: 2, wordCount: 120, price: 100 },
  { id: 'it_core', name: 'Full Stack Vocab', category: 'IT', difficulty: 3, wordCount: 200, price: 500 },
];

export const unlockPack = (packId: string, userGems: number) => {
  const pack = AVAILABLE_PACKS.find(p => p.id === packId);
  if (!pack) throw new Error('Pack not found');
  if (userGems < pack.price) throw new Error('Not enough gems');
  return true;
};
