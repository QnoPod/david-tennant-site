'use client';
import { Dispatch, SetStateAction } from 'react';

type Props = {
  searchTerm: string; setSearchTerm: (val: string) => void;
  charSearchTerm: string; setCharSearchTerm: (val: string) => void; 
  availabilityFilter: string; setAvailabilityFilter: (val: string) => void;
  watchStatusFilter: string; setWatchStatusFilter: (val: string) => void;
  allProviders: string[]; selectedProviders: string[];
  toggleProvider: (name: string) => void; setSelectedProviders: (providers: string[]) => void;
  allGenres: string[]; selectedGenres: string[]; setSelectedGenres: Dispatch<SetStateAction<string[]>>;
  genreSearchMode: 'include' | 'exclude'; setGenreSearchMode: (mode: 'include' | 'exclude') => void;
  sortOrder: 'default' | 'popularity' | 'title'; setSortOrder: (order: 'default' | 'popularity' | 'title') => void;
  isExpanded: boolean; setIsExpanded: (val: boolean) => void;
  showOnlyFavorites: boolean; setShowOnlyFavorites: (val: boolean) => void;
  onReset: () => void;
};

export default function FilterControls({
  searchTerm, setSearchTerm, charSearchTerm, setCharSearchTerm, availabilityFilter, setAvailabilityFilter,
  watchStatusFilter, setWatchStatusFilter,
  allProviders, selectedProviders, toggleProvider, setSelectedProviders,
  allGenres, selectedGenres, setSelectedGenres, genreSearchMode, setGenreSearchMode,
  sortOrder, setSortOrder, isExpanded, setIsExpanded, showOnlyFavorites, setShowOnlyFavorites,
  onReset
}: Props) {
  
  return (
    <div style={{ 
      backgroundColor: '#16161a', padding: '24px', borderRadius: '12px', 
      border: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', flexDirection: 'column', gap: '20px'
    }}>
      
      <style>{`
        .fc-input-wrapper { position: relative; width: 100%; }
        .fc-input-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 18px; pointer-events: none; opacity: 0.8;}
        .fc-clear-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #888; font-size: 20px; cursor: pointer; padding: 0 5px; }
        .fc-input { 
          background-color: #0a0a0c; color: #eaeaea; border: 1px solid #2a2a2a; 
          padding: 14px 40px 14px 44px; border-radius: 8px; font-size: 15px; outline: none; transition: all 0.2s; width: 100%; box-sizing: border-box; 
        }
        .fc-input:focus { border-color: #555; }
        
        .fc-select {
          background-color: #0a0a0c; color: #eaeaea; border: 1px solid #2a2a2a; 
          padding: 12px 36px 12px 16px; border-radius: 6px; font-size: 14px; outline: none; cursor: pointer; appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23eaeaea' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat; background-position: right 12px center; background-size: 16px;
          flex: 1 1 auto; max-width: 220px;
        }

        .fc-btn-outline { 
          background: #1c1c20; color: #d0d0d0; border: 1px solid #2a2a2a; 
          padding: 12px 20px; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        }
        .fc-btn-outline:hover { background: #2a2a30; border-color: #444; }
        .fc-btn-outline.active { border-color: #d4af37; color: #d4af37; background: rgba(212,175,55,0.05); }
        
        /* 配信サービスとジャンルで共有するモダンなタグスタイル */
        .fc-filter-tag { 
          cursor: pointer; font-size: 13px; color: #888; background-color: transparent; 
          border: 1px solid #333; padding: 6px 12px; border-radius: 20px; font-weight: 500; transition: all 0.2s; display: inline-flex; align-items: center; 
        }
        .fc-filter-tag:hover { border-color: #555; color: #eaeaea; }
        .fc-filter-tag.active { background-color: #d4af37; color: #0a0a0c; border-color: #d4af37; }
      `}</style>

      {/* 上段: 検索ボックス */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="fc-input-wrapper">
          <span className="fc-input-icon" style={{ color: '#b9a0db' }}>🎬</span>
          <input type="text" placeholder="作品名で検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="fc-input" />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="fc-clear-btn">✕</button>}
        </div>
        <div className="fc-input-wrapper">
          <span className="fc-input-icon" style={{ color: '#7a51a8' }}>👥</span>
          <input type="text" placeholder="キャラクター名で検索..." value={charSearchTerm} onChange={(e) => setCharSearchTerm(e.target.value)} className="fc-input" />
          {charSearchTerm && <button onClick={() => setCharSearchTerm('')} className="fc-clear-btn">✕</button>}
        </div>
      </div>

      {/* 中段: セレクトボックスとトグルボタン */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        
        <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)} className="fc-select">
          <option value="ALL">すべての配信状況</option>
          <option value="AVAILABLE">日本で配信中</option>
          <option value="UNAVAILABLE">配信なし</option>
        </select>

        <select value={watchStatusFilter} onChange={(e) => setWatchStatusFilter(e.target.value)} className="fc-select">
          <option value="ALL">すべての視聴状況</option>
          <option value="WATCHED">視聴済</option>
          <option value="UNWATCHED">未視聴</option>
        </select>

        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="fc-select">
          <option value="default">公開順 (新しい順)</option>
          <option value="popularity">人気順</option>
          <option value="title">タイトル順 (ABC/五十音)</option>
        </select>

        {/* お気に入りのみ表示 ＋ 全解除ボタン */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)} 
            className={`fc-btn-outline ${showOnlyFavorites ? 'active' : ''}`}
          >
            {showOnlyFavorites ? '★ お気に入りのみ表示' : '☆ お気に入りのみ表示'}
          </button>
          
          {showOnlyFavorites && (
            <button 
              onClick={() => {
                localStorage.removeItem('favorites');
                window.dispatchEvent(new Event('favoritesUpdated'));
                setShowOnlyFavorites(false); 
              }} 
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#eaeaea'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
            >
              お気に入りをすべて解除
            </button>
          )}
        </div>
      </div>

      {/* 下段: アコーディオン展開ボタン と リセットボタン */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', flexWrap: 'wrap', gap: '10px' }}>
        
        {/* 🌟 展開ボタンの文字サイズを小さく（12px）修正 */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="fc-btn-outline" 
          style={{ background: 'transparent', border: 'none', padding: '0', color: '#888', fontSize: '12px' }}
        >
          {isExpanded ? '▲ 詳細フィルターを閉じる' : '▼ 配信サービス・ジャンルで絞り込む'}
        </button>
        
        <button 
          onClick={onReset}
          className="fc-btn-outline"
          style={{ background: 'transparent', padding: '6px 12px', fontSize: '12px', color: '#aaa', border: '1px solid #333' }}
        >
          🔄 条件をすべてリセット
        </button>
      </div>

      {/* --- アコーディオン内（詳細フィルター） --- */}
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', paddingTop: '10px' }}>
          
          {/* 配信サービス */}
          <div>
            <h3 style={{ fontSize: '13px', color: '#d4af37', margin: '0 0 12px 0', fontWeight: '500' }}>配信サービスで絞り込む</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {allProviders.map(provider => (
                <button 
                  key={provider} 
                  onClick={() => toggleProvider(provider)}
                  className={`fc-filter-tag ${selectedProviders.includes(provider) ? 'active' : ''}`}
                >
                  {provider}
                </button>
              ))}
            </div>
            {selectedProviders.length > 0 && (
              <button onClick={() => setSelectedProviders([])} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginTop: '10px', fontSize: '13px', textDecoration: 'underline' }}>
                選択を全解除
              </button>
            )}
          </div>

          {/* ジャンル */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '13px', color: '#d4af37', margin: 0, fontWeight: '500' }}>ジャンルで絞り込む</h3>
              <label style={{ color: '#eaeaea', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="radio" checked={genreSearchMode === 'include'} onChange={() => setGenreSearchMode('include')} /> 含める
              </label>
              <label style={{ color: '#eaeaea', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="radio" checked={genreSearchMode === 'exclude'} onChange={() => setGenreSearchMode('exclude')} /> 除外する
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {allGenres.map(genre => (
                <label key={genre} className={`fc-filter-tag ${selectedGenres.includes(genre) ? 'active' : ''}`}>
                  <input type="checkbox" style={{ display: 'none' }} checked={selectedGenres.includes(genre)} onChange={() => {
                      setSelectedGenres((prev: string[]) => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
                    }} />
                  {genre}
                </label>
              ))}
            </div>

            {selectedGenres.length > 0 && (
              <button onClick={() => setSelectedGenres([])} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>
                選択を全解除
              </button>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}