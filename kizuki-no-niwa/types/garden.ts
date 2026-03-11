// 庭の状態型定義

export interface GardenState {
  growth_level: number;    // 0-100
  flowers: GardenFlower[];
  trees: GardenTree[];
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  last_updated: string;
}

export interface GardenFlower {
  id: string;
  type: string; // 'cherry', 'camellia', 'plum', 'cosmos', 'hydrangea', etc.
  position: { x: number; y: number };
  size: 'small' | 'medium' | 'large';
  color: string;
  bloomed_at?: string;
  story_id?: string;
}

export interface GardenTree {
  id: string;
  type: 'maple' | 'pine' | 'ginkgo' | 'cherry';
  position: { x: number; y: number };
  growth_stage: 'sapling' | 'young' | 'mature';
  story_count: number;
}

export interface GardenAmbientElement {
  id: string;
  type: 'butterfly' | 'bird' | 'firefly' | 'falling_leaf' | 'sunbeam';
  position: { x: number; y: number };
  visible: boolean;
}

// GardenStore のアクション
export interface GardenActions {
  growGarden: (storyCount: number) => void;
  updateSeason: () => void;
  updateTimeOfDay: () => void;
  addFlower: (flower: GardenFlower) => void;
  addTree: (tree: GardenTree) => void;
}
