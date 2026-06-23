'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import ScrollButtons from '../components/ScrollButtons';
import { useCharacters } from '../hooks/useCharacters';
// 🌟 全体の人数を取得するためにインポートを追加
import { customCharacterInfo } from '../data/details';
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

  // 🌟 属性グループを「人数が多い順」に並び替えるロジック
  const sortedGroupKeys = [...groupKeys].sort((a, b) => {
    const isOtherA = a === 'その他' || a === 'その他職業';
    const isOtherB = b === 'その他' || b === 'その他職業';

    // 「その他」「その他職業」は常に最後にする
    if (isOtherA && !isOtherB) return 1;
    if (!isOtherA && isOtherB) return -1;
    
    if (isOtherA && isOtherB) {
       if (a === 'その他職業' && b === 'その他') return -1;
       if (a === 'その他' && b === 'その他職業') return 1;
       return 0;
    }

    // 🌟 人数で降順（多い順）にソート
    const countDiff = groupedCharacters[b].length - groupedCharacters[a].length;
    if (countDiff !== 0) return countDiff;

    // 人数が同じ場合は五十音順
    return a.localeCompare(b, 'ja');
  });

  const renderCharacterGrid = (charList: any[]) => (
    <div className={styles.characterGrid}>
      {charList.map((char, index) => {
        const customTitle = getCustomWorkTitle(char);

        return (
          <div 
            key={`${char.workTitle}-${index}`} 
            onClick={() => setSelectedCharacter(char)}
            className={styles.card}
          >
            <div style={{ 
              width: 'var(--image-size)', height: 'var(--image-size)', margin: '0 auto 20px auto', borderRadius: '50%', 
              overflow: 'hidden', backgroundColor: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 20px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.05)'
            }}>
              {char.charImage ? (
                <img src={char.charImage} alt={char.charName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '40px', opacity: 0.5 }}>🎭</span>
              )}
            </div>

            <h2 style={{ fontSize: 'var(--title-size)', margin: '0 0 10px 0', color: '#d4af37', fontWeight: '600' }}>
              {(char.charName.includes('Scrooge McDuck') || char.charName.includes('スクルージ')) ? 'スクルージ・マクダック' : char.charName}
            </h2>
            <p style={{ fontSize: 'var(--subtitle-size)', color: '#888', margin: 0, letterSpacing: '0.05em' }}>
              {customTitle}
            </p>

            {showAttributes && char.attributes && char.attributes.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '16px' }}>
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

        return (
          <div key={`${char.workTitle}-${index}`} className={styles.timelineItem}>
            <div className={styles.timelineDot}></div>
            <div className={styles.timelineContent} onClick={() => setSelectedCharacter(char)}>
              {char.charImage ? (
                <img src={char.charImage} alt={char.charName} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid #333' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', backgroundColor: '#0a0a0c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '30px', opacity: 0.5 }}>🎭</div>
              )}
              <div>
                <div style={{ fontWeight: '500', color: '#eaeaea', marginBottom: '8px', fontSize: '15px', letterSpacing: '0.05em' }}>
                  {char.year !== '年不明' ? `${char.year}年` : '公開年不明'}
                  {char.age !== '不明' && (
                    <span style={{ color: '#20b2aa', marginLeft: '10px', fontSize: '13px' }}>
                      (当時 {char.age}歳)
                    </span>
                  )}
                </div>
                <h3 className={styles.timelineTitle}>
                  {(char.charName.includes('Scrooge McDuck') || char.charName.includes('スクルージ')) ? 'スクルージ・マクダック' : char.charName}
                  
                  {showAttributes && char.attributes && char.attributes.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {char.attributes.map((attr: string, i: number) => (
                        <span key={i} className={styles.attrBadge} onClick={(e) => handleAttributeClick(attr, e)} style={{ padding: '2px 8px' }}>
                          {attr}
                        </span>
                      ))}
                    </div>
                  )}
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
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
        
        {/* 🌟 ヘッダーのレイアウト変更：タイトルと戻るボタンを横並びに */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
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
            <span style={{ color: '#111', fontSize: '16px' }}>🏆</span> 投票で遊ぶ
          </Link>
          <button className={styles.actionBtn} onClick={handleToggleView}>
            <span style={{ color: '#7aa5d2', fontSize: '16px' }}>📅</span> {viewMode === 'grid' ? 'タイムライン表示' : 'グリッド表示'}
          </button>
          <button className={`${styles.actionBtn} ${showAttributes ? styles.actionBtnActive : ''}`} onClick={() => setShowAttributes(!showAttributes)}>
            <span style={{ color: '#7aa5d2', fontSize: '16px' }}>🏷️</span> {showAttributes ? '属性をオフ' : '属性でカテゴライズ'}
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

        {/* 🌟 案内文と人数表示を横並び＆右寄せに */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <p style={{ color: '#aaa', fontSize: '15px', margin: 0 }}>
            カードをクリックすると詳細が表示されます
          </p>
          <p style={{ color: '#d4af37', fontWeight: '500', margin: 0 }}>
            {characters.length} / {Object.keys(customCharacterInfo).length} 人
          </p>
        </div>

        {showAttributes ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
            {/* 🌟 並び替えた sortedGroupKeys を使用 */}
            {sortedGroupKeys.map(attr => groupedCharacters[attr].length > 0 && (
              <div 
                key={attr} 
                id={`attr-group-${attr}`} 
                style={{ 
                  border: '1px dashed rgba(255,255,255,0.2)', /* 🌟 枠を点線に変更 */
                  borderRadius: '12px',
                  padding: '40px 20px 20px', 
                  position: 'relative',
                  scrollMarginTop: '40px' 
                }}
              >
                <span style={{ 
                  position: 'absolute', 
                  top: '-15px', 
                  left: '20px', 
                  backgroundColor: '#0a0a0c', 
                  color: '#d4af37', 
                  padding: '0 15px', 
                  fontWeight: '500', 
                  fontSize: '18px', 
                  letterSpacing: '0.05em'
                }}>
                  {attr} <span style={{ color: '#555', fontSize: '14px' }}>({groupedCharacters[attr].length})</span>
                </span>
                
                {viewMode === 'grid' 
                  ? renderCharacterGrid(groupedCharacters[attr]) 
                  : renderCharacterTimeline(groupedCharacters[attr])}
              </div>
            ))}
          </div>
        ) : (
          viewMode === 'grid' ? renderCharacterGrid(characters) : renderCharacterTimeline(characters)
        )}
      </div>

      {/* キャラクター詳細モーダル */}
      {selectedCharacter && (
        <div 
          onClick={() => setSelectedCharacter(null)} 
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ backgroundColor: '#16161a', padding: '40px', borderRadius: '12px', maxWidth: '600px', width: '100%', position: 'relative', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}
          >
            <button onClick={() => setSelectedCharacter(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#666', fontSize: '24px', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#666'}>✕</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '30px' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 10px 20px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {selectedCharacter.charImage ? (
                  <img src={selectedCharacter.charImage} alt={selectedCharacter.charName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '40px', opacity: 0.5 }}>🎭</span>
                )}
              </div>
              <div>
                <h2 style={{ color: '#d4af37', margin: '0 0 8px 0', fontSize: '28px', fontWeight: '600', letterSpacing: '0.02em' }}>
                  {(selectedCharacter.charName.includes('Scrooge McDuck') || selectedCharacter.charName.includes('スクルージ')) ? 'スクルージ・マクダック' : selectedCharacter.charName}
                </h2>
                {/* 🌟 名前の下を「作品：〇〇」に変更 */}
                <p style={{ fontSize: '15px', color: '#888', margin: 0, letterSpacing: '0.05em' }}>
                  作品：{getCustomWorkTitle(selectedCharacter)}
                </p>
              </div>
            </div>

            {selectedCharacter.fullDescription && (
              <div style={{ backgroundColor: '#0a0a0c', padding: '25px', borderRadius: '8px', maxHeight: '40vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.02)' }}>
                <p style={{ fontSize: '15px', lineHeight: '1.9', color: '#d0d0d0', whiteSpace: 'pre-wrap', margin: 0, letterSpacing: '0.02em' }}>
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