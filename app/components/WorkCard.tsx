'use client';
import { useState, useEffect } from 'react';
// 🌟 作成したCSSモジュールをインポート
import styles from './WorkCard.module.css';

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
    <div onClick={onClick} className={styles.card}>
      
      {/* 🌟 条件に応じてクラス名（CSS）を切り替える */}
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