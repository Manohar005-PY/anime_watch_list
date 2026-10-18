export interface CuratedAnime {
  id: string;
  title: string;
  romaji: string;
  native: string;
  year: number;
  episodes: number;
  cover: string;
  banner?: string;
  studio: string;
  genres: string[];
  score: number;
  tagline?: string;
  director?: string;
}

export const CURATED_CLASSICS: CuratedAnime[] = [
  {
    id: "1",
    title: "Cowboy Bebop",
    romaji: "Cowboy Bebop",
    native: "カウボーイビバップ",
    year: 1998,
    episodes: 26,
    cover: "/images/hero/cowboy-bebop.png",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/1-OquNCNB6srGe.jpg",
    studio: "Sunrise",
    genres: ["Sci-Fi", "Action", "Adventure"],
    score: 86,
    tagline: "3, 2, 1, Let's Jam.",
    director: "Shinichiro Watanabe"
  },
  {
    id: "30",
    title: "Neon Genesis Evangelion",
    romaji: "Shin Seiki Evangelion",
    native: "新世紀エヴァンゲリオン",
    year: 1995,
    episodes: 26,
    cover: "/images/hero/evangelion.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/30-gEMoHHIqxDgN.jpg",
    studio: "GAINAX",
    genres: ["Mecha", "Psychological", "Drama"],
    score: 83,
    tagline: "God's in his heaven, all's right with the world.",
    director: "Hideaki Anno"
  },
  {
    id: "467",
    title: "Ghost in the Shell: S.A.C.",
    romaji: "Koukaku Kidoutai: STAND ALONE COMPLEX",
    native: "攻殻機動隊 STAND ALONE COMPLEX",
    year: 2002,
    episodes: 26,
    cover: "/images/hero/ghost-in-the-shell.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/467-n0kTT3ecHMrG.jpg",
    studio: "Production I.G",
    genres: ["Cyberpunk", "Action", "Mystery"],
    score: 82,
    tagline: "Where does the human mind end and the net begin?",
    director: "Kenji Kamiyama"
  },
  {
    id: "339",
    title: "Serial Experiments Lain",
    romaji: "serial experiments lain",
    native: "serial experiments lain",
    year: 1998,
    episodes: 13,
    cover: "/images/hero/lain.png",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/339-Lh0tuuwRLRgI.jpg",
    studio: "Triangle Staff",
    genres: ["Psychological", "Mystery", "Sci-Fi"],
    score: 80,
    tagline: "Close the world, open the nExt.",
    director: "Ryutaro Nakamura"
  },
  {
    id: "47",
    title: "Akira",
    romaji: "AKIRA",
    native: "AKIRA",
    year: 1988,
    episodes: 1,
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx47-4CR68arv452h.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/47-fof8HqtNDtvx.jpg",
    studio: "Tokyo Movie Shinsha",
    genres: ["Sci-Fi", "Action", "Horror"],
    score: 79,
    tagline: "Neo-Tokyo is about to E.X.P.L.O.D.E.",
    director: "Katsuhiro Otomo"
  },
  {
    id: "205",
    title: "Samurai Champloo",
    romaji: "Samurai Champloo",
    native: "サムライチャンプルー",
    year: 2004,
    episodes: 26,
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx205-7tHVFu6dPBm9.png",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/205-L7WpOOWUmVjh.jpg",
    studio: "Manglobe",
    genres: ["Action", "Adventure", "Hip-Hop"],
    score: 84,
    tagline: "Sharp swords, hip-hop beats, and wandering ronin.",
    director: "Shinichiro Watanabe"
  },
  {
    id: "19",
    title: "Monster",
    romaji: "MONSTER",
    native: "MONSTER",
    year: 2004,
    episodes: 74,
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx19-gtMC64182sm4.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/19-kJhwsB0Z97tL.jpg",
    studio: "MADHOUSE",
    genres: ["Psychological", "Mystery", "Thriller"],
    score: 88,
    tagline: "The only thing humans are truly equal in is death.",
    director: "Masayuki Kojima"
  },
  {
    id: "437",
    title: "Perfect Blue",
    romaji: "PERFECT BLUE",
    native: "PERFECT BLUE",
    year: 1998,
    episodes: 1,
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx437-69NMlXKFeuse.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/437-3yMVTyN7gl2A.jpg",
    studio: "MADHOUSE",
    genres: ["Psychological", "Mystery", "Drama"],
    score: 85,
    tagline: "Excuse me, who are you?",
    director: "Satoshi Kon"
  },
  {
    id: "5114",
    title: "Fullmetal Alchemist: Brotherhood",
    romaji: "Hagane no Renkinjutsushi",
    native: "鋼の錬金術師 FULLMETAL ALCHEMIST",
    year: 2009,
    episodes: 64,
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx5114-nSWCgQlmOMtj.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/5114-q0V5URebphSG.jpg",
    studio: "Bones",
    genres: ["Fantasy", "Action", "Adventure"],
    score: 90,
    tagline: "Equivalent exchange is the law of the universe.",
    director: "Yasuhiro Irie"
  },
  {
    id: "164",
    title: "Princess Mononoke",
    romaji: "Mononoke-hime",
    native: "もののけ姫",
    year: 1997,
    episodes: 1,
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx164-ySuGzCWVw2cL.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/164-Aj6MINy7VTfs.jpg",
    studio: "Studio Ghibli",
    genres: ["Adventure", "Fantasy", "Action"],
    score: 85,
    tagline: "The fate of the world rests on the courage of one warrior.",
    director: "Hayao Miyazaki"
  },
  {
    id: "227",
    title: "FLCL",
    romaji: "FLCL",
    native: "フリクリ",
    year: 2000,
    episodes: 6,
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx227-qOB9ZhVvNnqO.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/227.jpg",
    studio: "GAINAX",
    genres: ["Comedy", "Sci-Fi", "Avant-Garde"],
    score: 79,
    tagline: "Nothing amazing happens here. Everything is ordinary.",
    director: "Kazuya Tsurumaki"
  },
  {
    id: "120377",
    title: "Cyberpunk: Edgerunners",
    romaji: "Cyberpunk: Edgerunners",
    native: "サイバーパンク エッジランナーズ",
    year: 2022,
    episodes: 10,
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx120377-ayZPoxiWt4Li.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/120377-c15oLS8CA31s.jpg",
    studio: "TRIGGER",
    genres: ["Action", "Sci-Fi", "Cyberpunk"],
    score: 85,
    tagline: "Stay in your chrome, choom.",
    director: "Hiroyuki Imaishi"
  }
];
