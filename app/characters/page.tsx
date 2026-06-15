import React from 'react';
import Link from 'next/link';
import { customCharacterInfo } from '../data/details';
import { customCharacterImages } from '../data/characters';

export default function CharactersPage() {
  // customCharacterInfo からデータを抽出し、配列に変換する
  const characters = Object.keys(customCharacterInfo).map((workTitle) => {
    const rawInfo = customCharacterInfo[workTitle] || '';
    
    // 「名前：\n説明」の形式から名前だけを切り出す
    // コロン（：）または改行（\n）で分割して最初の部分を取得
    let charName = "情報なし";
    if (rawInfo.includes('：')) {
      charName = rawInfo.split('：')[0];
    } else if (rawInfo.includes('\n')) {
      charName = rawInfo.split('\n')[0];
    } else {
      charName = rawInfo; // 区切り文字がない場合はそのまま
    }

    const charImage = customCharacterImages[workTitle] || null;
    
    return {
      workTitle,
      charName,
      charImage,
    };
  });

  return (
    <main style={{ padding: '40px 20px', fontFamily: 'sans-serif', backgroundColor: '#141414', minHeight: '100vh', color: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* ヘッダー部分 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', margin: 0 }}>キャラクターリスト</h1>
          <Link href="/" style={{ color: '#4dabf7', textDecoration: 'none', padding: '8px 16px', backgroundColor: '#222', borderRadius: '8px' }}>
            ← 作品リストに戻る
          </Link>
        </div>

        {/* キャラクター一覧のグリッド */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '25px' }}>
          {characters.map((char, index) => (
            <div key={index} style={{ backgroundColor: '#222', borderRadius: '12px', padding: '20px', textAlign: 'center', transition: 'transform 0.2s' }}>
              
              {/* アイコン画像 */}
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

              {/* 名前と作品名 */}
              <h2 style={{ fontSize: '18px', margin: '0 0 8px 0', color: '#4dabf7' }}>{char.charName}</h2>
              <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>{char.workTitle}</p>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}