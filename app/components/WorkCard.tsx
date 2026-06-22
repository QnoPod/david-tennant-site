'use client';
import { useState, useEffect } from 'react';
import styles from './WorkCard.module.css';

export default function WorkCard({ work, onClick }: { work: any, onClick: () => void }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatched, setIsWatched] = useState(false);

  // お気に入りと視聴済ステータスのローカルストレージ同期
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

  // お気に入り切り替え
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

  // 視聴済切り替え
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
      
      {/* 🌟 左上：視聴済ボタン（状態に応じて半透明とライトブルーが切り替わります） */}
      <button 
        onClick={toggleWatched}
        className={`${styles.watchButton} ${isWatched ? styles.watchButtonActive : styles.watchButtonInactive}`}
        title={isWatched ? "視聴済" : "未視聴"}
      >
        {isWatched ? '✔' : '▷'}
      </button>

      {/* 右上：お気に入りボタン */}
      <button 
        onClick={toggleFavorite}
        className={`${styles.favButton} ${isFavorite ? styles.favButtonActive : styles.favButtonInactive}`}
        title="お気に入り"
      >
        {isFavorite ? '★' : '☆'}
      </button>

      {/* ポスター画像エリア */}
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
      
      {/* 作品情報エリア */}
      <div className={styles.content}>
        <h2 className={styles.title}>{work.title || work.name}</h2>
        
        <span className={styles.meta}>
          {work.media_type === 'movie' ? '🎬 映画' : '📺 TV番組'}
          {work.release_date || work.first_air_date ? ` (${(work.release_date || work.first_air_date).substring(0, 4)})` : ''}
        </span>
        
        <div style={{ marginTop: 'auto' }}>
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