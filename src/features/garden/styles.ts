import { useSyncExternalStore } from "react";

import artDeco from "@/assets/garden/art-deco.jpg";
import cottage from "@/assets/garden/cottage.jpg";
import impressionist from "@/assets/garden/impressionist.jpg";
import mediterranean from "@/assets/garden/mediterranean.jpg";
import modern from "@/assets/garden/modern-botanical.jpg";

/**
 * Garden styles are pure configuration: an environment painting plus how
 * each kind of object is drawn. User data (goals, habits, memories, years)
 * never knows which style is showing — add a style here and it just works.
 */
export type GardenStyleId = "cottage" | "impressionist" | "art-deco" | "modern-botanical" | "mediterranean";

export type FlowerRender = "cottage" | "painterly" | "deco" | "modern" | "sunlit";
export type TreeRender = "oak" | "dabbed" | "fan" | "birch" | "olive";
export type HiveRender = "skep" | "stepped" | "box" | "terracotta";

export type GardenStyle = {
  id: GardenStyleId;
  label: string;
  blurb: string;
  image: string;
  flower: FlowerRender;
  tree: TreeRender;
  hive: HiveRender;
  /** Where the painted lawn begins, as a share of scene height — objects sit below it. */
  horizon: number;
};

export const gardenStyles: GardenStyle[] = [
  { id: "cottage", label: "English cottage", blurb: "Stone walls, foxgloves and a lawn that's lived in.", image: cottage, flower: "cottage", tree: "oak", hive: "skep", horizon: 0.55 },
  { id: "impressionist", label: "Impressionist", blurb: "Soft light and brushstrokes by a quiet pond.", image: impressionist, flower: "painterly", tree: "dabbed", hive: "skep", horizon: 0.6 },
  { id: "art-deco", label: "Art Deco", blurb: "Sunbursts, fan trees and gold-lined order.", image: artDeco, flower: "deco", tree: "fan", hive: "stepped", horizon: 0.56 },
  { id: "modern-botanical", label: "Modern botanical", blurb: "Grasses, clean lines and calm green space.", image: modern, flower: "modern", tree: "birch", hive: "box", horizon: 0.58 },
  { id: "mediterranean", label: "Mediterranean", blurb: "Olive trees, terracotta and warm evening light.", image: mediterranean, flower: "sunlit", tree: "olive", hive: "terracotta", horizon: 0.6 },
];

export const DEFAULT_GARDEN_STYLE: GardenStyleId = "cottage";

export function getGardenStyle(id: string | null | undefined): GardenStyle {
  return gardenStyles.find((s) => s.id === id) ?? gardenStyles.find((s) => s.id === DEFAULT_GARDEN_STYLE)!;
}

const KEY = "bloom.garden.style.v1";
const listeners = new Set<() => void>();

function read(): GardenStyleId {
  try {
    return getGardenStyle(localStorage.getItem(KEY)).id;
  } catch {
    return DEFAULT_GARDEN_STYLE;
  }
}

export function setGardenStyle(id: GardenStyleId) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useGardenStyle(): GardenStyle {
  const id = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => DEFAULT_GARDEN_STYLE,
  );
  return getGardenStyle(id);
}
