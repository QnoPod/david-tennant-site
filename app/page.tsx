import WorkList from './WorkList';

// 🌟 API設定と通信オプション
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZmI3MzU4NmRkZDRiMTc4YzFjNmMzZWIwNzAxN2Q4NCIsIm5iZiI6MTc4MTQ4NzM4NS40NzksInN1YiI6IjZhMmY1NzE5MjQwNGRmODU3NDA4YjEyNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.53ek30REBz6SxDNbFv-zQIBxNhpW1XhC4eGl-xjs2Bc'
  },
  next: { revalidate: 86400 } // 24時間キャッシュ
};

// 🌟 配信情報を手動で上書き・追加するヘルパー関数
const getEnhancedProviders = (title: string, providers: any[]) => {
  let updatedProviders = [...providers];

  // Doctor Who 60th に Disney+ を追加
  if (title === 'Doctor Who: 60th Anniversary Specials') {
    updatedProviders.push(
      { provider_id: 337, provider_name: 'Disney Plus', logo_path: '/97yvRBw1GzX7fXprcF80er19ot.jpg'}
    );
  }

  // Good Omens S3 に Amazon Prime Video を追加
  if (title === 'Good Omens - Season 3: An Ineffable Goodbye') {
    updatedProviders.push(
      { provider_id: 119, provider_name: 'Amazon Prime Video', logo_path: '/pvske1MyAoymrs5bguRfVqYiM9a.jpg' },
      { provider_id: 2100, provider_name: 'Amazon Prime Video with Ads', logo_path: '/8aBqoNeGGr0oSA85iopgNZUOTOc.jpg' }
    );
  }

  return updatedProviders;
};

export default async function Home() {
  // 1. デヴィッド・テナントのIDを取得
  const searchRes = await fetch('https://api.themoviedb.org/3/search/person?query=David+Tennant&language=ja-JP', API_OPTIONS);
  const searchData = await searchRes.json();
  const davidId = searchData.results[0].id;

  // 2. 出演作品一覧を取得
  const res = await fetch(`https://api.themoviedb.org/3/person/${davidId}/combined_credits?language=ja-JP`, API_OPTIONS);
  const data = await res.json();

  // 公開順（新しい順）に並び替え
  const allWorks = data.cast.sort((a: any, b: any) => {
    const dateA = new Date(a.release_date || a.first_air_date || '1900-01-01').getTime();
    const dateB = new Date(b.release_date || b.first_air_date || '1900-01-01').getTime();
    return dateB - dateA;
  });

  const worksWithDetails = [];
  const chunkSize = 20;
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // 3. チャンクごとに詳細情報と配信情報を取得
  for (let i = 0; i < allWorks.length; i += chunkSize) {
    const chunk = allWorks.slice(i, i + chunkSize);
    
    const chunkResults = await Promise.all(
      chunk.map(async (work: any) => {
        // 配信情報を取得
        const provRes = await fetch(`https://api.themoviedb.org/3/${work.media_type}/${work.id}/watch/providers`, API_OPTIONS);
        const provData = await provRes.json();
        const baseProviders = provData.results?.JP?.flatrate || [];

        // 配信情報を拡張
        const providers = getEnhancedProviders(work.title || work.name, baseProviders);

        // 🌟 修正：作品詳細と同時に動画情報（videos）を取得する
        const detailRes = await fetch(`https://api.themoviedb.org/3/${work.media_type}/${work.id}?language=ja-JP&append_to_response=videos`, API_OPTIONS);
        const detailData = await detailRes.json();

        return {
          ...work,
          providers,
          genres: detailData.genres || [],
          runtime: detailData.runtime || null,
          numberOfSeasons: detailData.number_of_seasons || null,
          numberOfEpisodes: detailData.number_of_episodes || null,
          episodeRunTime: detailData.episode_run_time?.[0] || null,
          // 🌟 追加：動画IDを取得（最初のYouTubeトレーラーを優先）
          videoKey: detailData.videos?.results?.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer')?.key || null
        };
      })
    );

    worksWithDetails.push(...chunkResults);
    if (i + chunkSize < allWorks.length) await delay(500);
  }

  return <WorkList works={worksWithDetails} davidId={davidId} />;
}