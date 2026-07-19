import type { InterviewSummary } from "./types";

/**
 * GitHub Actionsが自動生成する、公開判断前のインタビュー候補です。
 * 初期状態は isPublished: false なので一般ページには表示されません。
 * 公開時は内容を確認し、isPublished: true／reviewStatus: "approved"へ変更します。
 */
export const autoInterviewCandidates: readonly InterviewSummary[] = [];
