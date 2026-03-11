// 庭の状態管理ストア

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GardenState, GardenFlower, GardenTree, GardenActions } from '../types/garden';

// ユーティリティ関数
function calculateTimeOfDay(): GardenState['time_of_day'] {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getSeason(): GardenState['season'] {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function createRandomFlower(index: number, storyId?: string): GardenFlower {
  const flowerTypes = ['cherry', 'camellia', 'plum', 'cosmos', 'hydrangea', 'daisy'];
  const colors = ['#FFB7C5', '#FF6B9D', '#FFD700', '#87CEEB', '#DDA0DD', '#98FB98'];

  return {
    id: `flower-${Date.now()}-${index}`,
    type: flowerTypes[Math.floor(Math.random() * flowerTypes.length)],
    position: {
      x: 30 + Math.random() * 340,
      y: 120 + Math.random() * 50,
    },
    size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)] as GardenFlower['size'],
    color: colors[Math.floor(Math.random() * colors.length)],
    bloomed_at: new Date().toISOString(),
    story_id: storyId,
  };
}

function createRandomTree(index: number): GardenTree {
  const treeTypes: GardenTree['type'][] = ['maple', 'pine', 'ginkgo', 'cherry'];

  return {
    id: `tree-${Date.now()}-${index}`,
    type: treeTypes[Math.floor(Math.random() * treeTypes.length)],
    position: {
      x: 50 + Math.random() * 300,
      y: 80,
    },
    growth_stage: 'sapling',
    story_count: 0,
  };
}

type GardenStore = GardenState & GardenActions;

export const useGardenStore = create<GardenStore>()(
  persist(
    (set, get) => ({
      growth_level: 0,
      flowers: [],
      trees: [],
      season: getSeason(),
      time_of_day: calculateTimeOfDay(),
      last_updated: new Date().toISOString(),

      growGarden: (storyCount: number) => {
        const state = get();
        const newGrowthLevel = Math.min(100, storyCount * 2);

        const newFlowers = [...state.flowers];
        if (storyCount > 0 && storyCount % 5 === 0 && storyCount / 5 > state.flowers.length) {
          newFlowers.push(createRandomFlower(newFlowers.length));
        }

        const newTrees = [...state.trees];
        if (storyCount >= 20 && Math.floor(storyCount / 20) > state.trees.length) {
          newTrees.push(createRandomTree(newTrees.length));
        }

        // 既存の木を成長させる
        const grownTrees = newTrees.map(tree => ({
          ...tree,
          growth_stage: tree.growth_stage === 'sapling' && tree.story_count >= 10 ? 'young' :
                        tree.growth_stage === 'young' && tree.story_count >= 30 ? 'mature' :
                        tree.growth_stage,
          story_count: tree.story_count + 1,
        }));

        set({
          growth_level: newGrowthLevel,
          flowers: newFlowers,
          trees: grownTrees,
          last_updated: new Date().toISOString(),
        });
      },

      updateSeason: () => {
        set({ season: getSeason() });
      },

      updateTimeOfDay: () => {
        set({ time_of_day: calculateTimeOfDay() });
      },

      addFlower: (flower: GardenFlower) => {
        set((state) => ({
          flowers: [...state.flowers, flower],
          last_updated: new Date().toISOString(),
        }));
      },

      addTree: (tree: GardenTree) => {
        set((state) => ({
          trees: [...state.trees, tree],
          last_updated: new Date().toISOString(),
        }));
      },
    }),
    {
      name: 'garden-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
