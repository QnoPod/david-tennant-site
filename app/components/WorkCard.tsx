'use client';
import { useState, useEffect } from 'react';

export default function WorkCard({ work, onClick }: { work: any, onClick: () => void }) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const checkFavorite = () => {
      const favorites = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('favorites') || '[]')
        : [];
      setIsFavorite(favorites.includes(work.id));
    };
    
    checkFavorite();

    window.addEventListener('favoritesUpdated', checkFavorite);
    return () => window.removeEventListener('favoritesUpdated', checkFavorite);
  }, [work.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let newFavorites;
    
    if (isFavorite) {
      newFavorites = favorites.filter((id: number) => id !== work.id);
    } else {
      newFavorites = [...favorites, work.id];
    }
    
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
    
    window.dispatchEvent(new Event('favoritesUpdated'));
  };

  return (
    <div 
      onClick={onClick} 
      style={{ backgroundColor: '#222', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <button 
        onClick={toggleFavorite}
        style={{ 
          position: 'absolute', top: '10px', right: '10px', zIndex: 10, 
          background: isFavorite ? '#ff9f43' : 'rgba(0,0,0,0.5)', 
          border: 'none', borderRadius: '50%', 
          /* 🌟 変数を使用 */
          width: 'var(--fav-btn-size)', height: 'var(--fav-btn-size)', 
          fontSize: 'var(--fav-btn-font)', 
          cursor: 'pointer', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        {isFavorite ? '★' : '☆'}
      </button>

      <div style={{ width: '100%', aspectRatio: '2/3', backgroundColor: '#333' }}>
        {work.poster_path ? (
          <img src={`https://image.tmdb.org/t/p/w500${work.poster_path}`} alt={work.title || work.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>No Image</div>
        )}
      </div>
      
      {/* 🌟 余白や文字サイズに変数を適用 */}
      <div style={{ padding: 'var(--card-padding)', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: 'var(--title-size)', lineHeight: '1.3' }}>{work.title || work.name}</h2>
        
        <span style={{ fontSize: 'var(--meta-size)', color: '#888', marginBottom: '10px' }}>
          {work.media_type === 'movie' ? '🎬 映画' : '📺 TV番組'}
          {work.release_date || work.first_air_date ? ` (${(work.release_date || work.first_air_date).substring(0, 4)})` : ''}
        </span>
        
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: 'var(--icon-gap)', flexWrap: 'wrap' }}>
            {work.providers?.length > 0 ? (
              work.providers.map((provider: any) => (
                <img key={provider.provider_id} src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`} alt={provider.provider_name} style={{ width: 'var(--icon-size)', height: 'var(--icon-size)', borderRadius: '4px' }} />
              ))
            ) : (
              <span style={{ color: '#aaa', fontSize: 'var(--meta-size)' }}>日本での配信なし😢</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}