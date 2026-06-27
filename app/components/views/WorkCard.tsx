'use client';
import styles from './WorkCard.module.css';

// 🌟 Props の型定義を追加（親から受け取る情報）
type WorkCardProps = {
  work: any;
  onClick: () => void;
  isFavorite: boolean;
  isWatched: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onToggleWatched: (e: React.MouseEvent) => void;
};

export default function WorkCard({ 
  work, 
  onClick, 
  isFavorite, 
  isWatched, 
  onToggleFavorite, 
  onToggleWatched 
}: WorkCardProps) {
  
  // 🌟 カード内部での useEffect や LocalStorage へのアクセスをすべて削除しました！

  return (
    <div onClick={onClick} className={styles.card}>
      
      <div className={styles.imageWrapper}>
        
        {/* 左上：視聴状況ボタン */}
        <button 
          onClick={onToggleWatched} // 🌟 親から受け取った処理を実行
          className={`${styles.watchButton} ${isWatched ? styles.watchActive : ''}`}
          title={isWatched ? "視聴済" : "未視聴"}
        >
          {isWatched ? '✔' : '▷'}
        </button>

        {/* 右上：お気に入りボタン */}
        <button 
          onClick={onToggleFavorite} // 🌟 親から受け取った処理を実行
          className={`${styles.favButton} ${isFavorite ? styles.favActive : ''}`}
          title="お気に入り"
        >
          {isFavorite ? '★' : '☆'}
        </button>

        {/* ポスター画像エリア */}
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