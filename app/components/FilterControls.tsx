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
  genreSearchMode: 'include' | 'exclude';
  setGenreSearchMode: (mode: 'include' | 'exclude') => void;
  sortOrder: 'default' | 'popularity' | 'title'; // 追加
  setSortOrder: (order: 'default' | 'popularity' | 'title') => void; // 追加
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
};

export default function FilterControls({
  searchTerm, setSearchTerm, availabilityFilter, setAvailabilityFilter,
  allProviders, selectedProviders, toggleProvider, setSelectedProviders,
  allGenres, selectedGenres, setSelectedGenres, genreSearchMode, setGenreSearchMode,
  sortOrder, setSortOrder, isExpanded, setIsExpanded
}: Props) {
  return (
    <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#222', borderRadius: '12px' }}>
      <input 
        type="text"
        placeholder="作品名で検索..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#141414', color: '#fff', fontSize: '16px' }}
      />
    
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
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

        {/* 並び替えセレクトボックス */}
        <select 
          value={sortOrder} 
          onChange={(e) => setSortOrder(e.target.value as any)}
          style={{ padding: '8px 16px', backgroundColor: '#333', color: '#fff', border: '1px solid #444', borderRadius: '20px', cursor: 'pointer' }}
        >
          <option value="default">公開順</option>
          <option value="popularity">人気順</option>
          <option value="title">タイトル順</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {allProviders.map(name => (
          <label key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#ccc' }}>
            <input type="checkbox" checked={selectedProviders.includes(name)} onChange={() => toggleProvider(name)} style={{ width: '16px', height: '16px' }} />
            {name}
          </label>
        ))}
        {selectedProviders.length > 0 && (
          <button onClick={() => setSelectedProviders([])} style={{ background: 'none', border: 'none', color: '#4dabf7', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}>選択を全解除</button>
        )}
      </div>

      <button 
        onClick={() => setIsExpanded(!isExpanded)} 
        style={{ marginBottom: '15px', background: 'none', border: 'none', color: '#4dabf7', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
      >
        {isExpanded ? '▲ ジャンル設定を閉じる' : '▼ ジャンルで絞り込む'}
      </button>
      
      {isExpanded && (
        <div style={{ marginBottom: '10px', padding: '15px', borderLeft: '2px solid #4dabf7', backgroundColor: '#1a1a1a', borderRadius: '4px' }}>
          <div style={{ marginBottom: '15px', display: 'flex', gap: '20px' }}>
            <label style={{ color: '#ccc', cursor: 'pointer' }}>
              <input type="radio" checked={genreSearchMode === 'include'} onChange={() => setGenreSearchMode('include')} /> 含める
            </label>
            <label style={{ color: '#ccc', cursor: 'pointer' }}>
              <input type="radio" checked={genreSearchMode === 'exclude'} onChange={() => setGenreSearchMode('exclude')} /> 除外する
            </label>
          </div>

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

          {selectedGenres.length > 0 && (
            <button onClick={() => setSelectedGenres([])} style={{ background: 'none', border: 'none', color: '#4dabf7', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}>
              選択を全解除
            </button>
          )}
        </div>
      )}
    </div>
  );
}