import { useState, useMemo, useEffect } from 'react';
import { customCharacterInfo } from '../data/details';
import { customCharacterImages } from '../data/characters';
import { searchDictionary } from '../data/searchDictionary';
import { yearOverrides } from '../data/yearOverrides';
import { characterAttributes } from '../data/characterAttributes';
import { parseCharacterInfo } from '../utils/characterUtils';

const normalizeText = (text: string) => {
  if (!text) return '';
  return String(text)
    .normalize('NFKC')         
    .toLowerCase()             
    .replace(/[\s ・=\-.,:;!?'"()\[\]{}~～＆&]/g, ''); 
};

export function useCharacters(tmdbWorks: any[]) {
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [showAttributes, setShowAttributes] = useState(false);
  
  const [watchStatusFilter, setWatchStatusFilter] = useState<string>('ALL');
  const [watchedIds, setWatchedIds] = useState<number[]>([]);

  useEffect(() => {
    const loadWatchedStatus = () => {
      const watched = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('watchedWorks') || '[]')
        : [];
      setWatchedIds(watched);
    };
    loadWatchedStatus();
    window.addEventListener('watchedUpdated', loadWatchedStatus);
    return () => window.removeEventListener('watchedUpdated', loadWatchedStatus);
  }, []);

  const characters = useMemo(() => {
    const allChars = Object.keys(customCharacterInfo).map((workTitle) => {
      const rawInfo = customCharacterInfo[workTitle] || '';
      const { jaName, description: cleanDescription } = parseCharacterInfo(rawInfo);
      const charName = jaName || "情報なし";

      const imageKey = 
        (charName.includes('10th Doctor') || charName.includes('10代目ドクター')) ? '10th doctor' :
        charName.includes('14代目ドクター') ? 'Doctor Who: 60th Anniversary Specials' :
        (workTitle.includes('Scrooge McDuck') || charName.includes('Scrooge McDuck') || charName.includes('スクルージ')) ? 'Scrooge McDuck' : 
        workTitle;
      
      const charImage = customCharacterImages[imageKey] || customCharacterImages[workTitle] || null;
      const normalizedTitle = normalizeText(workTitle);
      const rawDisplayTitle = searchDictionary[normalizedTitle] || workTitle;
      const displayWorkTitle = rawDisplayTitle.replace(/^Doctor Who$/, 'Doctor Whoシリーズ');
      
      let year = '年不明';
      let fullDateStr = ''; 

      if (yearOverrides[workTitle]) {
        year = yearOverrides[workTitle];
      } else if (charName.includes('10代目ドクター') || workTitle.includes('Doctor Who') || workTitle.includes('10th Doctor')) {
        year = '2005';
        fullDateStr = '2005-06-18'; 
      } else if (workTitle.includes('Scrooge McDuck') || charName.includes('Scrooge McDuck') || charName.includes('スクルージ')) {
        year = '2017';
        fullDateStr = '2017-08-12';
      } else if (charName.includes('ドナルド・ピーターソン') || charName.includes('ロデリック・ピーターソン')) {
        year = '2012';
        fullDateStr = '2012-11-23';
      }

      // 🌟 表記揺れ対策：関連する全ての名前を検索対象に
      let searchTitles = [workTitle, rawDisplayTitle];
      let matchedWorkIds: number[] = []; // 🌟 ここに関連する全IDをストックします

      const lowerWorkTitle = workTitle.toLowerCase();
      const lowerCharName = charName.toLowerCase();

      // ドクター・フー関連（新旧すべて網羅）
      if (
        lowerCharName.includes('10代目') || 
        lowerCharName.includes('14代目') || 
        lowerCharName.includes('10th') || 
        lowerCharName.includes('14th') || 
        lowerCharName.includes('doctor') || 
        lowerWorkTitle.includes('doctor') ||
        lowerWorkTitle.includes('ドクター')
      ) {
        searchTitles.push('Doctor Who');
        searchTitles.push('ドクター・フー');
        matchedWorkIds.push(57243, 239770, 105919, 241855, 121); 
      }

      // ピーターソン兄弟（Nativity 2）
      if (
        lowerCharName.includes('ピーターソン') || 
        lowerCharName.includes('peterson') || 
        lowerWorkTitle.includes('nativity')
      ) {
        searchTitles.push('Nativity 2: Danger in the Manger!');
        searchTitles.push('Nativity 2');
        matchedWorkIds.push(119684); 
      }

      // スクルージ・マクダック
      if (
        lowerCharName.includes('スクルージ') || 
        lowerCharName.includes('scrooge') || 
        lowerWorkTitle.includes('scrooge') ||
        lowerWorkTitle.includes('ダックテイルズ')
      ) {
        searchTitles.push('DuckTales');
        searchTitles.push('ダックテイルズ');
        matchedWorkIds.push(71184); 
      }

      // 🌟 TMDBデータとの総当たり照合（一致した作品のIDを「すべて」追加する）
      if (tmdbWorks && tmdbWorks.length > 0) {
        tmdbWorks.forEach((w: any) => {
          const tmdbTitle = normalizeText(w.title || '');
          const tmdbName = normalizeText(w.name || '');
          const tmdbOrigTitle = normalizeText(w.original_title || '');
          const tmdbOrigName = normalizeText(w.original_name || '');

          const isMatch = searchTitles.some(t => {
            const normT = normalizeText(t);
            if (!normT) return false;
            return (
              (tmdbTitle && (tmdbTitle.includes(normT) || normT.includes(tmdbTitle))) ||
              (tmdbName && (tmdbName.includes(normT) || normT.includes(tmdbName))) ||
              (tmdbOrigTitle && (tmdbOrigTitle.includes(normT) || normT.includes(tmdbOrigTitle))) ||
              (tmdbOrigName && (tmdbOrigName.includes(normT) || normT.includes(tmdbOrigName)))
            );
          });

          if (isMatch) {
            matchedWorkIds.push(w.id); // 関連するIDは全部ストック
            
            // ついでに公開年も取得（まだ不明な場合のみ）
            const dateStr = w.first_air_date || w.release_date;
            if (dateStr && year === '年不明') {
              year = dateStr.substring(0, 4);
              fullDateStr = dateStr; 
            }
          }
        });
      }

      // 年齢計算ロジック
      let age: string | number = '不明';
      if (fullDateStr) {
        const releaseDate = new Date(fullDateStr);
        const birthDate = new Date('1971-04-18');
        let calculatedAge = releaseDate.getFullYear() - birthDate.getFullYear();
        const m = releaseDate.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && releaseDate.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        age = calculatedAge;
      } else if (year !== '年不明') {
        age = parseInt(year) - 1971;
      }

      const attrRaw = characterAttributes[charName] || '';
      const attributes = attrRaw ? attrRaw.split(/[、,\/]/).map(s => s.trim()).filter(Boolean) : [];

      // 🌟 【最重要修正】型安全のため、IDをすべて文字列に変換して比較する
      const safeWatchedIds = watchedIds.map(String);
      const safeMatchedIds = matchedWorkIds.map(String);

      // ストックした関連IDの「どれか一つでも」視聴済みに含まれていればTRUE
      const isWatched = safeMatchedIds.some(id => safeWatchedIds.includes(id));

      return {
        workTitle, displayWorkTitle, charName, charImage,
        fullDescription: cleanDescription, year, age, attributes, isWatched
      };
    });

    // 視聴ステータスフィルター
    const filteredChars = allChars.filter((char) => {
      if (watchStatusFilter === 'WATCHED') return char.isWatched;
      if (watchStatusFilter === 'UNWATCHED') return !char.isWatched;
      return true; 
    });

    // ソート処理
    return filteredChars.sort((a, b) => {
      if (viewMode === 'timeline') {
        const yearA = a.year === '年不明' ? 0 : parseInt(a.year); 
        const yearB = b.year === '年不明' ? 0 : parseInt(b.year);
        if (yearA !== yearB) return yearB - yearA; 
        
        const ageA = a.age === '不明' ? 0 : Number(a.age);
        const ageB = b.age === '不明' ? 0 : Number(b.age);
        if (ageA !== ageB) return ageB - ageA; 
      }
      return a.charName.localeCompare(b.charName, 'ja');
    });
  }, [tmdbWorks, viewMode, watchStatusFilter, watchedIds]);

  const groupedCharacters = useMemo(() => {
    const groups: Record<string, typeof characters> = {};
    characters.forEach(char => {
      if (char.attributes && char.attributes.length > 0) {
        char.attributes.forEach((attr: string) => {
          if (!groups[attr]) groups[attr] = [];
          if (!groups[attr].find(c => c.workTitle === char.workTitle && c.charName === char.charName)) {
            groups[attr].push(char);
          }
        });
      } else {
        if (!groups['その他']) groups['その他'] = [];
        groups['other'] = groups['その他']; 
        groups['その他'].push(char);
      }
    });
    return groups;
  }, [characters]);

  const groupKeys = Object.keys(groupedCharacters).filter(k => k !== 'other').sort((a, b) => {
    const getPriority = (key: string) => {
      if (key === 'その他') return 2;
      if (key === 'その他職業') return 1;
      return 0;
    };
    const pA = getPriority(a);
    const pB = getPriority(b);
    if (pA !== pB) return pA - pB;
    return a.localeCompare(b, 'ja');
  });

  const handleToggleView = () => {
    setViewMode(prev => prev === 'grid' ? 'timeline' : 'grid');
  };

  return {
    viewMode, handleToggleView,
    showAttributes, setShowAttributes,
    watchStatusFilter, setWatchStatusFilter, 
    characters, groupedCharacters, groupKeys
  };
}