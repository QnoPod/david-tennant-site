'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ScrollButtons from '../components/ScrollButtons';

// 🌟 新しく作成したカスタムフックをインポート
import { useCharacters } from '../hooks/useCharacters';

export default function CharacterList({ tmdbWorks }: { tmdbWorks: any[] }) {
  // 🌟 UI内で閉じている状態（モーダルの開閉など）だけをここで管理
  const [selectedCharacter, setSelectedCharacter] = useState<any | null>(null);

  // 🌟 裏側の複雑な計算はすべてカスタムフックに丸投げ！
  const {
    viewMode, handleToggleView,
    showAttributes, setShowAttributes,
    characters, groupedCharacters, groupKeys
  } = useCharacters(tmdbWorks);

  // 🌟 属性タグのスクロール処理
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
    <div className="character-grid">
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
            {(char.workTitle === 'Scrooge McDuck' || char.charName.includes('Scrooge McDuck') || char.charName.includes('スクルージ')) ? 'スクルージ・マクダック' : char.charName}
          </h2>
          <p style={{ fontSize: 'var(--subtitle-size)', color: '#888', margin: 0 }}>
            {
              ['ドナルド・ピーターソン', 'ロデリック・ピーターソン'].includes(char.charName) ? 'Nativity 2: Danger in the Manger!' :
              char.charName === '10代目ドクター' ? 'Doctor Whoシリーズ' : 
              (char.workTitle === 'Scrooge McDuck' || char.charName.includes('Scrooge McDuck') || char.charName.includes('スクルージ')) ? 'ディズニー' :
              char.displayWorkTitle
            }
          </p>

          {showAttributes && char.attributes && char.attributes.length > 0 && (
            <div style={{ 
              display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '12px' 
            }}>
              {char.attributes.map((attr: string, i: number) => (
                <span key={i} 
                  className="attr-badge"
                  onClick={(e) => handleAttributeClick(attr, e)}
                  style={{ 
                    backgroundColor: '#ff9f43', color: '#1a1a1a', 
                    fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}>
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
    <div className="timeline-container">
      {charList.map((char, index) => (
        <div key={`${char.workTitle}-${index}`} className="timeline-item">
          <div className="timeline-dot"></div>
          <div className="timeline-content" onClick={() => setSelectedCharacter(char)}>
            {char.charImage ? (
              <img 
                src={char.charImage} 
                alt={char.charName} 
                style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #333' }} 
              />
            ) : (
              <div style={{ width: '60px', height: '60px', backgroundColor: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '24px' }}>🎭</div>
            )}
            <div>
              <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '5px', fontSize: '15px' }}>
                {char.year !== '年不明' ? `${char.year}年` : '公開年不明'}
                {char.age !== '不明' && (
                  <span style={{ color: '#4dabf7', marginLeft: '8px', fontSize: '13px' }}>
                    (当時 {char.age}歳)
                  </span>
                )}
              </div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#ff9f43', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {(char.workTitle === 'Scrooge McDuck' || char.charName.includes('Scrooge McDuck') || char.charName.includes('スクルージ')) ? 'スクルージ・マクダック' : char.charName}
                
                {showAttributes && char.attributes && char.attributes.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {char.attributes.map((attr: string, i: number) => (
                      <span key={i} 
                        className="attr-badge"
                        onClick={(e) => handleAttributeClick(attr, e)}
                        style={{ backgroundColor: '#ff9f43', color: '#1a1a1a', fontSize: '11px', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' }}>
                        {attr}
                      </span>
                    ))}
                  </div>
                )}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>
                作品: {
                  ['ドナルド・ピーターソン', 'ロデリック・ピーターソン'].includes(char.charName) ? 'Nativity 2: Danger in the Manger!' :
                  char.charName === '10代目ドクター' ? 'Doctor Whoシリーズ' : 
                  (char.workTitle === 'Scrooge McDuck' || char.charName.includes('Scrooge McDuck') || char.charName.includes('スクルージ')) ? 'ディズニー' : 
                  char.displayWorkTitle
                }
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <main style={{ padding: '40px 20px', fontFamily: 'sans-serif', backgroundColor: '#141414', minHeight: '100vh', color: '#fff' }}>
      
      <style>{`
        .character-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 25px;
          --card-padding: 20px;
          --image-size: 120px;
          --title-size: 18px;
          --subtitle-size: 13px;
        }

        .toggle-btn {
          color: #fff;
          border: 1px solid #444;
          padding: 8px 16px;
          font-size: 14px;
          background-color: #222;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toggle-btn:hover { background-color: #333; }
        .toggle-btn.active { background-color: #ff9f43; color: #1a1a1a; border-color: #ff9f43; }

        .attr-badge { cursor: pointer; transition: transform 0.1s, opacity 0.1s; }
        .attr-badge:hover { transform: scale(1.05); opacity: 0.8; }

        .timeline-container { position: relative; max-width: 900px; margin: 20px auto 0; padding: 20px 0; }
        .timeline-container::after { content: ''; position: absolute; width: 4px; background-color: #ff9f43; top: 0; bottom: 0; left: 50%; margin-left: -2px; border-radius: 2px; }
        .timeline-item { padding: 10px 40px; position: relative; width: 50%; box-sizing: border-box; margin-bottom: 20px; }
        .timeline-item:nth-child(odd) { left: 0; text-align: right; }
        .timeline-item:nth-child(even) { left: 50%; text-align: left; }
        
        .timeline-dot { position: absolute; width: 20px; height: 20px; background-color: #4dabf7; border: 4px solid #141414; border-radius: 50%; top: calc(50% - 10px); z-index: 1; }
        .timeline-item:nth-child(odd) .timeline-dot { right: -10px; }
        .timeline-item:nth-child(even) .timeline-dot { left: -10px; }
        
        .timeline-content { background-color: #222; border-radius: 12px; padding: 15px; display: inline-flex; align-items: center; gap: 15px; text-align: left; cursor: pointer; transition: transform 0.2s, background-color 0.2s; width: 100%; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .timeline-content:hover { transform: scale(1.02); background-color: #333; }

        @media (max-width: 600px) {
          .character-grid {
            grid-template-columns: repeat(2, 1fr); gap: 10px;
            --card-padding: 10px; --image-size: 80px; --title-size: 14px; --subtitle-size: 11px;
          }
          .timeline-container::after { left: 20px; }
          .timeline-item { width: 100%; padding-left: 50px; padding-right: 0; left: 0 !important; text-align: left !important; }
          .timeline-dot { left: 10px !important; right: auto !important; }
          .timeline-content { flex-direction: row; }
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h1 style={{ fontSize: '32px', margin: 0 }}>キャラクターリスト</h1>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link href="/character-sort" prefetch={true} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', fontSize: '14px', backgroundColor: '#ff9f43', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
                 🏆 投票で遊ぶ
              </Link>
              
              <button className="toggle-btn" onClick={handleToggleView}>
                {viewMode === 'grid' ? '📅 タイムライン表示' : '🔲 グリッド表示'}
              </button>

              <button 
                className={`toggle-btn ${showAttributes ? 'active' : ''}`} 
                onClick={() => setShowAttributes(!showAttributes)}
              >
                {showAttributes ? '🏷️ 属性タグをオフ' : '🏷️ 属性タグで分ける'}
              </button>
            </div>
          </div>

          <Link href="/" prefetch={true} style={{ color: '#ff9f43', textDecoration: 'none', padding: '8px 16px', backgroundColor: '#222', borderRadius: '8px', marginTop: '5px' }}>
            ← 作品リストに戻る
          </Link>
        </div>

        <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '15px' }}>
          カードをクリックすると詳細が表示されます
        </p>

        {showAttributes ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {groupKeys.map(attr => (
              <div 
                key={attr} 
                id={`attr-group-${attr}`} 
                style={{ 
                  border: '2px dashed #444', 
                  borderRadius: '16px', 
                  padding: '35px 20px 20px', 
                  position: 'relative',
                  scrollMarginTop: '20px' 
                }}
              >
                <span style={{ 
                  position: 'absolute', 
                  top: '-14px', 
                  left: '20px', 
                  backgroundColor: '#444', 
                  color: '#fff', 
                  padding: '4px 16px', 
                  borderRadius: '20px', 
                  fontWeight: 'bold', 
                  fontSize: '14px', 
                  border: '1px solid #555' 
                }}>
                  🏷️ {attr} ({groupedCharacters[attr].length})
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

      {selectedCharacter && (
        <div 
          onClick={() => setSelectedCharacter(null)} 
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '16px', maxWidth: '500px', width: '100%', position: 'relative' }}
          >
            <button 
              onClick={() => setSelectedCharacter(null)} 
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {selectedCharacter.charImage ? (
                  <img src={selectedCharacter.charImage} alt={selectedCharacter.charName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '30px' }}>🎭</span>
                )}
              </div>
              <div>
                <h2 style={{ color: '#ff9f43', margin: '0 0 5px 0', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {(selectedCharacter.workTitle === 'Scrooge McDuck' || selectedCharacter.charName.includes('Scrooge McDuck') || selectedCharacter.charName.includes('スクルージ')) ? 'スクルージ・マクダック' : selectedCharacter.charName}
                  
                  {showAttributes && selectedCharacter.attributes && selectedCharacter.attributes.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {selectedCharacter.attributes.map((attr: string, i: number) => (
                        <span key={i} 
                          className="attr-badge"
                          onClick={(e) => handleAttributeClick(attr, e)}
                          style={{ backgroundColor: '#ff9f43', color: '#1a1a1a', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}>
                          {attr}
                        </span>
                      ))}
                    </div>
                  )}
                </h2>
                <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
                  作品: {
                    ['ドナルド・ピーターソン', 'ロデリック・ピーターソン'].includes(selectedCharacter.charName) ? 'Nativity 2: Danger in the Manger!' :
                    selectedCharacter.charName === '10代目ドクター' ? 'Doctor Whoシリーズ' : 
                    (selectedCharacter.workTitle === 'Scrooge McDuck' || selectedCharacter.charName.includes('Scrooge McDuck') || selectedCharacter.charName.includes('スクルージ')) ? 'ディズニー' : 
                    selectedCharacter.displayWorkTitle
                  }
                </p>
              </div>
            </div>

            {selectedCharacter.fullDescription && (
              <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '12px', maxHeight: '50vh', overflowY: 'auto' }}>
                <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#ddd', whiteSpace: 'pre-wrap', margin: 0 }}>
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