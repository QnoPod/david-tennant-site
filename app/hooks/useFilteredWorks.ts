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
  const [sortOrder, setSortOrder] = useState<'default' | 'popularity' | 'title'>('default');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
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
      
      return matchesSearch && matchesCharSearch && matchesProvider && matchesAvailability && matchesGenre && matchesFavorites;
    });
  }, [uniqueWorks, searchTerm, charSearchTerm, selectedProviders, availabilityFilter, selectedGenres, genreSearchMode, showOnlyFavorites, favorites]);

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
    availabilityFilter, setAvailabilityFilter, sortOrder, setSortOrder,
    showOnlyFavorites, setShowOnlyFavorites, selectedGenres, setSelectedGenres,
    genreSearchMode, setGenreSearchMode, allProviders, allGenres,
    uniqueWorks, sortedWorks, activeSortOrder
  };
}