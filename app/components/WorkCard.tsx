'use client';
import { useState, useEffect } from 'react';
import styles from './WorkCard.module.css';

export default function WorkCard({ work, onClick }: { work: any, onClick: () => void }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatched, setIsWatched] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const favorites = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('favorites') || '[]')
        : [];
      setIsFavorite(favorites.includes(work.id));

      const watched = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('watchedWorks') || '[]')
        : [];
      setIsWatched(watched.includes(work.id));
    };
    
    checkStatus();

    window.addEventListener('favoritesUpdated', checkStatus);
    window.addEventListener('watchedUpdated', checkStatus);
    return () => {
      window.removeEventListener('favoritesUpdated', checkStatus);
      window.removeEventListener('watchedUpdated', checkStatus);
    };
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

  const toggleWatched = (e: React.MouseEvent) => {
    e.stopPropagation();
    const watched = JSON.parse(localStorage.getItem('watchedWorks') || '[]');
    let newWatched;
    if (isWatched) {
      newWatched = watched.filter((id: number) => id !== work.id);
    } else {
      newWatched = [...watched, work.id];
    }
    localStorage.setItem('watchedWorks', JSON.stringify(newWatched));
    setIsWatched(!isWatched);
    window.dispatchEvent(new Event('watchedUpdated'));
  };

  return (
    <div onClick={onClick} className={styles.card}>
      
      {/* 🌟 アイコンをスタイリッシュに変更 */}
      <button 
        onClick={toggleWatched}
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 10,
          background: isWatched ? 'rgba(77, 171, 247, 0.9)' : 'rgba(20, 20, 20, 0.7)',
          backdropFilter: 'blur(4px)',
          border: `1.5px solid ${isWatched ? '#4dabf7' : 'rgba(255,255,255,0.4)'}`,
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          color: isWatched ? '#fff' : 'rgba(255,255,255,0.8)',
          fontSize: isWatched ? '16px' : '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          boxShadow: isWatched ? '0 0 10px rgba(77, 171, 247, 0.5)' : 'none'
        }}
        title={isWatched ? "視聴済を解除" : "視聴済にする"}
        // ホバーエフェクト（簡易的にインラインで実装）
        onMouseEnter={(e) => {
          if (!isWatched) e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
        }}
        onMouseLeave={(e) => {
          if (!isWatched) e.currentTarget.style.background = 'rgba(20, 20, 20, 0.7)';
        }}
      >
        {isWatched ? '✔' : '▷'}
      </button>

      {/* お気に入りボタン */}
      <button 
        onClick={toggleFavorite}
        className={`${styles.favButton} ${isFavorite ? styles.favButtonActive : styles.favButtonInactive}`}
      >
        {isFavorite ? '★' : '☆'}
      </button>

      <div className={styles.imageWrapper}>
        {work.poster_path ? (
          <img 
            src={`https://image.tmdb.org/t/p/w500${work.poster_path}`} 
            alt={work.title || work.name} 
            loading="lazy" 
            className={styles.posterImage} 
          />
        ) : (
          <div className={styles.noImage}>No Image</div>
        )}
      </div>
      
      <div className={styles.content}>
        <h2 className={styles.title}>{work.title || work.name}</h2>
        
        <span className={styles.meta}>
          {work.media_type === 'movie' ? '🎬 映画' : '📺 TV番組'}
          {work.release_date || work.first_air_date ? ` (${(work.release_date || work.first_air_date).substring(0, 4)})` : ''}
        </span>
        
        <div className={styles.providerArea}>
          <div className={styles.providerList}>
            {work.providers?.length > 0 ? (
              work.providers.map((provider: any) => (
                <img 
                  key={provider.provider_id} 
                  src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`} 
                  alt={provider.provider_name} 
                  loading="lazy" 
                  className={styles.providerIcon} 
                />
              ))
            ) : (
              <span className={styles.noProviders}>日本での配信なし😢</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}