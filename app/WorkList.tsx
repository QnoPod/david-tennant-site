'use client';

import { useState } from 'react';
import Link from 'next/link';
import FilterControls from './components/FilterControls';
import WorkCard from './components/WorkCard';
import WorkModal from './components/WorkModal';
import ScrollButtons from './components/ScrollButtons'; 
import { siteUpdates } from './data/updates';

// 🌟 新しく作成したカスタムフックをインポート
// 複雑なデータ処理や検索ロジックはすべてこのファイルに逃がしています
import { useFilteredWorks } from './hooks/useFilteredWorks';

/**
 * ==========================================
 * WorkList.tsx
 * ==========================================
 * 【このファイルがしていること】
 * 1. サイトのトップページにあたる「作品一覧画面のUI（見た目）」を描画するメインコンポーネントです。
 * 2. 検索機能の計算や並び替えといった「頭脳」の部分は useFilteredWorks に任せ、
 * ここでは「計算済みのデータを受け取って画面に並べるだけ」の役割に徹しています。
 * 3. グリッド表示とタイムライン表示の切り替えUIを描画します。
 * 4. ユーザーが作品をクリックしたときの「詳細モーダル」や「更新履歴モーダル」の開閉を管理します。
 */
export default function WorkList({ works, davidId }: { works: any[], davidId: number }) {
  
  // 🌟 UIの表示状態（見た目に関するもの）だけをここで管理します
  const [selectedWork, setSelectedWork] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 🌟 複雑なデータ処理・検索・ソートのロジックはフックに丸投げ！
  // フックから、検索キーワードや絞り込み済みの作品リスト（sortedWorks）だけを受け取ります
  const {
    searchTerm, setSearchTerm,
    charSearchTerm, setCharSearchTerm,
    selectedProviders, setSelectedProviders, toggleProvider,
    availabilityFilter, setAvailabilityFilter,
    watchStatusFilter, setWatchStatusFilter, // 🌟 フックから視聴済フィルターを受け取る
    sortOrder, setSortOrder,
    showOnlyFavorites, setShowOnlyFavorites,
    selectedGenres, setSelectedGenres,
    genreSearchMode, setGenreSearchMode,
    allProviders, allGenres,
    uniqueWorks, sortedWorks, activeSortOrder
  } = useFilteredWorks(works, viewMode);

  // 🌟 表示モード（グリッド ⇔ タイムライン）の切り替え処理
  const handleToggleView = () => {
    setViewMode(prev => {
      const nextMode = prev === 'grid' ? 'timeline' : 'grid';
      // タイムラインに切り替えた瞬間、裏側のソート状態を強制的に「公開順」に戻す
      if (nextMode === 'timeline') {
        setSortOrder('default'); 
      }
      return nextMode;
    });
  };

  // 🌟 画面のレンダリング（HTML/CSS部分）
  return (
    <main style={{ padding: '40px 20px', fontFamily: 'sans-serif', backgroundColor: '#141414', minHeight: '100vh', color: '#fff' }}>
      
      {/* --- レスポンシブ用CSS --- */}
      <style>{`
        .work-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 30px;
          --card-padding: 15px;
          --title-size: 16px;
          --meta-size: 12px;
          --icon-size: 32px;
          --icon-gap: 8px;
          --fav-btn-size: 36px;
          --fav-btn-font: 18px;
        }
        .main-title { font-size: 32px; }
        .about-btn {
          color: #fff; border: 1px solid #444; padding: 6px 12px; font-size: 13px;
          background-color: #222; border-radius: 8px; font-weight: bold; cursor: pointer; transition: background-color 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .about-btn:hover { background-color: #333; }
        
        .timeline-container { position: relative; max-width: 900px; margin: 40px auto; padding: 20px 0; }
        .timeline-container::after { content: ''; position: absolute; width: 4px; background-color: #4dabf7; top: 0; bottom: 0; left: 50%; margin-left: -2px; border-radius: 2px; }
        .timeline-item { padding: 10px 40px; position: relative; width: 50%; box-sizing: border-box; margin-bottom: 20px; }
        .timeline-item:nth-child(odd) { left: 0; text-align: right; }
        .timeline-item:nth-child(even) { left: 50%; text-align: left; }
        .timeline-dot { position: absolute; width: 20px; height: 20px; background-color: #ff9f43; border: 4px solid #141414; border-radius: 50%; top: calc(50% - 10px); z-index: 1; }
        .timeline-item:nth-child(odd) .timeline-dot { right: -10px; }
        .timeline-item:nth-child(even) .timeline-dot { left: -10px; }
        .timeline-content { background-color: #222; border-radius: 12px; padding: 15px; display: inline-flex; align-items: center; gap: 15px; text-align: left; cursor: pointer; transition: transform 0.2s, background-color 0.2s; width: 100%; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .timeline-content:hover { transform: scale(1.02); background-color: #333; }
        .timeline-date { font-weight: bold; color: #ff9f43; margin-bottom: 5px; font-size: 16px; }

        @media (max-width: 600px) {
          .work-grid {
            grid-template-columns: repeat(3, 1fr); gap: 10px;
            --card-padding: 8px; --title-size: 11px; --meta-size: 9px; --icon-size: 20px; --icon-gap: 4px; --fav-btn-size: 26px; --fav-btn-font: 14px;
          }
          .main-title { font-size: 24px; }
          .title-dash { display: none; }
          .title-sub { display: block; font-size: 18px; margin-top: 4px; }
          .timeline-container::after { left: 20px; }
          .timeline-item { width: 100%; padding-left: 50px; padding-right: 0; left: 0 !important; text-align: left !important; }
          .timeline-dot { left: 10px !important; right: auto !important; }
          .timeline-content { flex-direction: row; }
        }

        ${viewMode === 'timeline' ? `select option:not([value="default"]) { display: none !important; }` : ''}
      `}</style>
      {/* --------------------------- */}

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* ヘッダー・ボタン群 */}
        <h1 className="main-title" style={{ marginBottom: '10px' }}>
          David Tennant<span className="title-dash"> - </span><span className="title-sub">作品＆配信情報</span>
        </h1>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <Link href="/characters" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 20px', backgroundColor: '#ff9f43', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
            👥 キャラクターリストを見る
          </Link>
          <button className="about-btn" onClick={handleToggleView}>
            {viewMode === 'grid' ? '📅 タイムライン表示' : '🔲 グリッド表示'}
          </button>
          <button className="about-btn" onClick={() => setShowAboutModal(true)}>
             ℹ️ サイトについて・更新履歴
          </button>
        </div>
        
        {/* 検索・絞り込みコントロールコンポーネント */}
        <FilterControls 
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          charSearchTerm={charSearchTerm} setCharSearchTerm={setCharSearchTerm}
          availabilityFilter={availabilityFilter} setAvailabilityFilter={setAvailabilityFilter}
          watchStatusFilter={watchStatusFilter} setWatchStatusFilter={setWatchStatusFilter} // 🌟 子コンポーネントにフィルター状態を渡す
          allProviders={allProviders} selectedProviders={selectedProviders} toggleProvider={toggleProvider} setSelectedProviders={setSelectedProviders}
          allGenres={allGenres} selectedGenres={selectedGenres} setSelectedGenres={setSelectedGenres}
          genreSearchMode={genreSearchMode} setGenreSearchMode={setGenreSearchMode}
          sortOrder={activeSortOrder}
          setSortOrder={(val) => { if (viewMode !== 'timeline') setSortOrder(val); }}
          isExpanded={isExpanded} setIsExpanded={setIsExpanded}
          showOnlyFavorites={showOnlyFavorites} setShowOnlyFavorites={setShowOnlyFavorites}
        />
        
        <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '15px' }}>
          カードをクリックすると詳細が表示されます
        </p>
        <p style={{ color: '#aaa', marginBottom: '40px' }}>
          {sortedWorks.length} 件の作品を表示中 (全 {uniqueWorks.length} 作品)
        </p>
        
        {/* リストの描画（グリッド or タイムライン） */}
        {viewMode === 'grid' ? (
          <div className="work-grid">
            {sortedWorks.map((work: any, index: number) => (
              <WorkCard key={`${work.id}-${index}`} work={work} onClick={() => setSelectedWork(work)} />
            ))}
          </div>
        ) : (
          <div className="timeline-container">
            {sortedWorks.map((work: any, index: number) => {
              const year = work.first_air_date ? work.first_air_date.substring(0, 4) : work.release_date ? work.release_date.substring(0, 4) : '年不明';
              return (
                <div key={`${work.id}-${index}`} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content" onClick={() => setSelectedWork(work)}>
                    {work.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w200${work.poster_path}`} alt={work.title || work.name} style={{ width: '70px', height: '105px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '70px', height: '105px', backgroundColor: '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '24px' }}>🎬</div>
                    )}
                    <div>
                      <div className="timeline-date">{year}</div>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#fff', lineHeight: '1.3' }}>{work.title || work.name}</h3>
                      <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                        {work.media_type === 'movie' ? '🎬 映画' : '📺 TV番組'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 作品詳細モーダル */}
      <WorkModal work={selectedWork} onClose={() => setSelectedWork(null)} />
      
      {/* サイトについて・更新履歴モーダル */}
      {showAboutModal && (
        <div onClick={() => setShowAboutModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '16px', maxWidth: '600px', width: '100%', position: 'relative', maxHeight: '80vh', overflowY: 'auto' }}>
            <button onClick={() => setShowAboutModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            <h2 style={{ color: '#ff9f43', marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>ℹ️ サイトについて</h2>
            <p style={{ color: '#ddd', fontSize: '15px', lineHeight: '1.8', marginBottom: '30px' }}>
              当サイトは、デヴィッド・テナントの出演作品およびキャラクターの情報をまとめた非公式のファンデータベースです。<br />
              配信状況の確認や、各キャラクターの詳細設定を振り返るのにお役立てください。
            </p>
            <h2 style={{ color: '#ff9f43', margin: '0 0 20px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>🕒 更新履歴</h2>
            <ul style={{ color: '#ddd', fontSize: '14px', lineHeight: '2.0', paddingLeft: '20px', margin: 0 }}>
              {siteUpdates.map((update: any, index: number) => (
                <li key={index} style={{ color: update.isImportant ? '#ff9f43' : '#ddd', fontWeight: update.isImportant ? 'bold' : 'normal' }}>
                  <strong>{update.date}</strong> - {update.content}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <ScrollButtons />
      <footer style={{ textAlign: 'center', marginTop: '60px', paddingBottom: '20px', color: '#666', fontSize: '14px' }}>
        Ver 3.0
      </footer>
    </main>
  );
}