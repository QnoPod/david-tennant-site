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
// 🌟 追加：キャラクターの属性データをインポート
import { characterAttributes } from '../data/characterAttributes';

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
  
  // 🌟 追加：属性表示・グループ化を管理するステート
  const [showAttributes, setShowAttributes] = useState(false);

  // 🌟 TMDBのデータを元にキャラクターリストを生成（useMemoで最適化）
  const characters = useMemo(() => {
    return Object.keys(customCharacterInfo).map((workTitle) => {
      const rawInfo = customCharacterInfo[workTitle] || '';
      
      let charName = "情報なし";
      if (rawInfo.includes('：')) {
        charName = rawInfo.split('：')[0].trim();
      } else if (rawInfo.includes('\n')) {
        charName = rawInfo.split('\n')[0].trim();
      } else {
        charName = rawInfo.trim();
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

      // 🌟 修正：説明文から1行目（日本語のキャラクター名）を削除して詳細文だけにする処理
      let cleanDescription = rawInfo.trim();
      if (cleanDescription !== '詳細なキャラクター情報はありません。') {
        const newlineIndex = cleanDescription.indexOf('\n');
        const colonIndex = cleanDescription.indexOf('：');

        if (newlineIndex !== -1 && colonIndex !== -1) {
          const splitIndex = Math.min(newlineIndex, colonIndex);
          cleanDescription = cleanDescription.substring(splitIndex + 1).trim();
        } else if (newlineIndex !== -1) {
          cleanDescription = cleanDescription.substring(newlineIndex + 1).trim();
        } else if (colonIndex !== -1) {
          cleanDescription = cleanDescription.substring(colonIndex + 1).trim();
        } else {
          // コロンも改行もない場合は、名前しか登録されていないと判定して空にする
          cleanDescription = '';
        }
      }
      
      // 🌟 修正：別ファイルから属性情報を取得し、複数タグ対応のために配列にする
      const attrRaw = characterAttributes[charName] || '';
      // 「,」「、」「/」のいずれかで分割して配列化する（両端の空白は除去）
      const attributes = attrRaw ? attrRaw.split(/[、,\/]/).map(s => s.trim()).filter(Boolean) : [];

      return {
        workTitle,
        displayWorkTitle, // 🌟 画面表示用のタイトル
        charName,
        charImage,
        fullDescription: cleanDescription, // 🌟 修正：切り落とした後の説明文を渡す
        year, // 🌟 取得した年データを持たせる
        age,   // 🌟 追加：算出した年齢を持たせる
        attributes // 🌟 修正：複数の属性を持てるように配列で渡す
      };
    }).sort((a, b) => {
      // 🌟 修正：タイムライン表示のときは公開年（新しい順/降順）でソート、グリッドのときは五十音順でソート
      if (viewMode === 'timeline') {
        const yearA = a.year === '年不明' ? 0 : parseInt(a.year); // 年不明は一番最後にするため 0 扱い
        const yearB = b.year === '年不明' ? 0 : parseInt(b.year);
        
        if (yearA !== yearB) {
          return yearB - yearA; // 新しい順（降順）
        }
        
        // 🌟 追加：公開年が同じ場合は年齢が高いほうを上にくるように修正
        const ageA = a.age === '不明' ? 0 : Number(a.age);
        const ageB = b.age === '不明' ? 0 : Number(b.age);
        if (ageA !== ageB) {
          return ageB - ageA; // 年齢の高い順（降順）
        }
      }
      return a.charName.localeCompare(b.charName, 'ja');
    });
  }, [tmdbWorks, viewMode]);

  // 🌟 追加：表示切替用の関数
  const handleToggleView = () => {
    setViewMode(prev => prev === 'grid' ? 'timeline' : 'grid');
  };

  // 🌟 修正：属性でグループ化したデータを作成（複数タグ対応）
  const groupedCharacters = useMemo(() => {
    const groups: Record<string, typeof characters> = {};
    characters.forEach(char => {
      if (char.attributes && char.attributes.length > 0) {
        // キャラクターが持つ複数のタグそれぞれに対してグループに追加
        char.attributes.forEach((attr: string) => {
          if (!groups[attr]) groups[attr] = [];
          // 同じキャラが同じ枠に重複して入らないように念のためチェック
          if (!groups[attr].find(c => c.workTitle === char.workTitle && c.charName === char.charName)) {
            groups[attr].push(char);
          }
        });
      } else {
        // 属性がない場合は「その他」
        if (!groups['その他']) groups['その他'] = [];
        groups['その他'].push(char);
      }
    });
    return groups;
  }, [characters]);

  // 🌟 修正：グループのキーをソート（「その他職業」「その他」を最後に回す）
  const groupKeys = Object.keys(groupedCharacters).sort((a, b) => {
    const getPriority = (key: string) => {
      if (key === 'その他') return 2;
      if (key === 'その他職業') return 1;
      return 0;
    };
    
    const pA = getPriority(a);
    const pB = getPriority(b);
    
    // 優先度が異なる場合は優先度でソート（数値が大きいほど後ろ）
    if (pA !== pB) {
      return pA - pB;
    }
    
    // 優先度が同じ場合は五十音順
    return a.localeCompare(b, 'ja');
  });

  // 🌟 追加：属性タグをクリックした時にそのグループ枠へスクロールする関数[cite: 14]
  const handleAttributeClick = (attr: string, e: React.MouseEvent) => {
    e.stopPropagation(); // キャラクターカード自体のクリックイベント（モーダルを開く処理）を止める
    setSelectedCharacter(null); // モーダル内でクリックされた場合に備えて閉じる

    if (!showAttributes) {
      setShowAttributes(true);
      // レンダリングを待ってからスクロール
      setTimeout(() => {
        const el = document.getElementById(`attr-group-${attr}`);
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 80; // 少し上に余白を持たせる
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

  // 🌟 グリッド表示のレンダリング関数
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
          {/* 🌟 属性表示がONのときだけバッジを表示（複数タグ対応で縦並び） */}
          {showAttributes && char.attributes && char.attributes.length > 0 && (
            <div style={{ 
              position: 'absolute', top: '10px', right: '10px', 
              display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', zIndex: 2
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
        </div>
      ))}
    </div>
  );

  // 🌟 タイムライン表示のレンダリング関数
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
                
                {/* 🌟 属性表示ONのときのみバッジ表示（複数対応で横並び） */}
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
        .toggle-btn.active {
          background-color: #ff9f43;
          color: #1a1a1a;
          border-color: #ff9f43;
        }

        /* 🌟 属性バッジのホバーアクション用CSSを追加 */
        .attr-badge {
          cursor: pointer;
          transition: transform 0.1s, opacity 0.1s;
        }
        .attr-badge:hover {
          transform: scale(1.05);
          opacity: 0.8;
        }

        /* 🌟 タイムライン表示用のCSS */
        .timeline-container {
          position: relative;
          max-width: 900px;
          margin: 20px auto 0;
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

              {/* 🌟 属性表示切り替えボタン */}
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

        {/* 🌟 属性表示ONのときは枠付きグループとしてレンダリング */}
        {showAttributes ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {groupKeys.map(attr => (
              <div 
                key={attr} 
                id={`attr-group-${attr}`} // 🌟 追加：スクロール用のIDを付与
                style={{ 
                  border: '2px dashed #444', 
                  borderRadius: '16px', 
                  padding: '35px 20px 20px', 
                  position: 'relative',
                  scrollMarginTop: '20px' // スクロール時に少し上に余白を持たせる
                }}
              >
                {/* 🌟 グループ枠のタイトル（属性名） */}
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
                
                {/* 🌟 現在の表示モードに合わせて各グループ内を描画 */}
                {viewMode === 'grid' 
                  ? renderCharacterGrid(groupedCharacters[attr]) 
                  : renderCharacterTimeline(groupedCharacters[attr])}
              </div>
            ))}
          </div>
        ) : (
          /* 🌟 属性表示OFFのときは通常のリストとしてレンダリング */
          viewMode === 'grid' ? renderCharacterGrid(characters) : renderCharacterTimeline(characters)
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
                <h2 style={{ color: '#ff9f43', margin: '0 0 5px 0', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {(selectedCharacter.workTitle === 'Scrooge McDuck' || selectedCharacter.charName.includes('Scrooge McDuck') || selectedCharacter.charName.includes('スクルージ')) ? 'スクルージ・マクダック' : selectedCharacter.charName}
                  
                  {/* 🌟 属性表示ONのとき、モーダルにも属性バッジを表示（複数対応） */}
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