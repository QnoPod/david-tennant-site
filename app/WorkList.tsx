'use client';

import { useState, useMemo } from 'react';
import { customOverviews } from './data/overviews';
import { customCharacterImages } from './data/characters';
import { customCharacterInfo } from './data/details';




export default function WorkList({ works, davidId }: { works: any[], davidId: number }) {
    // 🌟 重複排除して「作品名」でまとめる
  const uniqueWorks = useMemo(() => {
    const map = new Map();
    works.forEach((work) => {
      const title = work.title || work.name;
      if (map.has(title)) {
        // すでに存在する場合：プロバイダー情報を結合したり、必要な情報を維持
        const existing = map.get(title);
        // 必要に応じてここで統合ロジックを追加（例：プロバイダー情報のマージ）
      } else {
        map.set(title, work);
      }
    });
    return Array.from(map.values());
  }, [works]);

  const [selectedWork, setSelectedWork] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
 // 🌟 新機能：配信状況フィルター ("ALL", "AVAILABLE", "UNAVAILABLE")
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');


  
 // 配信サービスのリストを全作品から抽出（重複なし）
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
     
     // 🌟 配信状況の判定
      const hasProviders = work.providers && work.providers.length > 0;
      const matchesAvailability = 
        availabilityFilter === 'ALL' ? true :
        availabilityFilter === 'AVAILABLE' ? hasProviders : !hasProviders;
     
     
        return matchesSearch && matchesProvider && matchesAvailability;
    });

 }, [works, searchTerm, selectedProviders, availabilityFilter]);

  
 
  return (
    <main style={{ padding: '40px 20px', fontFamily: 'sans-serif', backgroundColor: '#141414', minHeight: '100vh', color: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>David Tennant - 作品＆配信情報</h1>

    <p style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>
  ※テスト運用中です 何かあれば@QnoPodまで
    </p>
    {/* 検索窓 */}
        <input 
          type="text"
          placeholder="作品名で検索..."
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', fontSize: '16px' }}
        />
    
     {/* 🌟 配信状況の切り替えボタン */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          {['ALL', 'AVAILABLE', 'UNAVAILABLE'].map((val) => (
            <button 
              key={val}
              onClick={() => setAvailabilityFilter(val)}
              style={{ 
                padding: '8px 16px', borderRadius: '20px', border: '1px solid #444', cursor: 'pointer',
                backgroundColor: availabilityFilter === val ? '#4dabf7' : '#333', color: '#fff'
              }}
            >
              {val === 'ALL' ? 'すべて' : val === 'AVAILABLE' ? '配信あり' : '配信なし'}
            </button>
          ))}
        </div>


    {/* 複数選択用チェックボックスリスト */}
        <div style={{ marginBottom: '30px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {allProviders.map(name => (
            <label key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#ccc' }}>
              <input 
                type="checkbox" 
                checked={selectedProviders.includes(name)}
                onChange={() => toggleProvider(name)}
                style={{ width: '16px', height: '16px' }}
              />
              {name}
            </label>
          ))}
          {selectedProviders.length > 0 && (
             <button onClick={() => setSelectedProviders([])} style={{ background: 'none', border: 'none', color: '#4dabf7', cursor: 'pointer', textDecoration: 'underline' }}>
               全解除
             </button>
          )}
        </div>

        <p style={{ color: '#aaa', marginBottom: '40px' }}>
          {filteredWorks.length} 件の作品を表示中
        </p>
    
        <p style={{ color: '#aaa', marginBottom: '40px' }}>
          全 {works.length} 作品の公開順リスト（カードをクリックすると詳細が表示されます）
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '30px' }}>
          {filteredWorks.map((work: any, index: number) => (
            <div 
              key={`${work.id}-${index}`} 
              onClick={() => setSelectedWork(work)} 
              style={{ backgroundColor: '#222', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ width: '100%', aspectRatio: '2/3', backgroundColor: '#333' }}>
                {work.poster_path ? (
                  <img src={`https://image.tmdb.org/t/p/w500${work.poster_path}`} alt={work.title || work.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>No Image</div>
                )}
              </div>
              <div style={{ padding: '15px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '16px', lineHeight: '1.4' }}>{work.title || work.name}</h2>
                <span style={{ fontSize: '12px', color: '#888', marginBottom: '15px' }}>
                  {work.media_type === 'movie' ? '🎬 映画' : '📺 TV番組'}
                  {work.release_date || work.first_air_date ? ` (${(work.release_date || work.first_air_date).substring(0, 4)})` : ''}
                </span>
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {work.providers?.length > 0 ? (
                      work.providers.map((provider: any) => (
                        <img key={provider.provider_id} src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`} alt={provider.provider_name} style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                      ))
                    ) : (
                      <span style={{ color: '#aaa', fontSize: '12px' }}>日本での配信なし😢</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedWork && (
        <div 
          onClick={() => setSelectedWork(null)} 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ backgroundColor: '#1a1a1a', width: '100%', maxWidth: '700px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.5)', position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
          >
            <button onClick={() => setSelectedWork(null)} style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '18px', cursor: 'pointer', zIndex: 10 }}>✕</button>

            <div style={{ width: '100%', height: '260px', minHeight: '260px', backgroundColor: '#333', position: 'relative', flexShrink: 0 }}>
              {selectedWork.backdrop_path ? (
                <img src={`https://image.tmdb.org/t/p/w780${selectedWork.backdrop_path}`} alt="background" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555' }}>David Tennant Fan Site</div>
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '120px', background: 'linear-gradient(to top, #1a1a1a, transparent)' }}></div>
            </div>

            <div style={{ padding: '30px', marginTop: '-40px', position: 'relative', overflowY: 'auto' }}>
              <h2 style={{ fontSize: '26px', margin: '0 0 10px 0' }}>{selectedWork.title || selectedWork.name}</h2>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                {selectedWork.genres && selectedWork.genres.map((genre: any) => (
                  <span key={genre.id} style={{ fontSize: '12px', backgroundColor: '#333', color: '#ccc', padding: '4px 10px', borderRadius: '20px', border: '1px solid #444' }}>
                    {genre.name}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#bbb', marginBottom: '20px', backgroundColor: '#222', padding: '10px 15px', borderRadius: '8px' }}>
                <span style={{ fontSize: '20px' }}>⏱</span>
                {selectedWork.media_type === 'movie' ? (
                  <span>映画：{selectedWork.runtime ? `${selectedWork.runtime} 分` : '時間情報なし'}</span>
                ) : (
                  <span>
                    TV番組：
                    {selectedWork.numberOfSeasons ? `全${selectedWork.numberOfSeasons}シーズン ` : ''}
                    {selectedWork.numberOfEpisodes ? `(${selectedWork.numberOfEpisodes}話)` : ''}
                    {selectedWork.episodeRunTime ? <span style={{ marginLeft: '10px', color: '#888' }}>| 1話あたり約{selectedWork.episodeRunTime}分</span> : ''}
                  </span>
                )}
              </div>

              {/* 1. まずあらすじを表示 */}
              <h3 style={{ fontSize: '16px', color: '#aaa', margin: '0 0 8px 0' }}>作品あらすじ</h3>
              <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#ddd', margin: '0 0 25px 0', whiteSpace: 'pre-wrap' }}>
                {customOverviews[selectedWork.title || selectedWork.name] || selectedWork.overview || '残念ながら、この作品の日本語のあらすじはまだ登録されていません。'}
              </p>

              {/* 2. その下にキャラクター情報と画像を表示 */}
              <h3 style={{ fontSize: '16px', color: '#aaa', margin: '0 0 15px 0' }}>演じたキャラクター</h3>
              <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '12px', marginBottom: '25px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                {customCharacterImages[selectedWork.title || selectedWork.name] ? (
                  <img src={customCharacterImages[selectedWork.title || selectedWork.name]} alt="Character" style={{ width: '100px', height: '100px', borderRadius: '8px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100px', height: '100px', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>🎭</div>
                )}
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4dabf7', marginBottom: '8px' }}>
                   {(selectedWork.title || selectedWork.name) === '木曜殺人クラブ' 
                     ? 'Ian Vensam' 
                     : (selectedWork.character || '情報なし')}
                  </div>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#ccc', margin: 0 }}>
                    {customCharacterInfo[selectedWork.title || selectedWork.name] || '詳細なキャラクター情報はありません。'}
                  </p>
                </div>
              </div>

              {/* 3. 最後に配信状況を表示 */}
              <h3 style={{ fontSize: '16px', color: '#aaa', margin: '0 0 8px 0' }}>日本での配信状況</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {selectedWork.providers?.length > 0 ? (
                  selectedWork.providers.map((provider: any) => (
                    <img key={provider.provider_id} src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`} alt={provider.provider_name} title={provider.provider_name} style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
                  ))
                ) : (
                  <span style={{ color: '#aaa', fontSize: '14px', backgroundColor: '#2a2a2a', padding: '6px 12px', borderRadius: '6px' }}>日本での配信はありません😢</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}