'use client';

export default function WorkCard({ work, onClick }: { work: any, onClick: () => void }) {
  return (
    <div 
      onClick={onClick} 
      style={{ backgroundColor: '#222', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s' }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div style={{ width: '100%', aspectRatio: '2/3', backgroundColor: '#333' }}>
        {work.poster_path ? (
          <img src={`https://image.tmdb.org/t/p/w500${work.poster_path}`} alt={work.title || work.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>No Image</div>
        )}
      </div>
      <div style={{ padding: '15px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '16px', lineHeight: '1.4' }}>{work.title || work.name}</h2>
        <span style={{ fontSize: '12px', color: '#888', marginBottom: '15px' }}>
          {work.media_type === 'movie' ? '🎬 映画' : '📺 TV番組'}
          {work.release_date || work.first_air_date ? ` (${(work.release_date || work.first_air_date).substring(0, 4)})` : ''}
        </span>
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {work.providers?.length > 0 ? (
              work.providers.map((provider: any) => (
                <img key={provider.provider_id} src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`} alt={provider.provider_name} style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
              ))
            ) : (
              <span style={{ color: '#aaa', fontSize: '12px' }}>日本での配信なし😢</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}