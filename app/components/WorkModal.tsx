'use client';

import { customOverviews } from '../data/overviews';
import { customCharacterImages } from '../data/characters';
import { customCharacterInfo } from '../data/details';

export default function WorkModal({ work, onClose }: { work: any, onClose: () => void }) {
  if (!work) return null;
  const workTitle = work.title || work.name;

  return (
    <div 
      onClick={onClose} 
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{ backgroundColor: '#1a1a1a', width: '100%', maxWidth: '700px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.5)', position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '18px', cursor: 'pointer', zIndex: 10 }}>✕</button>

        <div style={{ width: '100%', height: '260px', minHeight: '260px', backgroundColor: '#333', position: 'relative', flexShrink: 0 }}>
          {work.backdrop_path ? (
            <img src={`https://image.tmdb.org/t/p/w780${work.backdrop_path}`} alt="background" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555' }}>David Tennant Fan Site</div>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '120px', background: 'linear-gradient(to top, #1a1a1a, transparent)' }}></div>
        </div>

        <div style={{ padding: '30px', marginTop: '-40px', position: 'relative', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '26px', margin: '0 0 10px 0' }}>{workTitle}</h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
            {work.genres && work.genres.map((genre: any) => (
              <span key={genre.id} style={{ fontSize: '12px', backgroundColor: '#333', color: '#ccc', padding: '4px 10px', borderRadius: '20px', border: '1px solid #444' }}>
                {genre.name}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#bbb', marginBottom: '20px', backgroundColor: '#222', padding: '10px 15px', borderRadius: '8px' }}>
            <span style={{ fontSize: '20px' }}>⏱</span>
            {work.media_type === 'movie' ? (
              <span>映画：{work.runtime ? `${work.runtime} 分` : '時間情報なし'}</span>
            ) : (
              <span>
                TV番組：
                {work.numberOfSeasons ? `全${work.numberOfSeasons}シーズン ` : ''}
                {work.numberOfEpisodes ? `(${work.numberOfEpisodes}話)` : ''}
                {work.episodeRunTime ? <span style={{ marginLeft: '10px', color: '#888' }}>| 1話あたり約{work.episodeRunTime}分</span> : ''}
              </span>
            )}
          </div>

          <h3 style={{ fontSize: '16px', color: '#aaa', margin: '0 0 8px 0' }}>作品あらすじ</h3>
          <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#ddd', margin: '0 0 25px 0', whiteSpace: 'pre-wrap' }}>
            {customOverviews[workTitle] || work.overview || '残念ながら、この作品の日本語のあらすじはまだ登録されていません。'}
          </p>

          <h3 style={{ fontSize: '16px', color: '#aaa', margin: '0 0 15px 0' }}>演じたキャラクター</h3>
          <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '12px', marginBottom: '25px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              {/* 🌟 修正：キャラクター名によって表示する画像を切り替える */}
               <img 
                 src={
                       work.character?.toLowerCase().startsWith('self') 
                         ? '/characters/self-icon.png' 
                       : work.character?.toLowerCase().startsWith('narrator')
                         ? '/characters/narrator-icon.jpg'
                       : (customCharacterImages[workTitle] || '/default-character.png')
                   } 
                      alt="Character" 
                      style={{ width: '100px', height: '100px', borderRadius: '8px', objectFit: 'cover' }} 
                 />
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4dabf7', marginBottom: '8px' }}>
                {
                    workTitle === '木曜殺人クラブ' 
                      ? 'Ian Ventham' 
                       : work.character?.toLowerCase().startsWith('self') 
                        ? '本人' 
                       : work.character?.toLowerCase().startsWith('narrator')
                        ? 'ナレーター'
                       : (work.character || '情報なし')
                 }
              </div>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#ccc', margin: 0 }}>
                {customCharacterInfo[workTitle] || '詳細なキャラクター情報はありません。'}
              </p>
            </div>
          </div>

          <h3 style={{ fontSize: '16px', color: '#aaa', margin: '0 0 8px 0' }}>日本での配信状況</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {work.providers?.length > 0 ? (
              work.providers.map((provider: any) => (
                <img key={provider.provider_id} src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`} alt={provider.provider_name} title={provider.provider_name} style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
              ))
            ) : (
              <span style={{ color: '#aaa', fontSize: '14px', backgroundColor: '#2a2a2a', padding: '6px 12px', borderRadius: '6px' }}>日本での配信はありません😢</span>
            )}
          </div>

          {/* 🌟 ここから追加：「グッド・オーメンズ」シーズン3の場合のみ注意書きを表示 */}
          {workTitle === 'Good Omens - Season 3: An Ineffable Goodbye' && (
            <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#ff8787' }}>
              ※日本語字幕なし
            </p>
          )}
          {/* 🌟 ここまで追加 */}

        </div>
      </div>
    </div>
  );
}