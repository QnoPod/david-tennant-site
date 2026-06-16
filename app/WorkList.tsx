'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import FilterControls from './components/FilterControls';
import WorkCard from './components/WorkCard';
import WorkModal from './components/WorkModal';

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
  
  // ジャンル管理用ステート
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genreSearchMode, setGenreSearchMode] = useState<'include' | 'exclude'>('include'); // 追加
  const [isExpanded, setIsExpanded] = useState(false);

  const allProviders = useMemo(() => {
    const providersMap = new Set<string>();
    works.forEach(work => work.providers?.forEach((p: any) => providersMap.add(p.provider_name)));
    return Array.from(providersMap);
  }, [works]);

  // 全ジャンル抽出
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
      
      // ジャンルフィルタリングロジック（含める / 除外するの切り替え）
      const matchesGenre = selectedGenres.length === 0 || 
        (genreSearchMode === 'include' 
          ? work.genres?.some((g: any) => selectedGenres.includes(g.name))
          : !work.genres?.some((g: any) => selectedGenres.includes(g.name))
        );
      
      return matchesSearch && matchesProvider && matchesAvailability && matchesGenre;
    });
  }, [uniqueWorks, searchTerm, selectedProviders, availabilityFilter, selectedGenres, genreSearchMode]);

  return (
    <main style={{ padding: '40px 20px', fontFamily: 'sans-serif', backgroundColor: '#141414', minHeight: '100vh', color: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>David Tennant - 作品＆配信情報</h1>
        <div style={{ marginBottom: '20px' }}>
          <Link href="/characters" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#4dabf7', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
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
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
        />

        <p style={{ color: '#aaa', marginBottom: '40px' }}>
          {filteredWorks.length} 件の作品を表示中 (全 {uniqueWorks.length} 作品)
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '30px' }}>
          {filteredWorks.map((work: any, index: number) => (
            <WorkCard key={`${work.id}-${index}`} work={work} onClick={() => setSelectedWork(work)} />
          ))}
        </div>
      </div>
      <WorkModal work={selectedWork} onClose={() => setSelectedWork(null)} />
    </main>
  );
}