import type { Work } from "../lib/types";

/**
 * TMDBの画像ではなく、public/works内のローカル画像を使う作品を管理します。
 * 左側には原題またはTMDBから取得される邦題を指定してください。
 */
export const workImageOverrides: Record<string, Pick<Work, "posterUrl" | "backdropUrl">> = {
  "Randall & Hopkirk (Deceased)": {
    posterUrl: "/works/Randall & Hopkirk.jpg",
  },
   "The Deputy": {
    posterUrl: "/works/The Deputy.jpg",
  },
   "Doctor Who: Rise of the Cybermen & The Age of Steel": {
    posterUrl: "/works/Doctor Who Rise of the Cybermen & The Age of Steel.jpg",
  },
   "Doctor Who: The Impossible Planet & The Satan Pit": {
    posterUrl: "/works/Doctor Who The Impossible Planet & The Satan Pit.jpg",
  },
  "The Science of Doctor Who": {
    posterUrl: "/works/The Science of Doctor Who.png",
  },
    "The Stolen Earth / Journey's End": {
    posterUrl: "/works/The Stolen Earth  Journey's End.jpg",
  },
    "Doctor Who: Daleks in Manhattan & Evolution of the Daleks": {
    posterUrl: "/works/Doctor Who Daleks in Manhattan & Evolution of the Daleks.jpg",
  },
    "Doctor Who: The Sontaran Stratagem & The Poison Sky": {
    posterUrl: "/works/Doctor Who The Sontaran Stratagem & The Poison Sky.jpg",
  },
    "The British Academy Film Awards": {
    posterUrl: "/works/The British Academy Film Awards.jpg",
  },
    "The Muppets Take The O2": {
    posterUrl: "/works/The Muppets Take The O2.jpg",
  },
    "National Television Awards": {
    posterUrl: "/works/National Television Awards.png",
  },
    "The Jonathan Ross Show": {
    posterUrl: "/works/The Jonathan Ross Show.jpg",
  },
    "My Sarah Jane: A Tribute to Elisabeth Sladen": {
    posterUrl: "/works/My Sarah Jane A Tribute to Elisabeth Sladen.jpg",
  },
    "Lachlan Macquarie: The Father of Australia": {
    posterUrl: "/works/Lachlan Macquarie The Father of Australia.jpg",
  },
    "Doctor Who: Farewell to Matt Smith": {
    posterUrl: "/works/Doctor Who Farewell to Matt Smith.jpg",
  },
    "Doctor Who: Human Nature & The Family of Blood": {
    posterUrl: "/works/Doctor Who Human Nature & The Family of Blood.jpg",
  },
  
};
