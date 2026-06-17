'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import FilterControls from './components/FilterControls';
import WorkCard from './components/WorkCard';
import WorkModal from './components/WorkModal';
import ScrollButtons from './components/ScrollButtons'; 

export default function WorkList({ works, davidId }: { works: any[], davidId: number }) {
  const uniqueWorks = useMemo(() => {
    const map = new Map();
    works.forEach((work) => {
      const title = work.title || work.name;
      if (!map.has(title)) map.set(title, work);
    });
    return Array.from(map.values());
  }, [works]);

  const [selectedWork, setSelectedWork] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'default' | 'popularity' | 'title'>('default');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  
  // 🌟 お気に入りリストをリアルタイム管理
  const [favorites, setFavorites] = useState<number[]>([]);

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genreSearchMode, setGenreSearchMode] = useState<'include' | 'exclude'>('include');
  const [isExpanded, setIsExpanded] = useState(false);

  // 🌟 イベント受信でお気に入りを更新
  useEffect(() => {
    const loadFavorites = () => {
      const favs = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('favorites') || '[]') 
        : [];
      setFavorites(favs);
    };
    
    loadFavorites();

    window.addEventListener('favoritesUpdated', loadFavorites);
    return () => window.removeEventListener('favoritesUpdated', loadFavorites);
  }, []);

  const allProviders = useMemo(() => {
    const providersMap = new Set<string>();
    works.forEach(work => work.providers?.forEach((p: any) => providersMap.add(p.provider_name)));
    return Array.from(providersMap);
  }, [works]);

  const allGenres = useMemo(() => {
    const genresSet = new Set<string>();
    works.forEach(work => work.genres?.forEach((g: any) => genresSet.add(g.name)));
    return Array.from(genresSet).sort();
  }, [works]);

  const toggleProvider = (name: string) => {
    setSelectedProviders(prev => 
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const filteredWorks = useMemo(() => {
    return uniqueWorks.filter((work: any) => {
      const matchesSearch = (work.title || work.name).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProvider = selectedProviders.length === 0 || 
        work.providers?.some((p: any) => selectedProviders.includes(p.provider_name));
      
      const hasProviders = work.providers && work.providers.length > 0;
      const matchesAvailability = 
        availabilityFilter === 'ALL' ? true :
        availabilityFilter === 'AVAILABLE' ? hasProviders : !hasProviders;
      
      const matchesGenre = selectedGenres.length === 0 || 
        (genreSearchMode === 'include' 
          ? work.genres?.some((g: any) => selectedGenres.includes(g.name))
          : !work.genres?.some((g: any) => selectedGenres.includes(g.name))
        );

      const matchesFavorites = !showOnlyFavorites || favorites.includes(work.id);
      
      return matchesSearch && matchesProvider && matchesAvailability && matchesGenre && matchesFavorites;
    });
  }, [uniqueWorks, searchTerm, selectedProviders, availabilityFilter, selectedGenres, genreSearchMode, showOnlyFavorites, favorites]);

  const sortedWorks = useMemo(() => {
    let list = [...filteredWorks];
    if (sortOrder === 'popularity') {
      list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else if (sortOrder === 'title') {
      list.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));
    }
    return list;
  }, [filteredWorks, sortOrder]);

  return (
    <main style={{ padding: '40px 20px', fontFamily: 'sans-serif', backgroundColor: '#141414', minHeight: '100vh', color: '#fff' }}>
      
      {/* 🌟 スマホとPCでレイアウトと文字サイズを切り替えるCSS */}
      <style>{`
        .work-grid {
          display: grid;
          /* PC表示: 横幅220px以上で並べられるだけ並べる */
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 30px;
          
          /* 🎨 PC用の各サイズ設定（変数） */
          --card-padding: 15px;
          --title-size: 16px;
          --meta-size: 12px;
          --icon-size: 32px;
          --icon-gap: 8px;
          --fav-btn-size: 36px;
          --fav-btn-font: 18px;
        }
        
        /* スマホ表示 (横幅600px以下) の場合 */
        @media (max-width: 600px) {
          .work-grid {
            /* 強制的に3列にする */
            grid-template-columns: repeat(3, 1fr);
            /* スマホの画面に合わせて隙間を狭くする */
            gap: 10px;
            
            /* 🎨 スマホ用に各サイズを全体的にギュッと小さくする */
            --card-padding: 8px;
            --title-size: 11px;
            --meta-size: 9px;
            --icon-size: 20px;
            --icon-gap: 4px;
            --fav-btn-size: 26px;
            --fav-btn-font: 14px;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>David Tennant - 作品＆配信情報</h1>
        <div style={{ marginBottom: '20px' }}>
          <Link href="/characters" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#ff9f43', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
            👥 キャラクターリストを見る
          </Link>
        </div>
        
        <FilterControls 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          availabilityFilter={availabilityFilter}
          setAvailabilityFilter={setAvailabilityFilter}
          allProviders={allProviders}
          selectedProviders={selectedProviders}
          toggleProvider={toggleProvider}
          setSelectedProviders={setSelectedProviders}
          allGenres={allGenres}
          selectedGenres={selectedGenres}
          setSelectedGenres={setSelectedGenres}
          genreSearchMode={genreSearchMode}
          setGenreSearchMode={setGenreSearchMode}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          showOnlyFavorites={showOnlyFavorites}
          setShowOnlyFavorites={setShowOnlyFavorites}
        />

        <p style={{ color: '#aaa', marginBottom: '40px' }}>
          {sortedWorks.length} 件の作品を表示中 (全 {uniqueWorks.length} 作品)
        </p>
        
        {/* 🌟 inlineのstyleを消して、className="work-grid" を適用 */}
        <div className="work-grid">
          {sortedWorks.map((work: any, index: number) => (
            <WorkCard key={`${work.id}-${index}`} work={work} onClick={() => setSelectedWork(work)} />
          ))}
        </div>
      </div>
      <WorkModal work={selectedWork} onClose={() => setSelectedWork(null)} />
      <ScrollButtons />
    </main>
  );
}