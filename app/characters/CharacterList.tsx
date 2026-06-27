'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ScrollButtons from '../components/ScrollButtons';
import { useCharacters } from '../hooks/useCharacters';
import { customCharacterInfo } from '../data/details';
import styles from './CharacterList.module.css';

export default function CharacterList({ tmdbWorks }: { tmdbWorks: any[] }) {
  const [selectedCharacter, setSelectedCharacter] = useState<any | null>(null);
  
  // 🌟 お気に入り機能用のStateを追加
  const [favoriteChars, setFavoriteChars] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const {
    viewMode, handleToggleView,
    showAttributes, setShowAttributes,
    watchStatusFilter, setWatchStatusFilter, 
    characters, groupedCharacters, groupKeys
  } = useCharacters(tmdbWorks);

  // 🌟 初期マウント時にLocalStorageからお気に入りを読み込む
  useEffect(() => {
    const loaded = JSON.parse(localStorage.getItem('favoriteCharacters') || '[]');
    setFavoriteChars(loaded);
  }, []);

  // 🌟 キャラクターを一意に識別するキー（名前＋作品名）
  const getCharKey = (char: any) => `${char.charName}-${char.workTitle}`;

  // 🌟 お気に入りボタンを押した時の処理
  const toggleFavorite = (char: any, e: React.MouseEvent) => {
    e.stopPropagation(); // モーダルが開くのを防ぐ
    const key = getCharKey(char);
    let newFavs;
    if (favoriteChars.includes(key)) {
      newFavs = favoriteChars.filter(k => k !== key);
    } else {
      newFavs = [...favoriteChars, key];
    }
    setFavoriteChars(newFavs);
    localStorage.setItem('favoriteCharacters', JSON.stringify(newFavs));
  };

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

  const getCustomWorkTitle = (char: any) => {
    if (!char) return '';
    const charName = char.charName || '';
    const workTitle = char.workTitle || '';

    if (charName.includes('10代目ドクター')) {
      return 'Doctor Whoシリーズ';
    }
    if (workTitle === 'Scrooge McDuck' || charName.includes('Scrooge McDuck') || charName.includes('スクルージ')) {
      return 'ディズニー';
    }
    if (['ドナルド・ピーターソン', 'ロデリック・ピーターソン'].includes(charName)) {
      return 'Nativity 2: Danger in the Manger!';
    }
    
    return char.displayWorkTitle;
  };

  // 🌟 「お気に入りのみ」フィルタリングを適用した配列を作成
  const displayCharacters = showOnlyFavorites 
    ? characters.filter(c => favoriteChars.includes(getCharKey(c)))
    : characters;

  const displayGroupedCharacters = Object.keys(groupedCharacters).reduce((acc, key) => {
    const filtered = showOnlyFavorites
      ? groupedCharacters[key].filter(c => favoriteChars.includes(getCharKey(c)))
      : groupedCharacters[key];
    acc[key] = filtered;
    return acc;
  }, {} as Record<string, any[]>);

  const sortedGroupKeys = [...groupKeys].sort((a, b) => {
    const isOtherA = a === 'その他' || a === 'その他職業';
    const isOtherB = b === 'その他' || b === 'その他職業';

    if (isOtherA && !isOtherB) return 1;
    if (!isOtherA && isOtherB) return -1;
    
    if (isOtherA && isOtherB) {
       if (a === 'その他職業' && b === 'その他') return -1;
       if (a === 'その他' && b === 'その他職業') return 1;
       return 0;
    }

    const countDiff = displayGroupedCharacters[b].length - displayGroupedCharacters[a].length;
    if (countDiff !== 0) return countDiff;

    return a.localeCompare(b, 'ja');
  });

  const renderCharacterGrid = (charList: any[]) => (
    <div className={styles.characterGrid}>
      {charList.map((char, index) => {
        const customTitle = getCustomWorkTitle(char);
        const isFav = favoriteChars.includes(getCharKey(char));

        return (
          <div 
            key={`${char.workTitle}-${index}`} 
            onClick={() => setSelectedCharacter(char)}
            className={styles.card}
          >
            {/* 🌟 お気に入りボタン */}
            <button 
              onClick={(e) => toggleFavorite(char, e)}
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
                  <span key={i} className={styles.attrBadge} onClick={(e) => handleAttributeClick(attr, e)}>
                    {attr}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderCharacterTimeline = (charList: any[]) => (
    <div className={styles.timelineContainer}>
      {charList.map((char, index) => {
        const customTitle = getCustomWorkTitle(char);
        const isFav = favoriteChars.includes(getCharKey(char));

        return (
          <div key={`${char.workTitle}-${index}`} className={styles.timelineItem}>
            <div className={styles.timelineDot}></div>
            <div className={styles.timelineContent} onClick={() => setSelectedCharacter(char)}>
              
              {/* 🌟 お気に入りボタン */}
              <button 
                onClick={(e) => toggleFavorite(char, e)}
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
                    <span style={{ color: '#20b2aa', marginLeft: '8px', fontSize: '11px' }}>
                      (当時 {char.age}歳)
                    </span>
                  )}
                </div>
                <h3 className={styles.timelineTitle}>
                  {(char.charName.includes('Scrooge McDuck') || char.charName.includes('スクルージ')) ? 'スクルージ・マクダック' : char.charName}
                  
                  {showAttributes && char.attributes && char.attributes.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {char.attributes.map((attr: string, i: number) => (
                        <span key={i} className={styles.attrBadge} onClick={(e) => handleAttributeClick(attr, e)}>
                          {attr}
                        </span>
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

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div className={styles.titleContainer} style={{ marginBottom: 0 }}>
            <h1 className={styles.mainTitle}>David Tennant</h1>
            <h2 className={styles.subTitle}>Characters</h2>
          </div>
          <Link href="/" className={styles.actionBtn} style={{ background: 'transparent', border: '1px solid #333' }}>
            🎬 作品一覧
          </Link>
        </div>
        
        <div className={styles.topNav}>
          <Link href="/character-sort" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
            <span style={{ color: '#111', fontSize: '14px' }}>🏆</span> 投票で遊ぶ
          </Link>
          
          {/* 🌟 「お気に入りのみ」トグルボタンを追加 */}
          <button 
            className={`${styles.actionBtn} ${showOnlyFavorites ? styles.actionBtnActive : ''}`} 
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          >
            <span style={{ color: '#ff9f43', fontSize: '14px' }}>★</span> {showOnlyFavorites ? 'お気に入りのみ表示' : 'お気に入りだけ表示'}
          </button>

          <button className={styles.actionBtn} onClick={handleToggleView}>
            <span style={{ color: '#7aa5d2', fontSize: '14px' }}>📅</span> {viewMode === 'grid' ? 'タイムライン表示' : 'グリッド表示'}
          </button>
          
          <button className={`${styles.actionBtn} ${showAttributes ? styles.actionBtnActive : ''}`} onClick={() => setShowAttributes(!showAttributes)}>
            <span style={{ color: '#7aa5d2', fontSize: '14px' }}>🏷️</span> {showAttributes ? '属性をオフ' : '属性でカテゴライズ'}
         </button>

          <select 
            value={watchStatusFilter} 
            onChange={(e) => setWatchStatusFilter(e.target.value)} 
            className={styles.fcSelect}
          >
            <option value="ALL">すべて視聴状況</option>
            <option value="WATCHED">視聴済</option>
            <option value="UNWATCHED">未視聴</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>
            カードをクリックすると詳細が表示されます
          </p>
          <p style={{ color: '#d4af37', fontWeight: '500', margin: 0, fontSize: '14px' }}>
            {displayCharacters.length} / {Object.keys(customCharacterInfo).length} 人
          </p>
        </div>

        {showAttributes ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
            {sortedGroupKeys.map(attr => displayGroupedCharacters[attr].length > 0 && (
              <div 
                key={attr} 
                id={`attr-group-${attr}`} 
                style={{ 
                  border: '1px dashed rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  padding: '30px 15px 15px', 
                  position: 'relative',
                  scrollMarginTop: '40px' 
                }}
              >
                <span style={{ 
                  position: 'absolute', 
                  top: '-12px', 
                  left: '16px', 
                  backgroundColor: '#0a0a0c', 
                  color: '#d4af37', 
                  padding: '0 12px', 
                  fontWeight: '500', 
                  fontSize: '14px', 
                  letterSpacing: '0.05em'
                }}>
                  {attr} <span style={{ color: '#555', fontSize: '12px' }}>({displayGroupedCharacters[attr].length})</span>
                </span>
                
                {viewMode === 'grid' 
                  ? renderCharacterGrid(displayGroupedCharacters[attr]) 
                  : renderCharacterTimeline(displayGroupedCharacters[attr])}
              </div>
            ))}
            {/* 全ての属性が空になった場合のメッセージ */}
            {displayCharacters.length === 0 && (
              <p style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>該当するキャラクターがいません。</p>
            )}
          </div>
        ) : (
          displayCharacters.length > 0 
            ? (viewMode === 'grid' ? renderCharacterGrid(displayCharacters) : renderCharacterTimeline(displayCharacters))
            : <p style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>該当するキャラクターがいません。</p>
        )}
      </div>

      {selectedCharacter && (
        <div 
          onClick={() => setSelectedCharacter(null)} 
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ backgroundColor: '#16161a', padding: '30px', borderRadius: '12px', maxWidth: '600px', width: '100%', position: 'relative', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}
          >
            <button onClick={() => setSelectedCharacter(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#666', fontSize: '20px', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#666'}>✕</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 10px 20px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {selectedCharacter.charImage ? (
                  <img src={selectedCharacter.charImage} alt={selectedCharacter.charName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '30px', opacity: 0.5 }}>🎭</span>
                )}
              </div>
              <div>
                <h2 style={{ color: '#d4af37', margin: '0 0 6px 0', fontSize: '22px', fontWeight: '600', letterSpacing: '0.02em' }}>
                  {(selectedCharacter.charName.includes('Scrooge McDuck') || selectedCharacter.charName.includes('スクルージ')) ? 'スクルージ・マクダック' : selectedCharacter.charName}
                </h2>
                <p style={{ fontSize: '13px', color: '#888', margin: 0, letterSpacing: '0.05em' }}>
                  作品：{getCustomWorkTitle(selectedCharacter)}
                </p>
              </div>
            </div>

            {selectedCharacter.fullDescription && (
              <div style={{ backgroundColor: '#0a0a0c', padding: '20px', borderRadius: '8px', maxHeight: '40vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.02)' }}>
                <p style={{ fontSize: '13px', lineHeight: '1.9', color: '#d0d0d0', whiteSpace: 'pre-wrap', margin: 0, letterSpacing: '0.02em' }}>
                  {selectedCharacter.fullDescription}
                </p>
              </div>
            )}
            
          </div>
        </div>
      )}
      
      <ScrollButtons />
    </main>
  );
}