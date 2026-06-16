import WorkList from './WorkList';

export default async function Home() {
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZmI3MzU4NmRkZDRiMTc4YzFjNmMzZWIwNzAxN2Q4NCIsIm5iZiI6MTc4MTQ4NzM4NS40NzksInN1YiI6IjZhMmY1NzE5MjQwNGRmODU3NDA4YjEyNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.53ek30REBz6SxDNbFv-zQIBxNhpW1XhC4eGl-xjs2Bc'
    },
    cache: 'no-store' as RequestCache
  };

  const searchRes = await fetch('https://api.themoviedb.org/3/search/person?query=David+Tennant&language=ja-JP', options);
  const searchData = await searchRes.json();
  const davidId = searchData.results[0].id; 

  const res = await fetch(`https://api.themoviedb.org/3/person/${davidId}/combined_credits?language=ja-JP`, options);
  const data = await res.json();
  
  // 公開順（新しい順）に並び替え
  const allWorks = data.cast.sort((a: any, b: any) => {
    const dateA = new Date(a.release_date || a.first_air_date || '1900-01-01').getTime();
    const dateB = new Date(b.release_date || b.first_air_date || '1900-01-01').getTime();
    return dateB - dateA; 
  });

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const worksWithDetails = [];
  const chunkSize = 20; 

  for (let i = 0; i < allWorks.length; i += chunkSize) {
    const chunk = allWorks.slice(i, i + chunkSize);
    
    const chunkResults = await Promise.all(
      chunk.map(async (work: any) => {
        // ① 配信情報を聞きに行く
        const provRes = await fetch(`https://api.themoviedb.org/3/${work.media_type}/${work.id}/watch/providers`, options);
        const provData = await provRes.json();
        let jpProviders = provData.results?.JP?.flatrate || [];

        // 🌟 --- ここから追加：特定作品の配信状況を手動で上書き・追加する ---
        const currentTitle = work.title || work.name;
        if (currentTitle === 'Good Omens - Season 3: An Ineffable Goodbye') {
          // Amazon Prime Video のデータを手動で追加
          jpProviders = [
            ...jpProviders,
            {
              provider_id: 119, // TMDBにおける Amazon Prime Video の共通ID
              provider_name: 'Amazon Prime Video',
              logo_path: '/pvske1MyAoymrs5bguRfVqYiM9a.jpg'
            },
            {
              provider_id: 2100, 
              provider_name: 'Amazon Prime Video with Ads',
              logo_path: '/8aBqoNeGGr0oSA85iopgNZUOTOc.jpg'
            }
          ];
        }
        // 🌟 --- ここまで追加 ---

        
        // 🌟 ② 作品の詳細情報（時間やジャンルなど）を聞きに行く
        const detailRes = await fetch(`https://api.themoviedb.org/3/${work.media_type}/${work.id}?language=ja-JP`, options);
        const detailData = await detailRes.json();

        // 1話あたりの分数（配列で来る場合があるので調整）
        const epTime = detailData.episode_run_time && detailData.episode_run_time.length > 0 
          ? detailData.episode_run_time[0] 
          : null;
        
        return {
          ...work,
          providers: jpProviders,
          // 🌟 取得した詳細データをポケットに詰め込む
          genres: detailData.genres || [],
          runtime: detailData.runtime || null,
          numberOfSeasons: detailData.number_of_seasons || null,
          numberOfEpisodes: detailData.number_of_episodes || null,
          episodeRunTime: epTime
        };
      })
    );
    
    worksWithDetails.push(...chunkResults);
    
    if (i + chunkSize < allWorks.length) {
      await delay(500);
    }
  }

  return <WorkList works={worksWithDetails} davidId={davidId} />;
}