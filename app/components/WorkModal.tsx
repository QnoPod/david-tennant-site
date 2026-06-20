'use client';

import { customOverviews } from '../data/overviews';
import { customCharacterImages } from '../data/characters';
import { customCharacterInfo } from '../data/details';

export default function WorkModal({ work, onClose }: { work: any, onClose: () => void }) {
  if (!work) return null;
  
  // 🌟 画面表示用のタイトル
  const displayTitle = work.title || work.name;
  
  // 🌟 原題（邦題と異なる場合のみ表示用）
  const originalTitle = work.original_title || work.original_name;

  // 🌟 あらすじやキャラクター情報（custom...）を取得するための裏側のキー（TMDB本来のタイトル）
  const lookupKey = work.tmdb_title || work.title || work.name;

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
          {/* 🌟 画面には邦題（displayTitle）を表示 */}
          <h2 style={{ fontSize: '26px', margin: '0 0 4px 0' }}>{displayTitle}</h2>
          
          {/* 🌟 邦題と原題が違う場合のみ、小さく原題を表示する */}
          {(originalTitle && originalTitle !== displayTitle) && (
            <p style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#aaa', lineHeight: '1.2' }}>
              {originalTitle}
            </p>
          )}
          
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
            {/* 🌟 裏側のデータは lookupKey（原題）を使って引き出す */}
            {customOverviews[lookupKey] || work.overview || '残念ながら、この作品の日本語のあらすじはまだ登録されていません。'}
          </p>

          <h3 style={{ fontSize: '16px', color: '#aaa', margin: '0 0 15px 0' }}>演じたキャラクター</h3>
          <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '12px', marginBottom: '25px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
               {/* 🌟 修正：すべての画像を customCharacterImages から取得。selfやnarratorのキーもここから参照される */}
               <img 
                 src={
                   customCharacterImages[
                     work.character?.toLowerCase().startsWith('self') ? 'self' :
                     work.character?.toLowerCase().startsWith('narrator') ? 'narrator' : 
                     (work.character === 'The Doctor' || work.character === 'The Doctor (10)') ? '10th doctor' :
                     lookupKey
                   ] || '/default-character.jpg'
                 } 
                 alt="Character" 
                 style={{ width: '100px', height: '100px', borderRadius: '8px', objectFit: 'cover' }} 
               />
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4dabf7', marginBottom: '8px' }}>
                {
                    (lookupKey === 'Doctor Who: 60th Anniversary Specials') 
                      ? '14th Doctor'
                    : (lookupKey === '木曜殺人クラブ') 
                      ? 'Ian Ventham' 
                       : work.character?.toLowerCase().startsWith('self') 
                        ? '本人' 
                       : work.character?.toLowerCase().startsWith('narrator')
                        ? 'ナレーター'
                       : work.character === 'The Doctor' || work.character === 'The Doctor (10)' ? '10th Doctor'
                       : (customCharacterInfo[lookupKey] ? customCharacterInfo[lookupKey].split('：')[0].split('\n')[0] : work.character || '情報なし')
                 }
              </div>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#ccc', margin: 0 }}>
                {
                  // 🌟 10代目ドクターなら共通の説明文を、それ以外なら作品ごとの詳細を表示
                  (work.character === 'The Doctor' || work.character === 'The Doctor (10)') 
                    ? customCharacterInfo["10th Doctor"] 
                    : (customCharacterInfo[lookupKey] || '詳細なキャラクター情報はありません。')
                }
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

          {/* 🌟 注意書きを表示する対象リストに追加 */}
          {(lookupKey === 'Good Omens - Season 3: An Ineffable Goodbye') && (
            <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#ff8787' }}>
              ※日本語字幕なし
            </p>
          )}

        </div>
      </div>
    </div>
  );
}