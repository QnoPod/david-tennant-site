'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { customCharacterInfo } from '../data/details';
import { customCharacterImages } from '../data/characters';
import ScrollButtons from '../components/ScrollButtons';

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

    const charImage = customCharacterImages[workTitle] || null;
    
    return {
      workTitle,
      charName,
      charImage,
      fullDescription: rawInfo,
    };
  });

  return (
    <main style={{ padding: '40px 20px', fontFamily: 'sans-serif', backgroundColor: '#141414', minHeight: '100vh', color: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '32px', margin: 0 }}>キャラクターリスト</h1>
          <Link href="/" style={{ color: '#4dabf7', textDecoration: 'none', padding: '8px 16px', backgroundColor: '#222', borderRadius: '8px' }}>
            ← 作品リストに戻る
          </Link>
        </div>

        <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '15px' }}>
          カードをクリックすると詳細が表示されます
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '25px' }}>
          {characters.map((char, index) => (
            <div 
              key={index} 
              onClick={() => setSelectedCharacter(char)}
              style={{ backgroundColor: '#222', borderRadius: '12px', padding: '20px', textAlign: 'center', transition: 'transform 0.2s', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              
              <div style={{ 
                width: '120px', height: '120px', margin: '0 auto 15px auto', borderRadius: '50%', 
                overflow: 'hidden', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
              }}>
                {char.charImage ? (
                  <img src={char.charImage} alt={char.charName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '40px' }}>🎭</span>
                )}
              </div>

              <h2 style={{ fontSize: '18px', margin: '0 0 8px 0', color: '#4dabf7' }}>{char.charName}</h2>
              <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>{char.workTitle}</p>
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
                <h2 style={{ color: '#4dabf7', margin: '0 0 5px 0', fontSize: '24px' }}>{selectedCharacter.charName}</h2>
                <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>作品: {selectedCharacter.workTitle}</p>
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