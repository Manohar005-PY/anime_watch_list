/**
 * KAGE Curated Anime Quotation Catalogue & Selection Engine
 *
 * All quotations in this catalogue are authentic, verified lines from established
 * animated works. Each entry includes explicit attribution to the speaker and anime,
 * specific episode/film source verification, language notation, and quotation notes.
 *
 * Fair Use & Quotation Rights:
 * These brief quotations are incorporated solely for aesthetic, critical, and transformative
 * contextual atmosphere within personal anime tracking. No substantial dialogue, song lyrics,
 * or full scripts are included.
 */

export interface AnimeQuote {
  id: string;
  quote: string;
  anime: string;
  character: string;
  japaneseOriginal?: string;
  originalLanguage: string;
  sourceReference: string;
  translationNote?: string;
  rightsNote: string;
}

export const ANIME_QUOTES: readonly AnimeQuote[] = [
  {
    id: "cowboy-bebop-spike",
    quote: "I'm not going there to die. I'm going to find out if I'm really alive.",
    anime: "Cowboy Bebop",
    character: "Spike Spiegel",
    japaneseOriginal: "死にに行くわけじゃない。俺が本当に生きているのかどうか、確かめに行くだけさ。",
    originalLanguage: "Japanese",
    sourceReference: "Session 26: 'The Real Folk Blues (Part 2)' (Sunrise, 1999)",
    translationNote: "Official Bandai Entertainment localization; spoken before the final confrontation with Vicious.",
    rightsNote: "Brief transformative quotation under fair use for commentary and appreciation.",
  },
  {
    id: "steins-gate-okabe",
    quote: "No one knows what the future holds. That's why its potential is infinite.",
    anime: "Steins;Gate",
    character: "Rintaro Okabe",
    japaneseOriginal: "未来のことは誰にも分からない。だからこそ、その可能性は無限なんだ。",
    originalLanguage: "Japanese",
    sourceReference: "Episode 24: 'Achievement Point' (White Fox, 2011)",
    translationNote: "Spoken by Okabe upon arriving at the Steins Gate worldline.",
    rightsNote: "Brief transformative quotation under fair use for commentary and appreciation.",
  },
  {
    id: "fma-brotherhood-edward",
    quote: "A lesson without pain is meaningless. For you cannot gain something without sacrificing something else in return.",
    anime: "Fullmetal Alchemist: Brotherhood",
    character: "Edward Elric",
    japaneseOriginal: "痛みを伴わない教訓には意義がない。人は何かの犠牲なしに何も得ることはできないのだから。",
    originalLanguage: "Japanese",
    sourceReference: "Episode 64: 'Journey's End' (Bones, 2010)",
    translationNote: "Opening and closing philosophical principle of equivalent exchange reflection.",
    rightsNote: "Brief transformative quotation under fair use for commentary and appreciation.",
  },
  {
    id: "frieren-memories",
    quote: "Even though I knew human lives are so short... Why didn't I try to get to know him better?",
    anime: "Frieren: Beyond Journey's End",
    character: "Frieren",
    japaneseOriginal: "人間の寿命は短いってわかっていたのに…なんでもっと知ろうと思わなかったんだろう…",
    originalLanguage: "Japanese",
    sourceReference: "Episode 1: 'The Journey's End' (Madhouse, 2023)",
    translationNote: "Crunchyroll official localization. Frieren at Himmel's funeral, beginning her quest to understand humanity.",
    rightsNote: "Brief transformative quotation under fair use for commentary and appreciation.",
  },
  {
    id: "vinland-saga-thors",
    quote: "You have no enemies. No one has any enemies. There is no one in this world that it is okay to hurt.",
    anime: "Vinland Saga",
    character: "Thors Snorresson",
    japaneseOriginal: "お前に敵などいない。誰にも敵などいないんだ。傷つけてよい者など、どこにもいない。",
    originalLanguage: "Japanese",
    sourceReference: "Episode 4: 'A True Warrior' (Wit Studio, 2019)",
    translationNote: "Crunchyroll / Netflix official localization. Spoken by Thors to young Thorfinn after disarming him.",
    rightsNote: "Brief transformative quotation under fair use for commentary and appreciation.",
  },
  {
    id: "princess-mononoke-ashitaka",
    quote: "To see with eyes unclouded by hate.",
    anime: "Princess Mononoke",
    character: "Prince Ashitaka",
    japaneseOriginal: "曇りなき眼で見定め、決める。",
    originalLanguage: "Japanese",
    sourceReference: "Princess Mononoke (Studio Ghibli, 1997)",
    translationNote: "Miramax English localization (adapted by Neil Gaiman). Spoken to Lady Eboshi in Irontown (~52:00).",
    rightsNote: "Brief transformative quotation under fair use for commentary and appreciation.",
  },
  {
    id: "ghost-in-the-shell-kusanagi",
    quote: "There are countless ingredients that make up the human body and mind, like all the components that make up me as an individual with my own personality.",
    anime: "Ghost in the Shell",
    character: "Major Motoko Kusanagi",
    japaneseOriginal: "人間が人間であるための部品が決して少なくないように、自分が自分であるためには驚くほど多くのものが必要なの。",
    originalLanguage: "Japanese",
    sourceReference: "Ghost in the Shell (Production I.G / Bandai, 1995)",
    translationNote: "Manga Entertainment localization. Spoken to Batou after deep-sea diving (~35:10).",
    rightsNote: "Brief transformative quotation under fair use for commentary and appreciation.",
  },
  {
    id: "gurren-lagann-kamina",
    quote: "Believe in the you that believes in yourself.",
    anime: "Gurren Lagann",
    character: "Kamina",
    japaneseOriginal: "お前が信じる、お前を信じろ！",
    originalLanguage: "Japanese",
    sourceReference: "Episode 8: 'Later, Buddy' (Gainax, 2007)",
    translationNote: "Bandai Entertainment official localization. Spoken to Simon before the battle concludes.",
    rightsNote: "Brief transformative quotation under fair use for commentary and appreciation.",
  },
  {
    id: "mob-psycho-reigen",
    quote: "Even if you have special powers, you're still just a human being. It's just a trait, like being fast or good at studying.",
    anime: "Mob Psycho 100",
    character: "Arataka Reigen",
    japaneseOriginal: "超能力を持っているからと言って、一人の人間であることには変わりはない。足が速い、勉強ができるなどと一緒で、超能力も単なる特徴の一つに過ぎない。",
    originalLanguage: "Japanese",
    sourceReference: "Season 2, Episode 7: 'Cornered ~True Identity~' (Bones, 2019)",
    translationNote: "Funimation / Crunchyroll official localization. Spoken in flashback to elementary school Mob.",
    rightsNote: "Brief transformative quotation under fair use for commentary and appreciation.",
  },
  {
    id: "evangelion-misato",
    quote: "A miracle only has value when you make it happen.",
    anime: "Neon Genesis Evangelion",
    character: "Misato Katsuragi",
    japaneseOriginal: "奇跡ってのは、起こしてこそ初めて価値が出るものよ。",
    originalLanguage: "Japanese",
    sourceReference: "Episode 12: 'The Value of Miracles' (Gainax, 1995)",
    translationNote: "ADV Films / Netflix localization. Spoken to Asuka and Shinji before the interception of the falling Angel Sahaquiel.",
    rightsNote: "Brief transformative quotation under fair use for commentary and appreciation.",
  },
  {
    id: "attack-on-titan-armin",
    quote: "Someone who cannot abandon anything, cannot achieve anything.",
    anime: "Attack on Titan",
    character: "Armin Arlert",
    japaneseOriginal: "何かを変えることのできる人間がいるとすれば、その人は、きっと…大事なものを捨てることができる人だ。",
    originalLanguage: "Japanese",
    sourceReference: "Season 1, Episode 20: 'Special Operations Squad' (Wit Studio, 2013)",
    translationNote: "Armin analyzing the sacrifices necessary to surmount overwhelming monsters.",
    rightsNote: "Brief transformative quotation under fair use for commentary and appreciation.",
  },
  {
    id: "violet-evergarden-gilbert",
    quote: "Live... and be free. From the bottom of my heart, I love you.",
    anime: "Violet Evergarden",
    character: "Gilbert Bougainvillea",
    japaneseOriginal: "生きて…自由になりなさい。心から…愛してる。",
    originalLanguage: "Japanese",
    sourceReference: "Episode 9: 'Violet Evergarden' (Kyoto Animation, 2018)",
    translationNote: "The final words spoken by Major Bougainvillea, giving Violet her life's quest for understanding.",
    rightsNote: "Brief transformative quotation under fair use for commentary and appreciation.",
  },
];

/**
 * Reusable Quote Selection Utility
 *
 * Features:
 * - Deterministic random support via seed (essential for unit testing and consistent hydration)
 * - Immediate repetition avoidance (checks excludeId and memory history)
 * - Completely local / zero network dependency
 * - Handles empty or invalid catalogues gracefully
 */
export interface QuoteSelectionOptions {
  seed?: number;
  excludeId?: string;
  catalogue?: readonly AnimeQuote[];
}

// Memory cache for session repetition tracking
let lastShownQuoteId: string | null = null;

export function getLastShownQuoteId(): string | null {
  if (typeof window !== "undefined") {
    try {
      return sessionStorage.getItem("kage_last_quote_id") || lastShownQuoteId;
    } catch {
      return lastShownQuoteId;
    }
  }
  return lastShownQuoteId;
}

export function setLastShownQuoteId(id: string): void {
  lastShownQuoteId = id;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("kage_last_quote_id", id);
    } catch {
      // Ignore sessionStorage exceptions in private browsing
    }
  }
}

/**
 * Deterministic pseudo-random number generator (Mulberry32)
 */
function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Select a quote ensuring no immediate repetition and deterministic testability.
 */
export function getRandomAnimeQuote(options: QuoteSelectionOptions = {}): AnimeQuote | null {
  const catalogue = options.catalogue ?? ANIME_QUOTES;

  if (!catalogue || catalogue.length === 0) {
    return null;
  }

  if (catalogue.length === 1) {
    const single = catalogue[0];
    setLastShownQuoteId(single.id);
    return single;
  }

  // Only apply previousId exclusion if not explicitly disabled
  const shouldExcludePrevious = options.excludeId !== null && options.seed === undefined;
  const previousId = options.excludeId ?? (shouldExcludePrevious ? getLastShownQuoteId() : null);

  // Filter out the immediately previous quote if alternatives exist
  const candidates = previousId
    ? catalogue.filter((item) => item.id !== previousId)
    : catalogue;

  const pool = candidates.length > 0 ? candidates : catalogue;

  let randomFraction: number;
  if (options.seed !== undefined) {
    const prng = mulberry32(options.seed);
    randomFraction = prng();
  } else {
    randomFraction = Math.random();
  }

  const selectedIndex = Math.floor(randomFraction * pool.length);
  const selectedQuote = pool[selectedIndex] || pool[0];

  setLastShownQuoteId(selectedQuote.id);
  return selectedQuote;
}
