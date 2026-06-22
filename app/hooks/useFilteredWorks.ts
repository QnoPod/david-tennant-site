import { useState, useMemo, useEffect } from 'react';
import { searchDictionary } from '../data/searchDictionary';
import { customCharacterInfo } from '../data/details';

// 文字を強力に整える関数
const normalizeText = (text: string) => {
  if (!text) return '';
  return String(text).normalize('NFKC').toLowerCase().replace(/[\s ・=\-.,:;!?'"()\[\]{}~～＆&]/g, '');
};

export function useFilteredWorks(works: any[], viewMode: 'grid' | 'timeline') {
  const [searchTerm, setSearchTerm] = useState('');
  const [charSearchTerm, setCharSearchTerm] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  
  const [watchStatusFilter, setWatchStatusFilter] = useState('ALL'); 
  
  const [sortOrder, setSortOrder] = useState<'default' | 'popularity' | 'title'>('default');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  
  const [favorites, setFavorites] = useState<number[]>([]);
  
  const [watchedWorks, setWatchedWorks] = useState<any[]>([]); 
  const [watchStatusObj, setWatchStatusObj] = useState<any>({});

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genreSearchMode, setGenreSearchMode] = useState<'include' | 'exclude'>('include');

  // お気に入りのリアルタイム管理
  useEffect(() => {
    const loadFavorites = () => {
      const favs = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('favorites') || '[]') : [];
      setFavorites(favs);
    };
    loadFavorites();
    window.addEventListener('favoritesUpdated', loadFavorites);
    return () => window.removeEventListener('favoritesUpdated', loadFavorites);
  }, []);

  // 視聴済リストのリアルタイム管理
  useEffect(() => {
    const loadWatched = () => {
      if (typeof window !== 'undefined') {
        try {
          const watched = JSON.parse(localStorage.getItem('watchedWorks') || '[]');
          setWatchedWorks(Array.isArray(watched) ? watched : []);
        } catch (e) {
          setWatchedWorks([]);
        }
        
        try {
          const statusObj = JSON.parse(localStorage.getItem('watchStatus') || '{}');
          setWatchStatusObj(statusObj);
        } catch (e) {
          setWatchStatusObj({});
        }
      }
    };
    
    loadWatched();
    window.addEventListener('watchedUpdated', loadWatched);
    window.addEventListener('watchStatusUpdated', loadWatched);
    return () => {
      window.removeEventListener('watchedUpdated', loadWatched);
      window.removeEventListener('watchStatusUpdated', loadWatched);
    };
  }, []);

  // 🌟 IDベースの視聴済リストから、タイトル文字列のリストを生成して保存（キャラソート連携用）
  useEffect(() => {
    if (typeof window !== 'undefined' && works && works.length > 0) {
      const watchedTitles = works
        .filter((work: any) => watchedWorks.includes(work.id) || watchedWorks.includes(String(work.id)))
        .map((work: any) => work.tmdb_title || work.title || work.name);

      localStorage.setItem('watchedTitlesCache', JSON.stringify(watchedTitles));
    }
  }, [watchedWorks, works]);

  const uniqueWorks = useMemo(() => {
    const map = new Map();
    works.forEach((work) => {
      const originalTmdbTitle = work.title || work.name; 
      let displayTitle = originalTmdbTitle;
      const originalTitle = work.original_title || work.original_name;
      
      const normalizedOrig = normalizeText(originalTitle);
      if (searchDictionary[normalizedOrig]) displayTitle = searchDictionary[normalizedOrig];

      const updatedWork = {
        ...work,
        tmdb_title: originalTmdbTitle,
        title: work.title ? displayTitle : undefined,
        name: work.name ? displayTitle : undefined,
      };

      if (!map.has(displayTitle)) map.set(displayTitle, updatedWork);
    });
    return Array.from(map.values());
  }, [works]);

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
    setSelectedProviders(prev => prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]);
  };

  const filteredWorks = useMemo(() => {
    const searchLower = normalizeText(searchTerm);
    const charSearchLower = normalizeText(charSearchTerm);

    const isWorkWatchedByTitle = (title: string | undefined) => {
      if (!title || !watchStatusObj) return false;
      const tKey = String(title).trim();
      if (Array.isArray(watchStatusObj)) {
        return watchStatusObj.map((t: any) => String(t).trim()).includes(tKey);
      }
      if (typeof watchStatusObj === 'object') {
        if (watchStatusObj[tKey] === 'WATCHED' || watchStatusObj[tKey] === true) return true;
        for (const key in watchStatusObj) {
          if (key.trim() === tKey) {
            return watchStatusObj[key] === 'WATCHED' || watchStatusObj[key] === true;
          }
        }
      }
      return false;
    };

    return uniqueWorks.filter((work: any) => {
      let allTitles = normalizeText(`${work.title || ''} ${work.name || ''} ${work.original_title || ''} ${work.original_name || ''}`);

      Object.entries(searchDictionary).forEach(([key, value]) => {
        if (allTitles.includes(key)) allTitles += value;
      });
      
      const matchesSearch = allTitles.includes(searchLower);
      
      const workTitle = work.tmdb_title || work.title || work.name;
      const charInfoRaw = customCharacterInfo[workTitle] || ''; 
      const tenDocInfo = customCharacterInfo["10th Doctor"] || '';
      const isTenDoc = work.character === 'The Doctor' || work.character === 'The Doctor (10)';
      const scroogeInfo = customCharacterInfo["Scrooge McDuck"] || '';
      const isScrooge = work.character && work.character.includes('Scrooge McDuck');
      
      const extractedCharName = charInfoRaw.includes('：') ? charInfoRaw.split('：')[0] : charInfoRaw.includes('\n') ? charInfoRaw.split('\n')[0] : charInfoRaw;
      const charName = normalizeText(`${work.character || ''} ${extractedCharName} ${isTenDoc ? tenDocInfo : ''} ${isScrooge ? scroogeInfo : ''}`);
      
      const matchesCharSearch = charName.includes(charSearchLower);
      const matchesProvider = selectedProviders.length === 0 || work.providers?.some((p: any) => selectedProviders.includes(p.provider_name));
      const hasProviders = work.providers && work.providers.length > 0;
      const matchesAvailability = availabilityFilter === 'ALL' ? true : availabilityFilter === 'AVAILABLE' ? hasProviders : !hasProviders;
      
      const matchesGenre = selectedGenres.length === 0 || 
        (genreSearchMode === 'include' 
          ? work.genres?.some((g: any) => selectedGenres.includes(g.name))
          : !work.genres?.some((g: any) => selectedGenres.includes(g.name))
        );

      const matchesFavorites = !showOnlyFavorites || favorites.includes(work.id);

      const isWatched = 
        watchedWorks.includes(work.id) || 
        watchedWorks.includes(String(work.id)) ||
        isWorkWatchedByTitle(work.tmdb_title) ||
        isWorkWatchedByTitle(work.title) ||
        isWorkWatchedByTitle(work.name) ||
        isWorkWatchedByTitle(work.original_title) ||
        isWorkWatchedByTitle(work.original_name);

      const matchesWatchStatus = 
        watchStatusFilter === 'ALL' ? true : 
        watchStatusFilter === 'WATCHED' ? isWatched : 
        !isWatched;
      
      return matchesSearch && matchesCharSearch && matchesProvider && matchesAvailability && matchesGenre && matchesFavorites && matchesWatchStatus;
    });
  }, [uniqueWorks, searchTerm, charSearchTerm, selectedProviders, availabilityFilter, selectedGenres, genreSearchMode, showOnlyFavorites, favorites, watchStatusFilter, watchedWorks, watchStatusObj]);

  const activeSortOrder = viewMode === 'timeline' ? 'default' : sortOrder;

  const sortedWorks = useMemo(() => {
    let list = [...filteredWorks];
    if (activeSortOrder === 'popularity') {
      list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else if (activeSortOrder === 'title') {
      list.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));
    }
    return list;
  }, [filteredWorks, activeSortOrder]);

  return {
    searchTerm, setSearchTerm, charSearchTerm, setCharSearchTerm,
    selectedProviders, setSelectedProviders, toggleProvider,
    availabilityFilter, setAvailabilityFilter,
    watchStatusFilter, setWatchStatusFilter,
    sortOrder, setSortOrder,
    showOnlyFavorites, setShowOnlyFavorites, selectedGenres, setSelectedGenres,
    genreSearchMode, setGenreSearchMode, allProviders, allGenres,
    uniqueWorks, sortedWorks, activeSortOrder
  };
}