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
  
};
