'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { customCharacterInfo } from '../data/details';
import { customCharacterImages } from '../data/characters';
import ScrollButtons from '../components/ScrollButtons';
// 🌟 作成した検索辞書をインポート
import { searchDictionary } from '../data/searchDictionary';
// 🌟 追加：公開年が不明な作品の手動データ（yearOverrides）をインポート
import { yearOverrides } from '../data/yearOverrides';

// 🌟 文字を強力に整える関数（邦題変換用）
const normalizeText = (text: string) => {
  if (!text) return '';
  return String(text)
    .normalize('NFKC')         
    .toLowerCase()             
    .replace(/[\s ・=\-.,:;!?'"()\[\]{}~～＆&]/g, ''); 
};

// 🌟 修正：サーバー（page.tsx）から tmdbWorks を受け取るように変更
export default function CharacterList({ tmdbWorks }: { tmdbWorks: any[] }) {
  const [selectedCharacter, setSelectedCharacter] = useState<any | null>(null);

  // 🌟 追加：表示モード（グリッドかタイムラインか）を管理するステート
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  // 🌟 TMDBのデータを元にキャラクターリストを生成（useMemoで最適化）
  const characters = useMemo(() => {
    return Object.keys(customCharacterInfo).map((workTitle) => {
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
        (workTitle === 'Scrooge McDuck' || charName.includes('Scrooge McDuck') || charName.includes('スクルージ')) ? 'Scrooge McDuck' : // 🌟 スクルージの画像共通化
        workTitle;
      
      const charImage = customCharacterImages[imageKey] || customCharacterImages[workTitle] || null;
      
      // 🌟 辞書を使って、画面の表示タイトルを邦題へ変換
      const normalizedTitle = normalizeText(workTitle);
      const rawDisplayTitle = searchDictionary[normalizedTitle] || workTitle;
      
      // 🌟 修正：作品タイトルが "Doctor Who" の場合、"Doctor Whoシリーズ" に置換する
      const displayWorkTitle = rawDisplayTitle.replace(/^Doctor Who$/, 'Doctor Whoシリーズ');
      
      // 🌟 追加：TMDBデータから公開年を探す処理
      let year = '年不明';
      let fullDateStr = ''; // 🌟 追加：年齢計算用に完全な日付文字列を保持

      // 🌟 修正：yearOverridesのデータを最優先で取得する
      if (yearOverrides[workTitle]) {
        year = yearOverrides[workTitle];
      } else if (charName === '10代目ドクター' || workTitle.includes('Doctor Who')) {
        // まずは手動補正（TMDBと完全一致しにくい特殊な作品を優先）
        year = '2005';
        fullDateStr = '2005-06-18'; // 10代目の初登場日近辺
      } else if (workTitle === 'Scrooge McDuck' || charName.includes('Scrooge McDuck')) {
        year = '2017';
        fullDateStr = '2017-08-12';
      } else if (['ドナルド・ピーターソン', 'ロデリック・ピーターソン'].includes(charName)) {
        year = '2012';
        fullDateStr = '2012-11-23';
      } else if (tmdbWorks && tmdbWorks.length > 0) {
        // タイトルまたは邦題が一致する作品をTMDBデータから検索
        const normalizedWorkTitle = normalizeText(workTitle);
        const rawDisplayTitleNorm = normalizeText(rawDisplayTitle);

        const matchedWork = tmdbWorks.find((w: any) => {
          const tmdbTitle = normalizeText(w.title || '');
          const tmdbName = normalizeText(w.name || '');
          const tmdbOrigTitle = normalizeText(w.original_title || '');
          const tmdbOrigName = normalizeText(w.original_name || '');

          // 🌟 修正：どれか1つでも部分一致すればOKとする強力なマッチング
          return (
            (tmdbTitle && (tmdbTitle.includes(normalizedWorkTitle) || tmdbTitle.includes(rawDisplayTitleNorm))) ||
            (tmdbName && (tmdbName.includes(normalizedWorkTitle) || tmdbName.includes(rawDisplayTitleNorm))) ||
            (tmdbOrigTitle && (tmdbOrigTitle.includes(normalizedWorkTitle) || tmdbOrigTitle.includes(rawDisplayTitleNorm))) ||
            (tmdbOrigName && (tmdbOrigName.includes(normalizedWorkTitle) || tmdbOrigName.includes(rawDisplayTitleNorm))) ||
            (normalizedWorkTitle && tmdbTitle && normalizedWorkTitle.includes(tmdbTitle)) ||
            (normalizedWorkTitle && tmdbName && normalizedWorkTitle.includes(tmdbName))
          );
        });

        if (matchedWork) {
          const dateStr = matchedWork.first_air_date || matchedWork.release_date;
          if (dateStr) {
            year = dateStr.substring(0, 4);
            fullDateStr = dateStr; // 🌟 完全な日付を保存
          }
        }
      }

      // 🌟 追加：デイヴィッドの誕生日 (1971年4月18日) から当時の年齢を算出
      let age: string | number = '不明';
      if (fullDateStr) {
        const releaseDate = new Date(fullDateStr);
        const birthDate = new Date('1971-04-18');
        let calculatedAge = releaseDate.getFullYear() - birthDate.getFullYear();
        const m = releaseDate.getMonth() - birthDate.getMonth();
        // 誕生日を迎えていない場合は -1
        if (m < 0 || (m === 0 && releaseDate.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        age = calculatedAge;
      } else if (year !== '年不明') {
        // 日付がない場合は年だけで概算
        age = parseInt(year) - 1971;
      }

      return {
        workTitle,
        displayWorkTitle, // 🌟 画面表示用のタイトル
        charName,
        charImage,
        fullDescription: rawInfo,
        year, // 🌟 取得した年データを持たせる
        age   // 🌟 追加：算出した年齢を持たせる
      };
    }).sort((a, b) => {
      // 🌟 修正：タイムライン表示のときは公開年（新しい順/降順）でソート、グリッドのときは五十音順でソート
      if (viewMode === 'timeline') {
        const yearA = a.year === '年不明' ? 0 : parseInt(a.year); // 年不明は一番最後にするため 0 扱い
        const yearB = b.year === '年不明' ? 0 : parseInt(b.year);
        if (yearA !== yearB) return yearB - yearA; // 新しい順（降順）
      }
      return a.charName.localeCompare(b.charName, 'ja');
    });
  }, [tmdbWorks, viewMode]);

  // 🌟 追加：表示切替用の関数
  const handleToggleView = () => {
    setViewMode(prev => prev === 'grid' ? 'timeline' : 'grid');
  };

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

        /* 🌟 切替ボタンのCSS */
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
        .toggle-btn:hover {
          background-color: #333;
        }

        /* 🌟 タイムライン表示用のCSS */
        .timeline-container {
          position: relative;
          max-width: 900px;
          margin: 40px auto;
          padding: 20px 0;
        }
        .timeline-container::after {
          content: '';
          position: absolute;
          width: 4px;
          background-color: #ff9f43; /* キャラクターリストはオレンジの線 */
          top: 0;
          bottom: 0;
          left: 50%;
          margin-left: -2px;
          border-radius: 2px;
        }
        .timeline-item {
          padding: 10px 40px;
          position: relative;
          width: 50%;
          box-sizing: border-box;
          margin-bottom: 20px;
        }
        .timeline-item:nth-child(odd) { left: 0; text-align: right; }
        .timeline-item:nth-child(even) { left: 50%; text-align: left; }
        
        .timeline-dot {
          position: absolute;
          width: 20px;
          height: 20px;
          background-color: #4dabf7; /* ドットは青色 */
          border: 4px solid #141414;
          border-radius: 50%;
          top: calc(50% - 10px);
          z-index: 1;
        }
        .timeline-item:nth-child(odd) .timeline-dot { right: -10px; }
        .timeline-item:nth-child(even) .timeline-dot { left: -10px; }
        
        .timeline-content {
          background-color: #222;
          border-radius: 12px;
          padding: 15px;
          display: inline-flex;
          align-items: center;
          gap: 15px;
          text-align: left;
          cursor: pointer;
          transition: transform 0.2s, background-color 0.2s;
          width: 100%;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
        .timeline-content:hover {
          transform: scale(1.02);
          background-color: #333;
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

          /* スマホ時のタイムラインの調整 */
          .timeline-container::after { left: 20px; }
          .timeline-item {
            width: 100%;
            padding-left: 50px;
            padding-right: 0;
            left: 0 !important;
            text-align: left !important;
          }
          .timeline-dot {
            left: 10px !important;
            right: auto !important;
          }
          .timeline-content {
            flex-direction: row;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* 🌟 修正：alignItemsを 'flex-start' にして上揃えにする */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          
          {/* 🌟 修正：flexDirection を 'column' にしてタイトルとボタンを縦並びにする */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h1 style={{ fontSize: '32px', margin: 0 }}>キャラクターリスト</h1>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link href="/character-sort" prefetch={true} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', fontSize: '14px', backgroundColor: '#ff9f43', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
                 🏆 投票で遊ぶ
              </Link>
              
              {/* 🌟 追加：表示切替ボタン */}
              <button className="toggle-btn" onClick={handleToggleView}>
                {viewMode === 'grid' ? '📅 タイムライン表示' : '🔲 グリッド表示'}
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

        {/* 🌟 追加：表示モードに応じた出し分け */}
        {viewMode === 'grid' ? (
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
                <h2 style={{ fontSize: 'var(--title-size)', margin: '0 0 8px 0', color: '#ff9f43' }}>
                  {/* 🌟 スクルージの場合は画面表示名を強制的に変更 */}
                  {(char.workTitle === 'Scrooge McDuck' || char.charName.includes('Scrooge McDuck') || char.charName.includes('スクルージ')) ? 'スクルージ・マクダック' : char.charName}
                </h2>
                {/* 🌟 修正：キャラクターカード下部も10代目ドクターやスクルージなら特定の文字を表示 */}
                <p style={{ fontSize: 'var(--subtitle-size)', color: '#888', margin: 0 }}>
                  {
                    ['ドナルド・ピーターソン', 'ロデリック・ピーターソン'].includes(char.charName) ? 'Nativity 2: Danger in the Manger!' :
                    char.charName === '10代目ドクター' ? 'Doctor Whoシリーズ' : 
                    (char.workTitle === 'Scrooge McDuck' || char.charName.includes('Scrooge McDuck') || char.charName.includes('スクルージ')) ? 'ディズニー' : // 🌟 追加：スクルージの場合はディズニーと表示
                    char.displayWorkTitle
                  }
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="timeline-container">
            {characters.map((char, index) => (
              <div key={index} className="timeline-item">
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
                    {/* 🌟 追加：公開年を表示 */}
                    <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '5px', fontSize: '15px' }}>
                      {char.year !== '年不明' ? `${char.year}年` : '公開年不明'}
                      {/* 🌟 追加：タイムライン時のみ、デイヴィッドの当時の年齢を表示 */}
                      {char.age !== '不明' && (
                        <span style={{ color: '#4dabf7', marginLeft: '8px', fontSize: '13px' }}>
                          (当時 {char.age}歳)
                        </span>
                      )}
                    </div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#ff9f43' }}>
                      {(char.workTitle === 'Scrooge McDuck' || char.charName.includes('Scrooge McDuck') || char.charName.includes('スクルージ')) ? 'スクルージ・マクダック' : char.charName}
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
        )}
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
                <h2 style={{ color: '#ff9f43', margin: '0 0 5px 0', fontSize: '24px' }}>
                  {(selectedCharacter.workTitle === 'Scrooge McDuck' || selectedCharacter.charName.includes('Scrooge McDuck') || selectedCharacter.charName.includes('スクルージ')) ? 'スクルージ・マクダック' : selectedCharacter.charName}
                </h2>
                {/* 🌟 修正：10代目ドクターやスクルージの場合は作品名を強制表示 */}
                <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
                  作品: {
                    ['ドナルド・ピーターソン', 'ロデリック・ピーターソン'].includes(selectedCharacter.charName) ? 'Nativity 2: Danger in the Manger!' :
                    selectedCharacter.charName === '10代目ドクター' ? 'Doctor Whoシリーズ' : 
                    (selectedCharacter.workTitle === 'Scrooge McDuck' || selectedCharacter.charName.includes('Scrooge McDuck') || selectedCharacter.charName.includes('スクルージ')) ? 'ディズニー' : // 🌟 追加
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