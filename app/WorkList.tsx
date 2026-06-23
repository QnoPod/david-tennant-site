'use client';

import { useState } from 'react';
import Link from 'next/link';
import FilterControls from './components/FilterControls';
import WorkCard from './components/WorkCard';
import WorkModal from './components/WorkModal';
import ScrollButtons from './components/ScrollButtons'; 
import { siteUpdates } from './data/updates';
import { useFilteredWorks } from './hooks/useFilteredWorks';
import styles from './WorkList.module.css';

export default function WorkList({ works, davidId }: { works: any[], davidId: number }) {
  const [selectedWork, setSelectedWork] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    searchTerm, setSearchTerm, charSearchTerm, setCharSearchTerm,
    selectedProviders, setSelectedProviders, toggleProvider,
    availabilityFilter, setAvailabilityFilter,
    watchStatusFilter, setWatchStatusFilter,
    sortOrder, setSortOrder,
    showOnlyFavorites, setShowOnlyFavorites,
    selectedGenres, setSelectedGenres,
    genreSearchMode, setGenreSearchMode,
    allProviders, allGenres,
    uniqueWorks, sortedWorks, activeSortOrder
  } = useFilteredWorks(works, viewMode);

  const handleToggleView = () => {
    setViewMode(prev => {
      const nextMode = prev === 'grid' ? 'timeline' : 'grid';
      if (nextMode === 'timeline') setSortOrder('default'); 
      return nextMode;
    });
  };

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        
        {/* 🌟 2段組のタイトル構成 */}
        <div className={styles.titleContainer}>
          <h1 className={styles.mainTitle}>David Tennant</h1>
          <h2 className={styles.subTitle}>Film</h2>
        </div>
        
        {/* 🌟 ボタン群 */}
        <div className={styles.topNav}>
          <Link href="/characters" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
            <span style={{ color: '#4a38df', fontSize: '14px' }}>👥</span> キャラクターリストを見る
          </Link>
          <button className={styles.actionBtn} onClick={handleToggleView}>
            <span style={{ color: '#7aa5d2', fontSize: '14px' }}>📅</span> {viewMode === 'grid' ? 'タイムライン表示' : 'グリッド表示'}
          </button>
          <button className={styles.actionBtn} onClick={() => setShowAboutModal(true)}>
             <span style={{ color: '#7aa5d2', fontSize: '14px' }}>ℹ️</span> サイトについて・更新履歴
          </button>
        </div>
        
        {/* 🌟 フィルター全体も少し小さく見せるためにスタイル追加 */}
        <div style={{ fontSize: '13px' }}>
          <FilterControls 
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            charSearchTerm={charSearchTerm} setCharSearchTerm={setCharSearchTerm}
            availabilityFilter={availabilityFilter} setAvailabilityFilter={setAvailabilityFilter}
            watchStatusFilter={watchStatusFilter} setWatchStatusFilter={setWatchStatusFilter}
            allProviders={allProviders} selectedProviders={selectedProviders} toggleProvider={toggleProvider} setSelectedProviders={setSelectedProviders}
            allGenres={allGenres} selectedGenres={selectedGenres} setSelectedGenres={setSelectedGenres}
            genreSearchMode={genreSearchMode} setGenreSearchMode={setGenreSearchMode}
            sortOrder={activeSortOrder}
            setSortOrder={(val) => { if (viewMode !== 'timeline') setSortOrder(val); }}
            isExpanded={isExpanded} setIsExpanded={setIsExpanded}
            showOnlyFavorites={showOnlyFavorites} setShowOnlyFavorites={setShowOnlyFavorites}
          />
        </div>
        
        {/* 🌟 案内文と作品数 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', marginTop: '20px' }}>
          <p style={{ color: '#aaa', fontSize: '12px', margin: 0 }}>
            カードをクリックすると詳細が表示されます
          </p>
          <p style={{ color: '#d4af37', fontWeight: '500', margin: 0, fontSize: '14px' }}>
            {sortedWorks.length} / {uniqueWorks.length} 作品
          </p>
        </div>
        
        {viewMode === 'grid' ? (
          <div className={styles.workGrid}>
            {sortedWorks.map((work: any, index: number) => (
              <WorkCard key={`${work.id}-${index}`} work={work} onClick={() => setSelectedWork(work)} />
            ))}
          </div>
        ) : (
          <div className={styles.timelineContainer}>
            {sortedWorks.map((work: any, index: number) => {
              const year = work.first_air_date ? work.first_air_date.substring(0, 4) : work.release_date ? work.release_date.substring(0, 4) : '年不明';
              return (
                <div key={`${work.id}-${index}`} className={styles.timelineItem}>
                  <div className={styles.timelineDot}></div>
                  <div className={styles.timelineContent} onClick={() => setSelectedWork(work)}>
                    {work.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w200${work.poster_path}`} alt={work.title || work.name} style={{ width: '70px', height: '105px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '70px', height: '105px', backgroundColor: '#0a0a0c', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px', opacity: 0.5 }}>🎬</div>
                    )}
                    <div>
                      <div className={styles.timelineDate}>{year}</div>
                      <h3 className={styles.timelineTitle}>{work.title || work.name}</h3>
                      <p className={styles.timelineMeta}>
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

      <WorkModal work={selectedWork} onClose={() => setSelectedWork(null)} />
      
      {showAboutModal && (
        <div onClick={() => setShowAboutModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#16161a', padding: '30px', borderRadius: '12px', maxWidth: '600px', width: '100%', position: 'relative', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', maxHeight: '80vh', overflowY: 'auto' }}>
            <button onClick={() => setShowAboutModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#666', fontSize: '20px', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#666'}>✕</button>
            <h2 style={{ color: '#d4af37', marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '12px', fontWeight: '500', fontSize: '20px' }}>ℹ️ サイトについて</h2>
            <p style={{ color: '#d0d0d0', fontSize: '13px', lineHeight: '1.8', marginBottom: '30px', letterSpacing: '0.03em' }}>
              当サイトは、デヴィッド・テナントの出演作品およびキャラクターの情報をまとめた非公式のファンデータベースです。<br />
              配信状況の確認や、各キャラクターの詳細設定を振り返るのにお役立てください。
            </p>
            <h2 style={{ color: '#d4af37', margin: '0 0 16px 0', borderBottom: '1px solid #333', paddingBottom: '12px', fontWeight: '500', fontSize: '18px' }}>🕒 更新履歴</h2>
            <ul style={{ color: '#d0d0d0', fontSize: '13px', lineHeight: '2', paddingLeft: '20px', margin: 0 }}>
              {siteUpdates.map((update: any, index: number) => (
                <li key={index} style={{ color: update.isImportant ? '#d4af37' : '#d0d0d0', fontWeight: update.isImportant ? 'bold' : 'normal' }}>
                  <strong>{update.date}</strong> - {update.content}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <ScrollButtons />
      <footer style={{ textAlign: 'center', marginTop: '60px', paddingBottom: '20px', color: '#555', fontSize: '12px', letterSpacing: '0.1em' }}>
        DAVID TENNANT FAN DATABASE Ver 3.0
      </footer>
    </main>
  );
}