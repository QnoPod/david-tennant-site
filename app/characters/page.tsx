import CharacterList from './CharacterList';

// 🌟 API設定と通信オプション（作品リストと同じもの）
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZmI3MzU4NmRkZDRiMTc4YzFjNmMzZWIwNzAxN2Q4NCIsIm5iZiI6MTc4MTQ4NzM4NS40NzksInN1YiI6IjZhMmY1NzE5MjQwNGRmODU3NDA4YjEyNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.53ek30REBz6SxDNbFv-zQIBxNhpW1XhC4eGl-xjs2Bc'
  },
  next: { revalidate: 86400 } // 24時間キャッシュ
};

export default async function CharactersPage() {
  let tmdbWorks = [];
  
  try {
    // 1. デヴィッド・テナントのIDを取得
    const searchRes = await fetch('https://api.themoviedb.org/3/search/person?query=David+Tennant&language=ja-JP', API_OPTIONS);
    const searchData = await searchRes.json();
    const davidId = searchData.results[0].id;

    // 2. 出演作品一覧を取得（キャラクターリストでは配信情報等は不要なため、一括取得のみで高速化します）
    const res = await fetch(`https://api.themoviedb.org/3/person/${davidId}/combined_credits?language=ja-JP`, API_OPTIONS);
    const data = await res.json();
    
    tmdbWorks = data.cast || [];
  } catch (error) {
    console.error('TMDB API fetch error:', error);
  }

  // 取得した作品データをクライアントコンポーネント（CharacterList）に渡す
  return <CharacterList tmdbWorks={tmdbWorks} />;
}