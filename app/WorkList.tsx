'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import FilterControls from './components/FilterControls';
import WorkCard from './components/WorkCard';
import WorkModal from './components/WorkModal';

export default function WorkList({ works, davidId }: { works: any[], davidId: number }) {
  // 重複排除して「作品名」でまとめる
  const uniqueWorks = useMemo(() => {
    const map = new Map();
    works.forEach((work) => {
      const title = work.title || work.name;
      if (!map.has(title)) {
        map.set(title, work);
      }
    });
    return Array.from(map.values());
  }, [works]);

  const [selectedWork, setSelectedWork] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');

  // 配信サービスのリストを全作品から抽出
  const allProviders = useMemo(() => {
    const providersMap = new Set<string>();
    works.forEach(work => {
      work.providers?.forEach((p: any) => providersMap.add(p.provider_name));
    });
    return Array.from(providersMap);
  }, [works]);

  // チェックボックスの切り替え用関数
  const toggleProvider = (name: string) => {
    setSelectedProviders(prev => 
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  // 検索と配信サービスの両方で絞り込み
  const filteredWorks = useMemo(() => {
    return uniqueWorks.filter((work: any) => {
      const matchesSearch = (work.title || work.name).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProvider = selectedProviders.length === 0 || 
        work.providers?.some((p: any) => selectedProviders.includes(p.provider_name));
      
      const hasProviders = work.providers && work.providers.length > 0;
      const matchesAvailability = 
        availabilityFilter === 'ALL' ? true :
        availabilityFilter === 'AVAILABLE' ? hasProviders : !hasProviders;
      
      return matchesSearch && matchesProvider && matchesAvailability;
    });
  }, [uniqueWorks, searchTerm, selectedProviders, availabilityFilter]);

  return (
    <main style={{ padding: '40px 20px', fontFamily: 'sans-serif', backgroundColor: '#141414', minHeight: '100vh', color: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>David Tennant - 作品＆配信情報</h1>
        <div style={{ marginBottom: '20px' }}>
          <Link href="/characters" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#4dabf7', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
            👥 キャラクターリストを見る
          </Link>
        </div>
        <p style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>
          ※テスト運用中です 何かあれば@QnoPodまで
        </p>

        {/* 🌟 1. 切り出した検索・フィルターコンポーネントを配置 */}
        <FilterControls 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          availabilityFilter={availabilityFilter}
          setAvailabilityFilter={setAvailabilityFilter}
          allProviders={allProviders}
          selectedProviders={selectedProviders}
          toggleProvider={toggleProvider}
          setSelectedProviders={setSelectedProviders}
        />

        <p style={{ color: '#aaa', marginBottom: '40px' }}>
          {filteredWorks.length} 件の作品を表示中 (全 {uniqueWorks.length} 作品)
        </p>
        
        {/* 🌟 2. 切り出した作品カードコンポーネントを配置 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '30px' }}>
          {filteredWorks.map((work: any, index: number) => (
            <WorkCard key={`${work.id}-${index}`} work={work} onClick={() => setSelectedWork(work)} />
          ))}
        </div>
      </div>

      {/* 🌟 3. 切り出した詳細モーダルコンポーネントを配置 */}
      <WorkModal work={selectedWork} onClose={() => setSelectedWork(null)} />
      
    </main>
  );
}