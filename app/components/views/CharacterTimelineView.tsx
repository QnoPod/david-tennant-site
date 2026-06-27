'use client';
import React from 'react';
import styles from '../../characters/CharacterList.module.css'; // 🌟 ../ から ../../ に修正

type Props = {
  characters: any[];
  favoriteChars: string[];
  onToggleFavorite: (char: any, e: React.MouseEvent) => void;
  onCharacterClick: (char: any) => void;
  showAttributes: boolean;
  onAttributeClick: (attr: string, e: React.MouseEvent) => void;
  getCharKey: (char: any) => string;
  getCustomWorkTitle: (char: any) => string;
};

export default function CharacterTimelineView({
  characters, favoriteChars, onToggleFavorite, onCharacterClick, showAttributes, onAttributeClick, getCharKey, getCustomWorkTitle
}: Props) {
  return (
    <div className={styles.timelineContainer}>
      {characters.map((char, index) => {
        const customTitle = getCustomWorkTitle(char);
        const isFav = favoriteChars.includes(getCharKey(char));

        return (
          <div key={`${char.workTitle}-${index}`} className={styles.timelineItem}>
            <div className={styles.timelineDot}></div>
            <div className={styles.timelineContent} onClick={() => onCharacterClick(char)}>
              
              <button 
                onClick={(e) => onToggleFavorite(char, e)}
                className={`${styles.favButton} ${isFav ? styles.favActive : ''}`}
                title="お気に入り"
              >
                {isFav ? '★' : '☆'}
              </button>

              {char.charImage ? (
                <img src={char.charImage} alt={char.charName} style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid #333' }} />
              ) : (
                <div style={{ width: '70px', height: '70px', backgroundColor: '#0a0a0c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '24px', opacity: 0.5 }}>🎭</div>
              )}
              <div>
                <div style={{ fontWeight: '500', color: '#eaeaea', marginBottom: '6px', fontSize: '13px', letterSpacing: '0.05em' }}>
                  {char.year !== '年不明' ? `${char.year}年` : '公開年不明'}
                  {char.age !== '不明' && (
                    <span style={{ color: '#20b2aa', marginLeft: '8px', fontSize: '11px' }}>(当時 {char.age}歳)</span>
                  )}
                </div>
                <h3 className={styles.timelineTitle}>
                  {(char.charName.includes('Scrooge McDuck') || char.charName.includes('スクルージ')) ? 'スクルージ・マクダック' : char.charName}
                  
                  {showAttributes && char.attributes && char.attributes.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {char.attributes.map((attr: string, i: number) => (
                        <span key={i} className={styles.attrBadge} onClick={(e) => onAttributeClick(attr, e)}>{attr}</span>
                      ))}
                    </div>
                  )}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                  {customTitle}
             </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}