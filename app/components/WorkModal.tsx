'use client';

import { useState, useEffect } from 'react';
import { customOverviews } from '../data/overviews';
import { customCharacterImages } from '../data/characters';
import { customCharacterInfo } from '../data/details';
import { videoOverrides } from '../data/videoOverrides';

export default function WorkModal({ work, onClose }: { work: any, onClose: () => void }) {
  const [isWatched, setIsWatched] = useState(false);

  // 🌟 モーダルが開かれたときと、別コンポーネントで状態が更新されたときに同期する
  useEffect(() => {
    if (!work) return;

    const checkStatus = () => {
      const watched = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('watchedWorks') || '[]')
        : [];
      setIsWatched(watched.includes(work.id));
    };
    
    checkStatus();

    window.addEventListener('watchedUpdated', checkStatus);
    return () => {
      window.removeEventListener('watchedUpdated', checkStatus);
    };
  }, [work]);

  // 🌟 視聴状態のトグル処理
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

  if (!work) return null;
  
  const displayTitle = work.title || work.name;
  const originalTitle = work.original_title || work.original_name;
  const lookupKey = work.tmdb_title || work.title || work.name;
  const finalVideoKey = videoOverrides[lookupKey] || work.videoKey;

  return (
    <div 
      onClick={onClose} 
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{ backgroundColor: '#16161a', width: '100%', maxWidth: '750px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
      >
        {/* 🌟 閉じるボタン */}
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '36px', height: '36px', fontSize: '18px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.9)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)'}
        >
          ✕
        </button>

        {/* 🌟 ヘッダー画像エリア */}
        <div style={{ width: '100%', height: '280px', minHeight: '280px', backgroundColor: '#0a0a0c', position: 'relative', flexShrink: 0 }}>
          {work.backdrop_path ? (
            <img src={`https://image.tmdb.org/t/p/w780${work.backdrop_path}`} alt="background" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#444', fontSize: '18px', letterSpacing: '0.1em' }}>David Tennant Fan Site</div>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '150px', background: 'linear-gradient(to top, #16161a, transparent)' }}></div>
        </div>

        <div style={{ padding: '0 40px 40px 40px', marginTop: '-70px', position: 'relative', overflowY: 'auto' }}>
          
          <h2 style={{ fontSize: '32px', margin: '0 0 6px 0', color: '#eaeaea', fontWeight: '600', letterSpacing: '0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
            {displayTitle}
          </h2>
          
          {(originalTitle && originalTitle !== displayTitle) && (
            <p style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#d4af37', fontWeight: '500', letterSpacing: '0.05em', textShadow: '0 2px 5px rgba(0,0,0,0.8)' }}>
              {originalTitle}
            </p>
          )}
          
          {/* 🌟 ボタンとジャンルタグを並べるエリア */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
            
            {/* 🌟 視聴済/未視聴トグルボタン */}
            <button
              onClick={toggleWatched}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 18px',
                borderRadius: '24px',
                border: isWatched ? '1px solid #4dabf7' : '1px solid #444',
                backgroundColor: isWatched ? '#4dabf7' : 'transparent',
                color: isWatched ? '#fff' : '#eaeaea',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                boxShadow: isWatched ? '0 2px 8px rgba(77,171,247,0.4)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isWatched) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                if (!isWatched) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {isWatched ? '✔ 視聴済' : '▷ 未視聴'}
            </button>

            {/* 🌟 ジャンルタグ */}
            {work.genres && work.genres.map((genre: any) => (
              <span key={genre.id} style={{ fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#ccc', padding: '6px 14px', borderRadius: '24px', border: '1px solid #333' }}>
                {genre.name}
              </span>
            ))}
          </div>

          {/* 🌟 時間・シーズン情報バー */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#d0d0d0', marginBottom: '35px', backgroundColor: '#0a0a0c', padding: '12px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ fontSize: '18px', color: '#d4af37' }}>⏱</span>
            {work.media_type === 'movie' ? (
              <span>映画：{work.runtime ? `${work.runtime} 分` : '時間情報なし'}</span>
            ) : (
              <span>
                TV番組：
                {work.numberOfSeasons ? `全${work.numberOfSeasons}シーズン ` : ''}
                {work.numberOfEpisodes ? `(${work.numberOfEpisodes}話)` : ''}
                {work.episodeRunTime ? <span style={{ marginLeft: '12px', color: '#888' }}>| 1話あたり約{work.episodeRunTime}分</span> : ''}
              </span>
            )}
          </div>

          {/* 🌟 作品あらすじ */}
          <h3 style={{ fontSize: '18px', color: '#d4af37', margin: '0 0 12px 0', fontWeight: '500', borderBottom: '1px solid #333', paddingBottom: '8px' }}>作品あらすじ</h3>
          <p style={{ fontSize: '15px', lineHeight: '1.9', color: '#d0d0d0', margin: '0 0 35px 0', whiteSpace: 'pre-wrap', letterSpacing: '0.03em' }}>
            {customOverviews[lookupKey] || work.overview || '残念ながら、この作品の日本語のあらすじはまだ登録されていません。'}
          </p>

          {/* 🌟 動画プレイヤー */}
          {finalVideoKey && (
            <div style={{ marginBottom: '35px', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${finalVideoKey}`}
                title="Trailer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 'none' }}
              ></iframe>
            </div>
          )}

          {/* 🌟 演じたキャラクター */}
          <h3 style={{ fontSize: '18px', color: '#d4af37', margin: '0 0 15px 0', fontWeight: '500', borderBottom: '1px solid #333', paddingBottom: '8px' }}>演じたキャラクター</h3>
          
          {
            (lookupKey === 'Nativity 2: Danger in the Manger!'
              ? (work.character || '情報なし').split('/')
              : [work.character || '情報なし']
            ).map((charPart: string, index: number) => {
              const charNameTrimmed = charPart.trim();
              
              let imageKey = lookupKey;
              if (charNameTrimmed.toLowerCase().startsWith('self')) imageKey = 'self';
              else if (charNameTrimmed.toLowerCase().startsWith('narrator')) imageKey = 'narrator';
              else if (charNameTrimmed === 'The Doctor' || charNameTrimmed === 'The Doctor (10)') imageKey = '10th doctor';
              else if (charNameTrimmed.includes('Scrooge McDuck')) imageKey = 'Scrooge McDuck'; 
              else if (lookupKey === 'Nativity 2: Danger in the Manger!') {
                imageKey = charNameTrimmed === 'Donald' ? 'Donald Peterson' : charNameTrimmed;
              }
              
              const imgSrc = customCharacterImages[imageKey] || customCharacterImages[lookupKey] || '/default-character.jpg';

              let displayCharName = charNameTrimmed;
              if (lookupKey === 'Doctor Who: 60th Anniversary Specials') displayCharName = '14th Doctor';
              else if (lookupKey === '木曜殺人クラブ') displayCharName = 'Ian Ventham';
              else if (lookupKey === 'Being Considered') displayCharName = 'Ex';
              else if (lookupKey === 'Randall & Hopkirk (Deceased)') displayCharName = 'Gordon Stylus';
              else if (lookupKey === 'A Mug\'s Game') displayCharName = 'Gavin';
              else if (charNameTrimmed === 'The Doctor' || charNameTrimmed === 'The Doctor (10)') displayCharName = '10th Doctor';
              else if (charNameTrimmed.toLowerCase().startsWith('self')) displayCharName = '本人';
              else if (charNameTrimmed.toLowerCase().startsWith('narrator')) displayCharName = 'ナレーター';
              else if (lookupKey === 'Nativity 2: Danger in the Manger!' && charNameTrimmed === 'Donald') displayCharName = 'Donald Peterson';

              let descKey = lookupKey;
              if (charNameTrimmed === 'The Doctor' || charNameTrimmed === 'The Doctor (10)') descKey = '10th Doctor';
              else if (charNameTrimmed.includes('Scrooge McDuck')) descKey = 'Scrooge McDuck'; 
              else if (lookupKey === 'Nativity 2: Danger in the Manger!') {
                descKey = charNameTrimmed === 'Donald' ? 'Donald Peterson' : charNameTrimmed;
              }

              const rawInfo = customCharacterInfo[descKey] || customCharacterInfo[lookupKey] || '詳細なキャラクター情報はありません。';
              
              let displayInfo = rawInfo.trim();
              let jaName = '';

              if (rawInfo !== '詳細なキャラクター情報はありません。') {
                const newlineIndex = displayInfo.indexOf('\n');
                const colonIndex = displayInfo.indexOf('：');
                if (newlineIndex !== -1 && colonIndex !== -1) {
                  jaName = displayInfo.substring(0, Math.min(newlineIndex, colonIndex)).trim();
                } else if (newlineIndex !== -1) {
                  jaName = displayInfo.substring(0, newlineIndex).trim();
                } else if (colonIndex !== -1) {
                  jaName = displayInfo.substring(0, colonIndex).trim();
                }
              }
              
              if (rawInfo !== '詳細なキャラクター情報はありません。') {
                const newlineIndex = displayInfo.indexOf('\n');
                const colonIndex = displayInfo.indexOf('：');

                if (newlineIndex !== -1 && colonIndex !== -1) {
                  const splitIndex = Math.min(newlineIndex, colonIndex);
                  displayInfo = displayInfo.substring(splitIndex + 1).trim();
                } else if (newlineIndex !== -1) {
                  displayInfo = displayInfo.substring(newlineIndex + 1).trim();
                } else if (colonIndex !== -1) {
                  displayInfo = displayInfo.substring(colonIndex + 1).trim();
                }
              }

              const shouldShowJaName = jaName && displayCharName !== jaName;

              return (
                <div key={index} style={{ backgroundColor: '#0a0a0c', padding: '20px', borderRadius: '8px', marginBottom: '15px', display: 'flex', gap: '20px', alignItems: 'flex-start', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <img 
                    src={imgSrc} 
                    alt="Character" 
                    style={{ width: '90px', height: '90px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }} 
                  />
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#eaeaea', marginBottom: shouldShowJaName ? '4px' : '8px', letterSpacing: '0.02em' }}>
                      {displayCharName}
                    </div>
                    {shouldShowJaName && (
                      <div style={{ fontSize: '14px', color: '#d4af37', marginBottom: '8px', fontWeight: '500' }}>
                        {jaName}
                      </div>
                    )}
                    <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#aaa', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {displayInfo}
                    </p>
                  </div>
                </div>
              );
            })
          }

          {/* 🌟 配信状況 */}
          <h3 style={{ fontSize: '18px', color: '#d4af37', margin: '35px 0 12px 0', fontWeight: '500', borderBottom: '1px solid #333', paddingBottom: '8px' }}>日本での配信状況</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {work.providers?.length > 0 ? (
              work.providers.map((provider: any) => (
                <img key={provider.provider_id} src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`} alt={provider.provider_name} title={provider.provider_name} style={{ width: '45px', height: '45px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }} />
              ))
            ) : (
              <span style={{ color: '#888', fontSize: '14px', backgroundColor: '#0a0a0c', padding: '8px 16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>日本での配信はありません😢</span>
            )}
          </div>

          {(lookupKey === 'Good Omens - Season 3: An Ineffable Goodbye') && (
            <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#e68a2e', fontWeight: '500' }}>
              ※日本語字幕なし
            </p>
          )}

        </div>
      </div>
    </div>
  );
}