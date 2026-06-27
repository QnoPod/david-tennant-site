'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import FilterControls from './components/FilterControls';
import WorkCard from './components/WorkCard';
import WorkModal from './components/WorkModal';
import AboutModal from './components/AboutModal';
import WorkTimelineView from './components/WorkTimelineView';
import ScrollButtons from './components/ScrollButtons'; 
import { useFilteredWorks } from './hooks/useFilteredWorks';
import styles from './WorkList.module.css';

export default function WorkList({ works, davidId }: { works: any[], davidId: number }) {
  const [selectedWork, setSelectedWork] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [favoritesList, setFavoritesList] = useState<number[]>([]);
  const [watchedList, setWatchedList] = useState<number[]>([]);

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

  useEffect(() => {
    const loadSavedData = () => {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      const watched = JSON.parse(localStorage.getItem('watchedWorks') || '[]');
      setFavoritesList(favs);
      setWatchedList(watched);
    };

    loadSavedData();

    window.addEventListener('favoritesUpdated', loadSavedData);
    window.addEventListener('watchedUpdated', loadSavedData);
    return () => {
      window.removeEventListener('favoritesUpdated', loadSavedData);
      window.removeEventListener('watchedUpdated', loadSavedData);
    };
  }, []);

  const handleToggleFavorite = (workId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    let newFavorites = favoritesList.includes(workId)
      ? favoritesList.filter(id => id !== workId)
      : [...favoritesList, workId];
    
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setFavoritesList(newFavorites);
    window.dispatchEvent(new Event('favoritesUpdated'));
  };

  const handleToggleWatched = (workId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    let newWatched = watchedList.includes(workId)
      ? watchedList.filter(id => id !== workId)
      : [...watchedList, workId];

    localStorage.setItem('watchedWorks', JSON.stringify(newWatched));
    setWatchedList(newWatched);
    window.dispatchEvent(new Event('watchedUpdated'));
  };

  const handleToggleView = () => {
    setViewMode(prev => {
      const nextMode = prev === 'grid' ? 'timeline' : 'grid';
      if (nextMode === 'timeline') setSortOrder('default'); 
      return nextMode;
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCharSearchTerm('');
    setAvailabilityFilter('ALL');
    setWatchStatusFilter('ALL');
    setSelectedProviders([]);
    setSelectedGenres([]);
    setShowOnlyFavorites(false);
    setSortOrder('default');
    setGenreSearchMode('include');
    setIsExpanded(false);
  };

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        
        {/* タイトルセクション */}
        <div className={styles.titleContainer}>
          <h1 className={styles.mainTitle}>David Tennant</h1>
          <h2 className={styles.subTitle}>Film</h2>
        </div>
        
        {/* ナビゲーションバー */}
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
        
        {/* フィルターコントロール */}
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
            onReset={handleResetFilters}
          />
        </div>
        
        {/* カウンター・補助テキスト */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ color: '#aaa', fontSize: '12px', margin: 0 }}>カードをクリックすると詳細が表示されます</p>
          <p style={{ color: '#d4af37', fontWeight: '500', margin: 0, fontSize: '14px' }}>
            {sortedWorks.length} / {uniqueWorks.length} 作品
          </p>
        </div>
        
        {/* メインコンテンツビュー切り替え */}
        {viewMode === 'grid' ? (
          <div className={styles.workGrid}>
            {sortedWorks.map((work: any, index: number) => (
              <WorkCard 
                key={`${work.id}-${index}`} 
                work={work} 
                onClick={() => setSelectedWork(work)}
                isFavorite={favoritesList.includes(work.id)}
                isWatched={watchedList.includes(work.id)}
                onToggleFavorite={(e) => handleToggleFavorite(work.id, e)}
                onToggleWatched={(e) => handleToggleWatched(work.id, e)}
              />
            ))}
          </div>
        ) : (
          <WorkTimelineView sortedWorks={sortedWorks} onWorkClick={setSelectedWork} />
        )}

      </div>

      {/* 各種モーダル・フローティング要素 */}
      <WorkModal work={selectedWork} onClose={() => setSelectedWork(null)} />
      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />
      <ScrollButtons />
      
      <footer style={{ textAlign: 'center', marginTop: '60px', paddingBottom: '20px', color: '#555', fontSize: '12px', letterSpacing: '0.1em' }}>
        DAVID TENNANT FAN DATABASE Ver 3.0
      </footer>
    </main>
  );
}