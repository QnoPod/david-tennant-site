"use client";

import Modal from "../components/Modal";
import RelatedLinks from "../components/RelatedLinks";
import { findRelatedInterviews } from "../lib/relatedContent";
import type { Character } from "../lib/types";
import { normalizeText } from "../lib/workPresentation";

/** カード選択時だけ読み込むキャラクター詳細。一覧の初期JavaScriptを小さく保ちます。 */
export default function CharacterDetailModal({ character, onClose }: { character: Character; onClose: () => void }) {
  const relatedInterviews = findRelatedInterviews([
    character.workTitle,
    character.displayWorkTitle,
    character.name,
    character.englishName,
  ]);

  return <Modal open onClose={onClose} label={`${character.name}の詳細`}>
    <div className="character-detail-content"><div className="detail-layout detail-layout--character"><img src={character.image} alt={character.name} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.src = "/images/default-character.jpg"; }} /><div><p className="eyebrow">{character.year} · CHARACTER FILE</p><h2>{character.name}</h2>{character.englishName && normalizeText(character.englishName) !== normalizeText(character.name) && <p className="character-english-name">{character.englishName}</p>}<p className="detail-subtitle">{character.displayWorkTitle}</p><div className="tag-row">{character.attributes.map((item) => <span key={item}>{item}</span>)}</div><p className="detail-copy">{character.description}</p></div></div><RelatedLinks title="関連情報" items={[{ href: `/works?character=${encodeURIComponent(character.name)}`, title: character.displayWorkTitle, meta: "出演作品", description: `${character.name}の役名でWORKSを検索` }, ...relatedInterviews.map((interview) => ({ href: `/interviews/${interview.slug}`, title: interview.title, meta: `${interview.year} · ${interview.source}`, description: interview.titleEn }))]} /></div>
  </Modal>;
}
