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
};
