'use client';

import { useState, useEffect } from 'react';
import { customCharacterInfo } from '../../data/details';
import { customCharacterImages } from '../../data/characters';

export type CharacterStat = {
  id: string;
  charName: string;
  charImage: string;
  workTitle: string;
  rating: number;
  matches: number;
  wins: number;
  unknowns: number;
  isExcluded: boolean;
  isWatched: boolean;
};

const INITIAL_RATING = 1500;
const K_FACTOR = 32;

export function useCharacterSort() {
  const [stats, setStats] = useState<Record<string, CharacterStat>>({});
  const [matchUp, setMatchUp] = useState<[CharacterStat, CharacterStat] | null>(null);
  const [showRanking, setShowRanking] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [pastMatchups, setPastMatchups] = useState<Set<string>>(new Set());
  const [sortTheme, setSortTheme] = useState('好き');
  const [onlyWatched, setOnlyWatched] = useState(false);

  const generateMatchUp = (currentStats: Record<string, CharacterStat>, filterWatched: boolean, currentPastMatchups: Set<string>) => {
    const charList = Object.values(currentStats).filter(c => {
      if (c.isExcluded) return false;
      if (filterWatched && !c.isWatched) return false;
      return true;
    });
    
    if (charList.length < 2) { setShowRanking(true); return; }

    const shuffled = [...charList].sort(() => Math.random() - 0.5);
    const sorted = shuffled.sort((a, b) => a.matches - b.matches);
    const charA = sorted[0];
    const remaining = sorted.slice(1);
    let candidates = remaining.filter(c => !currentPastMatchups.has(`${charA.id}-${c.id}`));
    if (candidates.length === 0) candidates = remaining;

    const opponentIndex = Math.floor(Math.random() * Math.min(10, candidates.length));
    const charB = candidates[opponentIndex];
    setMatchUp([charA, charB]);
  };

  const resetAndStartSort = (filterWatched: boolean) => {
    let watchStatusObj: any = {};
    try {
      const savedStatus = localStorage.getItem('watchStatus');
      watchStatusObj = savedStatus ? JSON.parse(savedStatus) : {};
    } catch (e) {
      console.error("Failed to parse watchStatus from localStorage", e);
    }

    const isWorkWatched = (title: string) => {
      if (!title) return false;
      const tKey = title.trim().toLowerCase();

      try {
        const cache = localStorage.getItem('watchedTitlesCache');
        if (cache) {
          const titlesArr = JSON.parse(cache);
          if (Array.isArray(titlesArr)) {
             const isMatch = titlesArr.some((t: string) => {
               if (!t) return false;
               const wt = String(t).trim().toLowerCase();
               return wt === tKey || wt.includes(tKey) || tKey.includes(wt);
             });
             if (isMatch) return true;
          }
        }
      } catch (e) {}

      if (watchStatusObj) {
         if (Array.isArray(watchStatusObj)) {
            return watchStatusObj.some((t: any) => String(t).trim().toLowerCase() === tKey);
         }
         if (typeof watchStatusObj === 'object') {
            for (const key in watchStatusObj) {
               if (key.trim().toLowerCase() === tKey) {
                  return watchStatusObj[key] === 'WATCHED' || watchStatusObj[key] === true;
               }
            }
         }
      }
      return false;
    };

    const charWatchedMap: Record<string, boolean> = {};

    Object.keys(customCharacterInfo).forEach((workTitle) => {
      if (!workTitle) return;
      const rawInfo = customCharacterInfo[workTitle] || '';
      let charName = rawInfo.includes('：') ? rawInfo.split('：')[0] : (rawInfo.includes('\n') ? rawInfo.split('\n')[0] : rawInfo);

      let displayCharName = charName;
      if (workTitle === 'Scrooge McDuck' || charName.includes('Scrooge McDuck') || charName.includes('スクルージ')) {
        displayCharName = 'スクルージ・マクダック';
      }

      let isWatched = isWorkWatched(workTitle);

      if (!isWatched && (workTitle.includes('10th Doctor') || workTitle.includes('10代目ドクター') || workTitle.includes('14代目ドクター') || charName.includes('10代目ドクター') || charName.includes('14代目ドクター'))) {
        isWatched = isWorkWatched('Doctor Who') || isWorkWatched('Doctor Whoシリーズ') || isWorkWatched('ドクター・フー');
      }
      if (!isWatched && (workTitle === 'Scrooge McDuck' || workTitle.includes('Scrooge McDuck') || workTitle.includes('スクルージ') || charName.includes('Scrooge McDuck') || charName.includes('スクルージ'))) {
        isWatched = isWorkWatched('DuckTales') || isWorkWatched('ダックテイルズ');
      }
      if (!isWatched && ['ドナルド・ピーターソン', 'ロデリック・ピーターソン'].includes(charName)) {
        isWatched = isWorkWatched('Nativity 2: Danger in the Manger!') || isWorkWatched('Nativity 2') || isWorkWatched('ネティビティ2');
      }

      if (isWatched) {
        charWatchedMap[displayCharName] = true;
      }
    });

    const initialStats: Record<string, CharacterStat> = {};
    
    Object.keys(customCharacterInfo).forEach((workTitle) => {
      if (!workTitle) return;
      
      const rawInfo = customCharacterInfo[workTitle] || '';
      let charName = "情報なし";
      if (rawInfo.includes('：')) {
        charName = rawInfo.split('：')[0];
      } else if (rawInfo.includes('\n')) {
        charName = rawInfo.split('\n')[0];
      } else {
        charName = rawInfo;
      }

      const imageKey = 
        (charName.includes('10th Doctor') || charName.includes('10代目ドクター')) ? '10th doctor' :
        charName.includes('14代目ドクター') ? 'Doctor Who: 60th Anniversary Specials' :
        (workTitle === 'Scrooge McDuck' || charName.includes('Scrooge McDuck') || charName.includes('スクルージ')) ? 'Scrooge McDuck' :
        workTitle;
      
      const charImage = customCharacterImages[imageKey] || customCharacterImages[workTitle] || '/default-character.png';

      let displayCharName = charName;
      let displayWorkTitle = workTitle;

      if (workTitle === 'Scrooge McDuck' || charName.includes('Scrooge McDuck') || charName.includes('スクルージ')) {
        displayCharName = 'スクルージ・マクダック';
        displayWorkTitle = 'ディズニー作品';
      } else if (charName.includes('10代目ドクター')) {
        displayWorkTitle = 'Doctor Whoシリーズ';
      } else if (['ドナルド・ピーターソン', 'ロデリック・ピーターソン'].includes(charName)) {
        displayWorkTitle = 'Nativity 2: Danger in the Manger!';
      }

      initialStats[workTitle] = {
        id: workTitle,
        charName: displayCharName,
        charImage,
        workTitle: displayWorkTitle,
        rating: INITIAL_RATING,
        matches: 0,
        wins: 0,
        unknowns: 0,
        isExcluded: false,
        isWatched: charWatchedMap[displayCharName] || false,
      };
    });

    setStats(initialStats);
    setTotalVotes(0);          
    setShowRanking(false);
    const resetMatchups = new Set<string>();
    setPastMatchups(resetMatchups);
    generateMatchUp(initialStats, filterWatched, resetMatchups);
  };

  useEffect(() => {
    resetAndStartSort(false);
  }, []);

  const handleVote = (winnerId: string, loserId: string) => {
    if (!matchUp) return;
    
    const winner = stats[winnerId];
    const loser = stats[loserId];

    const expectedWinner = 1 / (1 + Math.pow(10, (loser.rating - winner.rating) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winner.rating - loser.rating) / 400));

    const newStats = { ...stats };
    newStats[winnerId] = {
      ...winner,
      rating: winner.rating + K_FACTOR * (1 - expectedWinner),
      matches: winner.matches + 1,
      wins: winner.wins + 1 
    };
    newStats[loserId] = {
      ...loser,
      rating: loser.rating + K_FACTOR * (0 - expectedLoser),
      matches: loser.matches + 1
    };

    setStats(newStats);

    const newPastMatchups = new Set(pastMatchups);
    newPastMatchups.add(`${matchUp[0].id}-${matchUp[1].id}`);
    newPastMatchups.add(`${matchUp[1].id}-${matchUp[0].id}`);
    setPastMatchups(newPastMatchups);
    
    setTotalVotes(prev => {
      const newTotal = prev + 1;
      const activeCount = Object.values(newStats).filter(c => !c.isExcluded && (!onlyWatched || c.isWatched)).length;
      const targetVotes = activeCount * 2;
      
      if (newTotal === targetVotes) {
        setShowRanking(true);
      }
      return newTotal;
    });

    generateMatchUp(newStats, onlyWatched, newPastMatchups);
  };

  const handleSkip = (skipType: 'A' | 'B' | 'Both') => {
    if (!matchUp) return;
    const newStats = { ...stats };
    
    if (skipType === 'A' || skipType === 'Both') {
      newStats[matchUp[0].id].unknowns += 1;
      newStats[matchUp[0].id].isExcluded = true;
    }
    if (skipType === 'B' || skipType === 'Both') {
      newStats[matchUp[1].id].unknowns += 1;
      newStats[matchUp[1].id].isExcluded = true;
    }

    setStats(newStats);

    const newPastMatchups = new Set(pastMatchups);
    newPastMatchups.add(`${matchUp[0].id}-${matchUp[1].id}`);
    newPastMatchups.add(`${matchUp[1].id}-${matchUp[0].id}`);
    setPastMatchups(newPastMatchups);

    const activeCount = Object.values(newStats).filter(c => !c.isExcluded && (!onlyWatched || c.isWatched)).length;
    const targetVotes = activeCount * 2;
    if (activeCount >= 2 && totalVotes >= targetVotes) {
      setShowRanking(true);
    }

    generateMatchUp(newStats, onlyWatched, newPastMatchups);
  };

  const handleOnlyWatchedToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    
    if (isChecked) {
      const watchedCount = Object.values(stats).filter(c => c.isWatched).length;
      if (watchedCount < 2) {
        alert(`作品一覧で「視聴済」にチェックされたキャラクターが足りません（現在: ${watchedCount}人）。\n絞り込みソートを行うには、少なくとも2人以上のキャラクターが視聴済みである必要があります。\n作品一覧画面から作品の視聴ステータスを更新してください。`);
        e.preventDefault(); 
        return;
      }
    }

    if (totalVotes > 0) {
      if (!window.confirm('条件を変更すると、これまでのソート状況がリセットされ初めからになります。\nよろしいですか？')) {
        e.preventDefault();
        return;
      }
    }

    setOnlyWatched(isChecked);
    resetAndStartSort(isChecked); 
  };

  const handleReset = () => {
    if (totalVotes > 0) {
      if (window.confirm('本当にソートをはじめからやり直しますか？\nこれまでのソートデータはすべて消去されます。')) {
        resetAndStartSort(onlyWatched);
      }
    } else {
      resetAndStartSort(onlyWatched);
    }
  };

  const ranking = Object.values(stats)
    .filter(char => !char.isExcluded && char.matches > 0 && (!onlyWatched || char.isWatched))
    .sort((a, b) => b.rating - a.rating);

  const activeCount = Object.values(stats).filter(c => {
    if (c.isExcluded) return false;
    if (onlyWatched && !c.isWatched) return false;
    return true;
  }).length;
  
  const targetVotes = activeCount * 2;
  const remainingVotes = Math.max(0, targetVotes - totalVotes);

  return {
    matchUp, showRanking, setShowRanking,
    totalVotes, sortTheme, setSortTheme,
    onlyWatched, handleOnlyWatchedToggle,
    handleVote, handleSkip, handleReset,
    ranking, activeCount, remainingVotes
  };
}