'use client';
import React from 'react';
import styles from '../../characters/CharacterList.module.css';

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

export default function CharacterGridView({
  characters, favoriteChars, onToggleFavorite, onCharacterClick, showAttributes, onAttributeClick, getCharKey, getCustomWorkTitle
}: Props) {
  return (
    <div className={styles.characterGrid}>
      {characters.map((char, index) => {
        const customTitle = getCustomWorkTitle(char);
        const isFav = favoriteChars.includes(getCharKey(char));

        return (
          <div key={`${char.workTitle}-${index}`} onClick={() => onCharacterClick(char)} className={styles.card}>
            <button 
              onClick={(e) => onToggleFavorite(char, e)}
              className={`${styles.favButton} ${isFav ? styles.favActive : ''}`}
              title="お気に入り"
            >
              {isFav ? '★' : '☆'}
            </button>

            <div style={{ 
              width: 'var(--image-size)', height: 'var(--image-size)', margin: '0 auto 16px auto', borderRadius: '50%', 
              overflow: 'hidden', backgroundColor: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 20px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.05)'
            }}>
              {char.charImage ? (
                <img src={char.charImage} alt={char.charName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '40px', opacity: 0.5 }}>🎭</span>
              )}
            </div>

            <h2 style={{ fontSize: 'var(--title-size)', margin: '0 0 6px 0', color: '#d4af37', fontWeight: '600' }}>
              {(char.charName.includes('Scrooge McDuck') || char.charName.includes('スクルージ')) ? 'スクルージ・マクダック' : char.charName}
            </h2>
            <p style={{ fontSize: 'var(--subtitle-size)', color: '#888', margin: 0, letterSpacing: '0.05em' }}>
              {customTitle}
            </p>

            {showAttributes && char.attributes && char.attributes.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', marginTop: '12px' }}>
                {char.attributes.map((attr: string, i: number) => (
                  <span key={i} className={styles.attrBadge} onClick={(e) => onAttributeClick(attr, e)}>{attr}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}