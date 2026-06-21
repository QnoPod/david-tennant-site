// data/updates.ts

export type UpdateInfo = {
  date: string;
  content: string;
  isImportant?: boolean; // 🌟 trueにすると文字を目立たせることができます
};

export const siteUpdates: UpdateInfo[] = [
  {
    date: "2026.06.21",
    content: "キャラクターリストを属性ごとにグループ化・表示切替できるようになりました。",
    isImportant: true,
  },
  {
    date: "2026.06.21",
    content: "タイムライン表示機能を追加しました。作品一覧とキャラクターリストの両方で、歴史を追えるようになります。",
  },
  {
    date: "2026.06.21",
    content: "キャラクター投票機能をお試し追加しました。",
  },
　{
    date: "2026.06.20",
    content: "キャラクターリストを更新しました。",
  },
  {
    date: "2026.06.20",
    content: "キャラクターで検索できるようになりました。",
  },
  {
    date: "2026.06.20",
    content: "邦題と原題で作品検索が可能になりました。",
  },
];