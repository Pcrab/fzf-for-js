import { fuzzyMatchV2 } from "./algo";
import { Rune, strToRunes } from "./runes";
/*
  `Result` type needs to be imported otherwise TS will complain while generating types.
  See https://github.com/microsoft/TypeScript/issues/5711
  and https://github.com/microsoft/TypeScript/issues/9944.
*/
import type { Result } from "./algo";
import { makeSlab, SLAB_16_SIZE, SLAB_32_SIZE } from "./slab";

interface Options {
  cache: boolean;
  maxResultItems: number;
  // TODO we need different sort metric
  // sort: boolean;
}

const defaultOpts: Options = {
  cache: true,
  maxResultItems: Infinity,
};

export interface FzfResultItem {
  str: string;
  result: Result;
  pos: number[] | null;
}

type query = string;

const slab = makeSlab(SLAB_16_SIZE, SLAB_32_SIZE);

export class Fzf {
  private runesList: Rune[][];
  private strList: string[];
  readonly opts: Options;
  private cache: Record<query, FzfResultItem[]> = {};

  constructor(list: string[], options: Partial<Options> = defaultOpts) {
    this.opts = { ...defaultOpts, ...options };
    this.strList = list;
    this.runesList = list.map((item) => strToRunes(item));
  }

  find = (query: string): FzfResultItem[] => {
    let caseSensitive = false;
    // smartcase
    if (query.toLowerCase() !== query) {
      caseSensitive = true;
    }

    if (this.opts.cache) {
      const cachedResult = this.cache[query];
      if (cachedResult !== undefined) {
        return cachedResult;
      }
    }

    const runes = strToRunes(query);
    const getResult = (item: Rune[], index: number) => {
      const match = fuzzyMatchV2(
        caseSensitive,
        false,
        false,
        item,
        runes,
        true,
        slab
      );
      return { str: this.strList[index], result: match[0], pos: match[1] };
    };
    const thresholdFilter = (v: FzfResultItem) => v.result.score !== 0;
    let result = this.runesList.map(getResult).filter(thresholdFilter);

    const descScoreSorter = (a: FzfResultItem, b: FzfResultItem) =>
      b.result.score - a.result.score;
    result.sort(descScoreSorter);

    if (Number.isFinite(this.opts.maxResultItems)) {
      result = result.slice(0, this.opts.maxResultItems);
    }

    if (this.opts.cache) this.cache[query] = result;

    return result;
  };
}

export const fzfQuick = (query: string) => {
  let caseSensitive = false;
  // smartcase
  if (query.toLowerCase() !== query) {
    caseSensitive = true;
  }

  const runes = strToRunes(query);

  return (str: string) => {
    // TODO this conversion needs to be somewhere else
    const item = strToRunes(str);

    const match = fuzzyMatchV2(
      caseSensitive,
      false,
      false,
      item,
      runes,
      true,
      slab
    );
    return { str, result: match[0], pos: match[1] };
  };
};
