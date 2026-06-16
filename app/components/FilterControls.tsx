'use client';
import { Dispatch, SetStateAction } from 'react';

type Props = {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  availabilityFilter: string;
  setAvailabilityFilter: (val: string) => void;
  allProviders: string[];
  selectedProviders: string[];
  toggleProvider: (name: string) => void;
  setSelectedProviders: (providers: string[]) => void;
  allGenres: string[];
  selectedGenres: string[];
  setSelectedGenres: Dispatch<SetStateAction<string[]>>;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
};

export default function FilterControls({
  searchTerm, setSearchTerm, availabilityFilter, setAvailabilityFilter,
  allProviders, selectedProviders, toggleProvider, setSelectedProviders,
  allGenres, selectedGenres, setSelectedGenres, isExpanded, setIsExpanded
}: Props) {
  return (
    <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#222', borderRadius: '12px' }}>
      {/* 1. 常に表示するエリア：検索窓と配信状況 */}
      <input 
        type="text"
        placeholder="作品名で検索..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#141414', color: '#fff', fontSize: '16px' }}
      />
    
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

      {/* 2. 常に表示するエリア：配信サービス絞り込み */}
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
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
          <button onClick={() => setSelectedProviders([])} style={{ background: 'none', border: 'none', color: '#4dabf7', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}>
            全解除
          </button>
        )}
      </div>

      {/* 3. アコーディオン切り替えボタン */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)} 
        style={{ marginBottom: '15px', background: 'none', border: 'none', color: '#4dabf7', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
      >
        {isExpanded ? '▲ ジャンル絞り込みを閉じる' : '▼ ジャンルで絞り込む'}
      </button>
      
      {/* 4. アコーディオンで開閉するエリア（ジャンルのみ＋全解除ボタン） */}
      {isExpanded && (
        <div style={{ marginBottom: '10px', padding: '10px', borderLeft: '2px solid #4dabf7', backgroundColor: '#1a1a1a', borderRadius: '4px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {allGenres.map(genre => (
              <label key={genre} style={{ cursor: 'pointer', fontSize: '14px', color: '#ccc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="checkbox" 
                  checked={selectedGenres.includes(genre)}
                  onChange={() => {
                    setSelectedGenres((prev: string[]) => 
                      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
                    );
                  }}
                />
                {genre}
              </label>
            ))}
          </div>

          {/* ジャンルの全解除ボタン */}
          {selectedGenres.length > 0 && (
            <button 
              onClick={() => setSelectedGenres([])} 
              style={{ background: 'none', border: 'none', color: '#4dabf7', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}
            >
              全解除
            </button>
          )}
        </div>
      )}
    </div>
  );
}