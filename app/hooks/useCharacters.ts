import { useState, useMemo } from 'react';
import { customCharacterInfo } from '../data/details';
import { customCharacterImages } from '../data/characters';
import { searchDictionary } from '../data/searchDictionary';
import { yearOverrides } from '../data/yearOverrides';
import { characterAttributes } from '../data/characterAttributes';
import { parseCharacterInfo } from '../utils/characterUtils';

// 文字を強力に整える関数（内部で使用）
const normalizeText = (text: string) => {
  if (!text) return '';
  return String(text)
    .normalize('NFKC')         
    .toLowerCase()             
    .replace(/[\s ・=\-.,:;!?'"()\[\]{}~～＆&]/g, ''); 
};

export function useCharacters(tmdbWorks: any[]) {
  // 🌟 UIの表示切替に関わる状態管理
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [showAttributes, setShowAttributes] = useState(false);

  // 🌟 TMDBデータと手動データを結合し、年齢計算などを行う巨大なロジック
  const characters = useMemo(() => {
    return Object.keys(customCharacterInfo).map((workTitle) => {
      const rawInfo = customCharacterInfo[workTitle] || '';
      const { jaName, description: cleanDescription } = parseCharacterInfo(rawInfo);
      const charName = jaName || "情報なし";

      const imageKey = 
        (charName.includes('10th Doctor') || charName.includes('10代目ドクター')) ? '10th doctor' :
        charName.includes('14代目ドクター') ? 'Doctor Who: 60th Anniversary Specials' :
        (workTitle === 'Scrooge McDuck' || charName.includes('Scrooge McDuck') || charName.includes('スクルージ')) ? 'Scrooge McDuck' : 
        workTitle;
      
      const charImage = customCharacterImages[imageKey] || customCharacterImages[workTitle] || null;
      const normalizedTitle = normalizeText(workTitle);
      const rawDisplayTitle = searchDictionary[normalizedTitle] || workTitle;
      const displayWorkTitle = rawDisplayTitle.replace(/^Doctor Who$/, 'Doctor Whoシリーズ');
      
      let year = '年不明';
      let fullDateStr = ''; 

      if (yearOverrides[workTitle]) {
        year = yearOverrides[workTitle];
      } else if (charName === '10代目ドクター' || workTitle.includes('Doctor Who')) {
        year = '2005';
        fullDateStr = '2005-06-18'; 
      } else if (workTitle === 'Scrooge McDuck' || charName.includes('Scrooge McDuck')) {
        year = '2017';
        fullDateStr = '2017-08-12';
      } else if (['ドナルド・ピーターソン', 'ロデリック・ピーターソン'].includes(charName)) {
        year = '2012';
        fullDateStr = '2012-11-23';
      } else if (tmdbWorks && tmdbWorks.length > 0) {
        const normalizedWorkTitle = normalizeText(workTitle);
        const rawDisplayTitleNorm = normalizeText(rawDisplayTitle);

        const matchedWork = tmdbWorks.find((w: any) => {
          const tmdbTitle = normalizeText(w.title || '');
          const tmdbName = normalizeText(w.name || '');
          const tmdbOrigTitle = normalizeText(w.original_title || '');
          const tmdbOrigName = normalizeText(w.original_name || '');

          return (
            (tmdbTitle && (tmdbTitle.includes(normalizedWorkTitle) || tmdbTitle.includes(rawDisplayTitleNorm))) ||
            (tmdbName && (tmdbName.includes(normalizedWorkTitle) || tmdbName.includes(rawDisplayTitleNorm))) ||
            (tmdbOrigTitle && (tmdbOrigTitle.includes(normalizedWorkTitle) || tmdbOrigTitle.includes(rawDisplayTitleNorm))) ||
            (tmdbOrigName && (tmdbOrigName.includes(normalizedWorkTitle) || tmdbOrigName.includes(rawDisplayTitleNorm))) ||
            (normalizedWorkTitle && tmdbTitle && normalizedWorkTitle.includes(tmdbTitle)) ||
            (normalizedWorkTitle && tmdbName && normalizedWorkTitle.includes(tmdbName))
          );
        });

        if (matchedWork) {
          const dateStr = matchedWork.first_air_date || matchedWork.release_date;
          if (dateStr) {
            year = dateStr.substring(0, 4);
            fullDateStr = dateStr; 
          }
        }
      }

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

      return {
        workTitle, displayWorkTitle, charName, charImage,
        fullDescription: cleanDescription, year, age, attributes 
      };
    }).sort((a, b) => {
      // タイムラインのときは公開順、グリッドのときは五十音順
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
  }, [tmdbWorks, viewMode]);

  // 🌟 属性ごとのグループ化ロジック
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
        groups['その他'].push(char);
      }
    });
    return groups;
  }, [characters]);

  // 🌟 グループ枠の表示順（ソート）
  const groupKeys = Object.keys(groupedCharacters).sort((a, b) => {
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

  // 🌟 必要なステートと計算結果だけを返す
  return {
    viewMode, handleToggleView,
    showAttributes, setShowAttributes,
    characters, groupedCharacters, groupKeys
  };
}