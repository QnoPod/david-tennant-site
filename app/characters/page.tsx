'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { customCharacterInfo } from '../data/details';
import { customCharacterImages } from '../data/characters';
import ScrollButtons from '../components/ScrollButtons';
// 🌟 作成した検索辞書をインポート
import { searchDictionary } from '../data/searchDictionary';

// 🌟 文字を強力に整える関数（邦題変換用）
const normalizeText = (text: string) => {
  if (!text) return '';
  return String(text)
    .normalize('NFKC')         
    .toLowerCase()             
    .replace(/[\s ・=\-.,:;!?'"()\[\]{}~～＆&]/g, ''); 
};

export default function CharactersPage() {
  const [selectedCharacter, setSelectedCharacter] = useState<any | null>(null);

  const characters = Object.keys(customCharacterInfo).map((workTitle) => {
    const rawInfo = customCharacterInfo[workTitle] || '';
    
    let charName = "情報なし";
    if (rawInfo.includes('：')) {
      charName = rawInfo.split('：')[0];
    } else if (rawInfo.includes('\n')) {
      charName = rawInfo.split('\n')[0];
    } else {
      charName = rawInfo;
    }

    // 🌟 修正：WorkModalと同じロジックで画像キーを解決する
    const imageKey = 
      (charName.includes('10th Doctor') || charName.includes('10代目ドクター')) ? '10th doctor' :
      charName.includes('14代目ドクター') ? 'Doctor Who: 60th Anniversary Specials' :
      workTitle;
    
    const charImage = customCharacterImages[imageKey] || customCharacterImages[workTitle] || null;
    
    // 🌟 辞書を使って、画面の表示タイトルを邦題へ変換
    const normalizedTitle = normalizeText(workTitle);
    const rawDisplayTitle = searchDictionary[normalizedTitle] || workTitle;
    
    // 🌟 修正：作品タイトルが "Doctor Who" の場合、"Doctor Whoシリーズ" に置換する
    const displayWorkTitle = rawDisplayTitle.replace(/^Doctor Who$/, 'Doctor Whoシリーズ');
    
    return {
      workTitle,
      displayWorkTitle, // 🌟 画面表示用のタイトル
      charName,
      charImage,
      fullDescription: rawInfo,
    };
  }).sort((a, b) => a.charName.localeCompare(b.charName, 'ja')); // 🌟 修正：名前の五十音順でソート

  return (
    <main style={{ padding: '40px 20px', fontFamily: 'sans-serif', backgroundColor: '#141414', minHeight: '100vh', color: '#fff' }}>
      
      {/* 🌟 スマホとPCでレイアウトと文字・画像サイズを切り替えるCSS */}
      <style>{`
        .character-grid {
          display: grid;
          /* PC表示: 横幅200px以上で並べられるだけ並べる */
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 25px;
          
          /* 🎨 PC用の各サイズ設定（変数） */
          --card-padding: 20px;
          --image-size: 120px;
          --title-size: 18px;
          --subtitle-size: 13px;
        }
        
        /* スマホ表示 (横幅600px以下) の場合 */
        @media (max-width: 600px) {
          .character-grid {
            /* 強制的に2列にする */
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            
            /* 🎨 スマホ用に各サイズを全体的にギュッと小さくする */
            --card-padding: 10px;
            --image-size: 80px;
            --title-size: 14px;
            --subtitle-size: 11px;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '32px', margin: 0 }}>キャラクターリスト</h1>
          <Link href="/" prefetch={true} style={{ color: '#ff9f43', textDecoration: 'none', padding: '8px 16px', backgroundColor: '#222', borderRadius: '8px' }}>
            ← 作品リストに戻る
          </Link>
        </div>

        <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '15px' }}>
          カードをクリックすると詳細が表示されます
        </p>

        {/* 🌟 inlineのstyleを消して、className="character-grid" を適用 */}
        <div className="character-grid">
          {characters.map((char, index) => (
            <div 
              key={index} 
              onClick={() => setSelectedCharacter(char)}
              style={{ backgroundColor: '#222', borderRadius: '12px', padding: 'var(--card-padding)', textAlign: 'center', transition: 'transform 0.2s', cursor: 'pointer' }}
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

              {/* タイトルとサブタイトルもCSS変数を適用してスマホ時に縮小 */}
              <h2 style={{ fontSize: 'var(--title-size)', margin: '0 0 8px 0', color: '#ff9f43' }}>{char.charName}</h2>
              {/* 🌟 修正：キャラクターカード下部も10代目ドクターなら「Doctor Whoシリーズ」と表示 */}
              <p style={{ fontSize: 'var(--subtitle-size)', color: '#888', margin: 0 }}>
                {
                  ['ドナルド・ピーターソン', 'ロデリック・ピーターソン'].includes(char.charName) ? 'Nativity 2: Danger in the Manger!' :
                  char.charName === '10代目ドクター' ? 'Doctor Whoシリーズ' : 
                  char.displayWorkTitle
                }
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* キャラクター詳細モーダル */}
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
                <h2 style={{ color: '#ff9f43', margin: '0 0 5px 0', fontSize: '24px' }}>{selectedCharacter.charName}</h2>
                {/* 🌟 修正：10代目ドクターの場合は「作品: Doctor Whoシリーズ」と強制表示 */}
                <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
                  作品: {
                    ['ドナルド・ピーターソン', 'ロデリック・ピーターソン'].includes(selectedCharacter.charName) ? 'Nativity 2: Danger in the Manger!' :
                    selectedCharacter.charName === '10代目ドクター' ? 'Doctor Whoシリーズ' : 
                    selectedCharacter.displayWorkTitle
                  }
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '12px', maxHeight: '50vh', overflowY: 'auto' }}>
              <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#ddd', whiteSpace: 'pre-wrap', margin: 0 }}>
                {selectedCharacter.fullDescription}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* 🌟 スクロールボタンをモーダルの外に配置 */}
      <ScrollButtons />
      
    </main>
  );
}