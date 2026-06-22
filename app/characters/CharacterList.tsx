'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import ScrollButtons from '../components/ScrollButtons';
import { useCharacters } from '../hooks/useCharacters';
import styles from './CharacterList.module.css';

export default function CharacterList({ tmdbWorks }: { tmdbWorks: any[] }) {
  const [selectedCharacter, setSelectedCharacter] = useState<any | null>(null);

  const {
    viewMode, handleToggleView,
    showAttributes, setShowAttributes,
    watchStatusFilter, setWatchStatusFilter, 
    characters, groupedCharacters, groupKeys
  } = useCharacters(tmdbWorks);

  const handleAttributeClick = (attr: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setSelectedCharacter(null); 
    if (!showAttributes) {
      setShowAttributes(true);
      setTimeout(() => {
        const el = document.getElementById(`attr-group-${attr}`);
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 80; 
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    } else {
      const el = document.getElementById(`attr-group-${attr}`);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  const renderCharacterGrid = (charList: any[]) => (
    <div className={styles.characterGrid}>
      {charList.map((char, index) => (
        <div 
          key={`${char.workTitle}-${index}`} 
          onClick={() => setSelectedCharacter(char)}
          style={{ backgroundColor: '#222', borderRadius: '12px', padding: 'var(--card-padding)', textAlign: 'center', transition: 'transform 0.2s', cursor: 'pointer', position: 'relative' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ 
            width: 'var(--image-size)', height: 'var(--image-size)', margin: '0 auto 15px auto', borderRadius: '50%', 
            overflow: 'hidden', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
          }}>
            {char.charImage ? (
              <img src={char.charImage} alt={char.charName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '40px' }}>🎭</span>
            )}
          </div>

          <h2 style={{ fontSize: 'var(--title-size)', margin: '0 0 8px 0', color: '#ff9f43' }}>
            {char.charName}
          </h2>
          <p style={{ fontSize: 'var(--subtitle-size)', color: '#888', margin: 0 }}>
            {char.displayWorkTitle}
          </p>

          {showAttributes && char.attributes && char.attributes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '12px' }}>
              {char.attributes.map((attr: string, i: number) => (
                <span key={i} className={styles.attrBadge} onClick={(e) => handleAttributeClick(attr, e)} style={{ backgroundColor: '#ff9f43', color: '#1a1a1a', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                  {attr}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderCharacterTimeline = (charList: any[]) => (
    <div className={styles.timelineContainer}>
      {charList.map((char, index) => (
        <div key={`${char.workTitle}-${index}`} className={styles.timelineItem}>
          <div className={styles.timelineDot}></div>
          <div className={styles.timelineContent} onClick={() => setSelectedCharacter(char)}>
            {char.charImage ? (
              <img src={char.charImage} alt={char.charName} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #333' }} />
            ) : (
              <div style={{ width: '60px', height: '60px', backgroundColor: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '24px' }}>🎭</div>
            )}
            <div>
              <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '5px', fontSize: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span>{char.year !== '年不明' ? `${char.year}年` : '公開年不明'}</span>
                {char.age !== '不明' && <span style={{ color: '#4dabf7', fontSize: '13px' }}>(当時 {char.age}歳)</span>}
              </div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#ff9f43', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {char.charName}
                {showAttributes && char.attributes && char.attributes.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {char.attributes.map((attr: string, i: number) => (
                      <span key={i} className={styles.attrBadge} onClick={(e) => handleAttributeClick(attr, e)} style={{ backgroundColor: '#ff9f43', color: '#1a1a1a', fontSize: '11px', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' }}>
                        {attr}
                      </span>
                    ))}
                  </div>
                )}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>作品: {char.displayWorkTitle}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <main className={styles.container}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h1 style={{ fontSize: '32px', margin: 0 }}>キャラクターリスト</h1>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link href="/character-sort" className={styles.toggleBtn} style={{ backgroundColor: '#ff9f43', color: '#fff', border: '1px solid #ff9f43' }}>🏆 投票で遊ぶ</Link>
              <button className={styles.toggleBtn} onClick={handleToggleView}>
                {viewMode === 'grid' ? '📅 タイムライン表示' : '🔲 グリッド表示'}
              </button>
              <button className={`${styles.toggleBtn} ${showAttributes ? styles.active : ''}`} onClick={() => setShowAttributes(!showAttributes)}>
                {showAttributes ? '🏷️ 属性をオフ' : '🏷️ 属性でカテゴライズ'}
              </button>

              <select 
                value={watchStatusFilter} 
                onChange={(e) => setWatchStatusFilter(e.target.value)} 
                style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                <option value="ALL">すべて</option>
                <option value="WATCHED">視聴済のみ</option>
                <option value="UNWATCHED">未視聴のみ</option>
              </select>
            </div>
          </div>
          <Link href="/" style={{ color: '#ff9f43', textDecoration: 'none', padding: '8px 16px', backgroundColor: '#222', borderRadius: '8px' }}>← 作品リストに戻る</Link>
        </div>

        <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '15px' }}>
          カードをクリックすると詳細が表示されます（現在 {characters.length} 人を表示中）
        </p>

        {showAttributes ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {groupKeys.map(attr => groupedCharacters[attr].length > 0 && (
              <div key={attr} id={`attr-group-${attr}`} style={{ border: '2px dashed #444', borderRadius: '16px', padding: '35px 20px 20px', position: 'relative', scrollMarginTop: '20px' }}>
                <span style={{ position: 'absolute', top: '-14px', left: '20px', backgroundColor: '#444', color: '#fff', padding: '4px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px', border: '1px solid #555' }}>
                  🏷️ {attr} ({groupedCharacters[attr].length})
                </span>
                {viewMode === 'grid' ? renderCharacterGrid(groupedCharacters[attr]) : renderCharacterTimeline(groupedCharacters[attr])}
              </div>
            ))}
          </div>
        ) : (
          viewMode === 'grid' ? renderCharacterGrid(characters) : renderCharacterTimeline(characters)
        )}
      </div>

      {selectedCharacter && (
        <div onClick={() => setSelectedCharacter(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '16px', maxWidth: '500px', width: '100%', position: 'relative', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => setSelectedCharacter(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer', zIndex: 10 }}>✕</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexShrink: 0 }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {selectedCharacter.charImage ? <img src={selectedCharacter.charImage} alt={selectedCharacter.charName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '30px' }}>🎭</span>}
              </div>
              <div>
                <h2 style={{ color: '#ff9f43', margin: '0 0 5px 0', fontSize: '24px' }}>{selectedCharacter.charName}</h2>
                <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
                  作品: {selectedCharacter.displayWorkTitle}
                </p>
              </div>
            </div>
            {selectedCharacter.fullDescription && (
              <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '12px', overflowY: 'auto' }}>
                <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#ddd', whiteSpace: 'pre-wrap', margin: 0 }}>{selectedCharacter.fullDescription}</p>
              </div>
            )}
          </div>
        </div>
      )}
      <ScrollButtons />
    </main>
  );
}