'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageHeader from './components/PageHeader';
import FilterControls from './components/FilterControls';
import WorkCard from './components/WorkCard';
import WorkModal from './components/WorkModal';
import AboutModal from './components/AboutModal';
import WorkTimelineView from './components/WorkTimelineView';
import ScrollButtons from './components/ScrollButtons'; 
import { useFilteredWorks } from './hooks/useFilteredWorks';
import { useLocalStorage } from './hooks/useLocalStorage';
import styles from './WorkList.module.css';

export default function WorkList({ works, davidId }: { works: any[], davidId: number }) {
  const [selectedWork, setSelectedWork] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 🌟 カスタムフックのおかげで、1行でローカルストレージと同期可能に！
  const [favoritesList, setFavoritesList] = useLocalStorage<number[]>('favorites', []);
  const [watchedList, setWatchedList] = useLocalStorage<number[]>('watchedWorks', []);

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

  // お気に入り切り替え
  const handleToggleFavorite = (workId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoritesList(prev => prev.includes(workId) ? prev.filter(id => id !== workId) : [...prev, workId]);
  };

  // 視聴済み切り替え
  const handleToggleWatched = (workId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchedList(prev => prev.includes(workId) ? prev.filter(id => id !== workId) : [...prev, workId]);
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
        
        {/* 🌟 共通化されたヘッダーコンポーネントを使用 */}
        <PageHeader title="David Tennant" subtitle="Film" />
        
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
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ color: '#aaa', fontSize: '12px', margin: 0 }}>カードをクリックすると詳細が表示されます</p>
          <p style={{ color: '#d4af37', fontWeight: '500', margin: 0, fontSize: '14px' }}>
            {sortedWorks.length} / {uniqueWorks.length} 作品
          </p>
        </div>
        
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

      <WorkModal work={selectedWork} onClose={() => setSelectedWork(null)} />
      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />
      <ScrollButtons />
      
      <footer style={{ textAlign: 'center', marginTop: '60px', paddingBottom: '20px', color: '#555', fontSize: '12px', letterSpacing: '0.1em' }}>
        DAVID TENNANT FAN DATABASE Ver 3.0
      </footer>
    </main>
  );
}