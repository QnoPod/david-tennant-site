'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import FilterControls from './components/FilterControls';
import WorkCard from './components/WorkCard';
import WorkModal from './components/WorkModal';
import ScrollButtons from './components/ScrollButtons'; 
// 🌟 作成した検索辞書をインポート
import { searchDictionary } from './data/searchDictionary';
// 🌟 キャラクター名情報がある details をインポート
import { customCharacterInfo } from './data/details';

// 🌟 文字を強力に整える関数（コンポーネントの外に出して全体で使い回す）
const normalizeText = (text: string) => {
  if (!text) return '';
  return String(text)
    .normalize('NFKC')         // 全角アルファベットなどを半角に統一
    .toLowerCase()             // 大文字を小文字に統一
    .replace(/[\s ・=\-.,:;!?'"()\[\]{}~～＆&]/g, '');  // 🌟 半角・全角スペース、記号をすべて無視する
};

export default function WorkList({ works, davidId }: { works: any[], davidId: number }) {
  const uniqueWorks = useMemo(() => {
    const map = new Map();
    works.forEach((work) => {
      const originalTmdbTitle = work.title || work.name; // 🌟 追加：上書きされる前の「TMDB本来のタイトル」を保存
      let displayTitle = originalTmdbTitle;
      const originalTitle = work.original_title || work.original_name;
      
      // 🌟 辞書を使って、画面の表示タイトルも強制的に邦題へ上書きする
      const normalizedOrig = normalizeText(originalTitle);
      if (searchDictionary[normalizedOrig]) {
        displayTitle = searchDictionary[normalizedOrig];
      }

      // タイトルを上書きした新しい作品データ（クローン）を作成
      const updatedWork = {
        ...work,
        tmdb_title: originalTmdbTitle, // 🌟 追加：あらすじやキャラ情報取得用のキーとして「元のタイトル」を持たせておく
        title: work.title ? displayTitle : undefined,
        name: work.name ? displayTitle : undefined,
      };

      if (!map.has(displayTitle)) map.set(displayTitle, updatedWork);
    });
    return Array.from(map.values());
  }, [works]);

  const [selectedWork, setSelectedWork] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [charSearchTerm, setCharSearchTerm] = useState(''); // 🌟 キャラクター検索用state
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'default' | 'popularity' | 'title'>('default');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  
  // 🌟 お気に入りリストをリアルタイム管理
  const [favorites, setFavorites] = useState<number[]>([]);

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genreSearchMode, setGenreSearchMode] = useState<'include' | 'exclude'>('include');
  const [isExpanded, setIsExpanded] = useState(false);

  // 🌟 イベント受信でお気に入りを更新
  useEffect(() => {
    const loadFavorites = () => {
      const favs = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('favorites') || '[]') 
        : [];
      setFavorites(favs);
    };
    
    loadFavorites();

    window.addEventListener('favoritesUpdated', loadFavorites);
    return () => window.removeEventListener('favoritesUpdated', loadFavorites);
  }, []);

  const allProviders = useMemo(() => {
    const providersMap = new Set<string>();
    works.forEach(work => work.providers?.forEach((p: any) => providersMap.add(p.provider_name)));
    return Array.from(providersMap);
  }, [works]);

  const allGenres = useMemo(() => {
    const genresSet = new Set<string>();
    works.forEach(work => work.genres?.forEach((g: any) => genresSet.add(g.name)));
    return Array.from(genresSet).sort();
  }, [works]);

  const toggleProvider = (name: string) => {
    setSelectedProviders(prev => 
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const filteredWorks = useMemo(() => {
    const searchLower = normalizeText(searchTerm);
    const charSearchLower = normalizeText(charSearchTerm); // 🌟 キャラクタ検索用の正規化

    return uniqueWorks.filter((work: any) => {
      // 🌟 邦題も原題も全部つなげて判定する
      let allTitles = normalizeText(`
        ${work.title || ''} 
        ${work.name || ''} 
        ${work.original_title || ''} 
        ${work.original_name || ''}
      `);

      // 🌟 外部ファイルから読み込んだ辞書を使って、ヒットした作品にキーワードを追加
      Object.entries(searchDictionary).forEach(([key, value]) => {
        if (allTitles.includes(key)) {
          allTitles += value;
        }
      });
      
      const matchesSearch = allTitles.includes(searchLower);
      
      // 🌟 検索対象を「TMDBのキャラ名」＋「details.tsから抽出した日本語名」に拡大
      const workTitle = work.tmdb_title || work.title || work.name;
      const charInfoRaw = customCharacterInfo[workTitle] || ''; 
      
      // 🌟 共通情報の取得 (10代目ドクターの場合、共通情報を検索対象に追加)
      const tenDocInfo = customCharacterInfo["10th Doctor"] || '';
      const isTenDoc = work.character === 'The Doctor' || work.character === 'The Doctor (10)';
      
      // \n または ： より前の部分だけを名前として抽出
      const extractedCharName = charInfoRaw.includes('：') 
        ? charInfoRaw.split('：')[0] 
        : charInfoRaw.includes('\n') 
        ? charInfoRaw.split('\n')[0] 
        : charInfoRaw;

      // 🌟 検索対象はTMDBのキャラ名と、抽出した日本語名＋共通情報
      const charName = normalizeText(
        `${work.character || ''} ${extractedCharName} ${isTenDoc ? tenDocInfo : ''}`
      );
      
      // 🌟 キャラクター名検索の判定
      const matchesCharSearch = charName.includes(charSearchLower);
      
      const matchesProvider = selectedProviders.length === 0 || 
        work.providers?.some((p: any) => selectedProviders.includes(p.provider_name));
      
      const hasProviders = work.providers && work.providers.length > 0;
      const matchesAvailability = 
        availabilityFilter === 'ALL' ? true :
        availabilityFilter === 'AVAILABLE' ? hasProviders : !hasProviders;
      
      const matchesGenre = selectedGenres.length === 0 || 
        (genreSearchMode === 'include' 
          ? work.genres?.some((g: any) => selectedGenres.includes(g.name))
          : !work.genres?.some((g: any) => selectedGenres.includes(g.name))
        );

      const matchesFavorites = !showOnlyFavorites || favorites.includes(work.id);
      
      return matchesSearch && matchesCharSearch && matchesProvider && matchesAvailability && matchesGenre && matchesFavorites;
    });
  }, [uniqueWorks, searchTerm, charSearchTerm, selectedProviders, availabilityFilter, selectedGenres, genreSearchMode, showOnlyFavorites, favorites]);

  const sortedWorks = useMemo(() => {
    let list = [...filteredWorks];
    if (sortOrder === 'popularity') {
      list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else if (sortOrder === 'title') {
      list.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));
    }
    return list;
  }, [filteredWorks, sortOrder]);

  return (
    <main style={{ padding: '40px 20px', fontFamily: 'sans-serif', backgroundColor: '#141414', minHeight: '100vh', color: '#fff' }}>
      
      {/* 🌟 スマホとPCでレイアウトと文字サイズを切り替えるCSS */}
      <style>{`
        .work-grid {
          display: grid;
          /* PC表示: 横幅220px以上で並べられるだけ並べる */
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 30px;
          
          /* 🎨 PC用の各サイズ設定（変数） */
          --card-padding: 15px;
          --title-size: 16px;
          --meta-size: 12px;
          --icon-size: 32px;
          --icon-gap: 8px;
          --fav-btn-size: 36px;
          --fav-btn-font: 18px;
        }
        
        .main-title {
          font-size: 32px;
        }

        /* スマホ表示 (横幅600px以下) の場合 */
        @media (max-width: 600px) {
          .work-grid {
            /* 強制的に3列にする */
            grid-template-columns: repeat(3, 1fr);
            /* スマホの画面に合わせて隙間を狭くする */
            gap: 10px;
            
            /* 🎨 スマホ用に各サイズを全体的にギュッと小さくする */
            --card-padding: 8px;
            --title-size: 11px;
            --meta-size: 9px;
            --icon-size: 20px;
            --icon-gap: 4px;
            --fav-btn-size: 26px;
            --fav-btn-font: 14px;
          }

          /* 🌟 タイトルのスマホ対応 */
          .main-title {
            font-size: 24px; /* スマホでは少し小さくする */
          }
          .title-dash {
            display: none; /* 「-」を消す */
          }
          .title-sub {
            display: block; /* 改行させる */
            font-size: 18px; /* サブタイトル部分を少し小さく */
            margin-top: 4px;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <h1 className="main-title" style={{ marginBottom: '10px' }}>
          David Tennant<span className="title-dash"> - </span><span className="title-sub">作品＆配信情報</span>
        </h1>
        
        <div style={{ marginBottom: '20px' }}>
          <Link href="/characters" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#ff9f43', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
            👥 キャラクターリストを見る
          </Link>
        </div>
        
        <FilterControls 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          charSearchTerm={charSearchTerm}
          setCharSearchTerm={setCharSearchTerm}
          availabilityFilter={availabilityFilter}
          setAvailabilityFilter={setAvailabilityFilter}
          allProviders={allProviders}
          selectedProviders={selectedProviders}
          toggleProvider={toggleProvider}
          setSelectedProviders={setSelectedProviders}
          allGenres={allGenres}
          selectedGenres={selectedGenres}
          setSelectedGenres={setSelectedGenres}
          genreSearchMode={genreSearchMode}
          setGenreSearchMode={setGenreSearchMode}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          showOnlyFavorites={showOnlyFavorites}
          setShowOnlyFavorites={setShowOnlyFavorites}
        />
        
        <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '15px' }}>
          カードをクリックすると詳細が表示されます
        </p>
        <p style={{ color: '#aaa', marginBottom: '40px' }}>
          {sortedWorks.length} 件の作品を表示中 (全 {uniqueWorks.length} 作品)
        </p>
        
        <div className="work-grid">
          {sortedWorks.map((work: any, index: number) => (
            <WorkCard key={`${work.id}-${index}`} work={work} onClick={() => setSelectedWork(work)} />
          ))}
        </div>
      </div>
      <WorkModal work={selectedWork} onClose={() => setSelectedWork(null)} />
      <ScrollButtons />

      {/* 🌟 フッター部分にバージョン情報を追加 */}      
      <footer style={{ textAlign: 'center', marginTop: '60px', paddingBottom: '20px', color: '#666', fontSize: '14px' }}>
        Ver 2.0
      </footer>
      
    </main>
  );
}