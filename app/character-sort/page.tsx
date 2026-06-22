'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { customCharacterInfo } from '../data/details';
import { customCharacterImages } from '../data/characters';

// キャラクターのステータス管理用型
type CharacterStat = {
  id: string;
  charName: string;
  charImage: string;
  workTitle: string;
  rating: number; // レート（強さ・人気度）
  matches: number; // 対戦回数
  unknowns: number; // 「知らない」と言われた回数
  isExcluded: boolean; // 「知らない」で除外されたかどうかのフラグ
  isWatched: boolean; // 視聴済かどうかのフラグ
};

const INITIAL_RATING = 1500; // 初期レート
const K_FACTOR = 32; // 1回の勝敗でのレート変動幅
const SITE_URL = "https://david-tennant-site.vercel.app/character-sort";

export default function CharacterSortPage() {
  const [stats, setStats] = useState<Record<string, CharacterStat>>({});
  const [matchUp, setMatchUp] = useState<[CharacterStat, CharacterStat] | null>(null);
  const [showRanking, setShowRanking] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [copied, setCopied] = useState(false);
  
  // 🌟 追加：同じ組み合わせが何度も選出されないように過去の対戦履歴を記録するSet
  const [pastMatchups, setPastMatchups] = useState<Set<string>>(new Set());
  
  const [sortTheme, setSortTheme] = useState('好き');
  const [onlyWatched, setOnlyWatched] = useState(false);

  // 🌟 引数に currentPastMatchups を追加し、履歴を考慮したマッチングを行うように修正
  const generateMatchUp = (currentStats: Record<string, CharacterStat>, filterWatched: boolean, currentPastMatchups: Set<string>) => {
    const charList = Object.values(currentStats).filter(c => {
      if (c.isExcluded) return false;
      if (filterWatched && !c.isWatched) return false;
      return true;
    });
    
    if (charList.length < 2) {
      setShowRanking(true);
      return;
    }

    // まず配列全体をランダムにシャッフルする（Fisher-Yatesシャッフル等価）
    const shuffled = [...charList].sort(() => Math.random() - 0.5);
    // その後、試合数で昇順ソート（試合数が同数のキャラ同士はランダムな順序に保たれる）
    const sorted = shuffled.sort((a, b) => a.matches - b.matches);

    // 一番試合数が少ないキャラをAに選出
    const charA = sorted[0];
    const remaining = sorted.slice(1);

    // 🌟 修正：charAと「まだ対戦していない」キャラを優先的に絞り込む
    let candidates = remaining.filter(c => !currentPastMatchups.has(`${charA.id}-${c.id}`));

    // もし全員と対戦済（または絞り込みで0人になった）場合は、残りの候補全体から選ぶようにフォールバック
    if (candidates.length === 0) {
      candidates = remaining;
    }

    // 候補の中から、なるべく試合数が少ない上位(最大10人)の中からランダムに相手（B）を選ぶ
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

      if (!isWatched && (workTitle.includes('10th Doctor') || workTitle.includes('10代目ドクター') || workTitle.includes('14代目ドクター'))) {
        isWatched = isWorkWatched('Doctor Who');
      }
      if (!isWatched && (workTitle.includes('Scrooge McDuck') || workTitle.includes('スクルージ'))) {
        isWatched = isWorkWatched('DuckTales');
      }
      if (!isWatched && ['ドナルド・ピーターソン', 'ロデリック・ピーターソン'].includes(charName)) {
        isWatched = isWorkWatched('Nativity 2: Danger in the Manger!');
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
      } else if (charName === '10代目ドクター') {
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
        unknowns: 0,
        isExcluded: false,
        isWatched: charWatchedMap[displayCharName] || false,
      };
    });

    setStats(initialStats);
    setTotalVotes(0);          
    setShowRanking(false);
    
    // 履歴もリセットする
    const resetMatchups = new Set<string>();
    setPastMatchups(resetMatchups);
    
    generateMatchUp(initialStats, filterWatched, resetMatchups);
  };

  useEffect(() => {
    resetAndStartSort(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      matches: winner.matches + 1
    };
    newStats[loserId] = {
      ...loser,
      rating: loser.rating + K_FACTOR * (0 - expectedLoser),
      matches: loser.matches + 1
    };

    setStats(newStats);

    // 🌟 履歴の保存（双方向のIDペアを記録して重複選出を防ぐ）
    const newPastMatchups = new Set(pastMatchups);
    newPastMatchups.add(`${matchUp[0].id}-${matchUp[1].id}`);
    newPastMatchups.add(`${matchUp[1].id}-${matchUp[0].id}`);
    setPastMatchups(newPastMatchups);
    
    setTotalVotes(prev => {
      const newTotal = prev + 1;
      const activeCount = Object.values(newStats).filter(c => !c.isExcluded && (!onlyWatched || c.isWatched)).length;
      const targetVotes = activeCount * 2;
      
      // 目安となる目標投票数に達した「その瞬間」だけ自動遷移させる
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

    // スキップ時も履歴に残す（無駄な再選出を防ぐため）
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

  // 🌟 追加：はじめからやり直すボタン用のハンドラー（ワンクッション）
  const handleReset = () => {
    if (totalVotes > 0) {
      if (window.confirm('本当にソートをはじめからやり直しますか？\nこれまでのソートデータはすべて消去されます。')) {
        resetAndStartSort(onlyWatched);
      }
    } else {
      // 投票前なら警告なしでリフレッシュ
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

  const generateShareText = () => {
    if (ranking.length === 0) return "";
    
    const top3 = ranking.slice(0, 3);
    const themeDisplay = sortTheme.trim() ? `【${sortTheme.trim()}】` : 'キャラクター';
    let text = `私の ${themeDisplay}DTキャラランキング！🏆\n\n`;
    
    const medals = ['🥇', '🥈', '🥉'];
    top3.forEach((char, index) => {
      text += `${medals[index]} ${index + 1}位: ${char.charName}\n`;
    });
    
    text += `\n(${totalVotes}回ソートしました)\nあなたも独自のテーマでソートしよう！👇\n#DTキャラソート\n`;
    return text;
  };

  const shareOrDownloadImage = async () => {
    if (ranking.length === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff9f43';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    const themeDisplay = sortTheme.trim() ? `【${sortTheme.trim()}】` : 'キャラクター';
    ctx.fillText(`私の ${themeDisplay}DTキャラランキング！`, 300, 45);

    const top3 = ranking.slice(0, 3);
    const medals = ['🥇 1位', '🥈 2位', '🥉 3位'];
    const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];

    for (let i = 0; i < top3.length; i++) {
      const char = top3[i];
      const y = 80 + i * 105;

      const img = new window.Image();
      const loadImg = new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      img.src = char.charImage;
      await loadImg;

      ctx.save();
      ctx.beginPath();
      ctx.arc(100, y + 40, 40, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#333';
      ctx.fillRect(60, y, 80, 80);
      if (img.width > 0) {
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 60, y, 80, 80);
      }
      ctx.restore();

      ctx.fillStyle = colors[i];
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(medals[i], 160, y + 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(char.charName, 160, y + 60);

      ctx.fillStyle = '#888888';
      ctx.font = '14px sans-serif';
      ctx.fillText(char.workTitle, 160, y + 80);
    }

    ctx.fillStyle = '#666666';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("David Tennant 作品データベース  |  " + SITE_URL, 300, 430);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      if (navigator.canShare && navigator.canShare({ files: [new File([blob], 'ranking.png', { type: blob.type })] })) {
        try {
          const file = new File([blob], 'ranking.png', { type: blob.type });
          await navigator.share({
            title: 'ランキング結果',
            text: generateShareText(),
            files: [file],
          });
          return;
        } catch (err) {
          console.log('Share canceled or failed', err);
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `david_tennant_ranking.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const shareToTwitter = () => {
    const text = generateShareText();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SITE_URL)}`;
    window.open(twitterUrl, '_blank');
  };

  const copyToClipboard = () => {
    const text = generateShareText() + SITE_URL;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (!matchUp && !showRanking) return <div style={{ color: '#2e2626', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <main style={{ padding: '40px 20px', fontFamily: 'sans-serif', backgroundColor: '#141414', minHeight: '100vh', color: '#fff' }}>
      
      <style>{`
        .matchup-container { display: flex; justify-content: center; align-items: stretch; gap: 30px; margin-bottom: 40px; }
        .char-card { background-color: #222; border-radius: 16px; padding: 30px 20px; text-align: center; width: 300px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
        .char-image-wrap { width: 150px; height: 150px; border-radius: 50%; overflow: hidden; margin-bottom: 20px; background-color: #333; border: 4px solid #444; }
        .char-image-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .vote-btn { background-color: #ff9f43; color: #fff; border: none; padding: 15px 20px; font-size: 18px; font-weight: bold; border-radius: 8px; cursor: pointer; width: 100%; margin-bottom: 15px; transition: background-color 0.2s, transform 0.1s; }
        .vote-btn:hover { background-color: #e67e22; }
        .vote-btn:active { transform: scale(0.96); }
        .skip-btn { background-color: #444; color: #bbb; border: none; padding: 10px; font-size: 14px; border-radius: 6px; cursor: pointer; width: 100%; transition: background-color 0.2s; }
        .skip-btn:hover { background-color: #555; color: #fff; }
        .vs-text { display: flex; align-items: center; font-size: 24px; font-weight: bold; color: #666; }
        
        .share-btn { padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; border: none; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.2s; font-size: 14px; }
        .share-btn:hover { opacity: 0.8; }
        .btn-twitter { background-color: #1DA1F2; color: #fff; }
        .btn-image { background-color: #ff9f43; color: #fff; }
        .btn-copy { background-color: #444; color: #fff; }

        .char-name { font-size: 20px; margin: 0 0 5px 0; color: #fff; }
        .char-work { font-size: 13px; color: #888; margin: 0 0 25px 0; }

        @media (max-width: 768px) {
          .matchup-container { flex-direction: row; gap: 8px; margin-bottom: 20px; }
          .char-card { width: 50%; padding: 15px 10px; }
          .char-image-wrap { width: 80px; height: 80px; margin-bottom: 10px; border-width: 2px; }
          .char-name { font-size: 14px; margin-bottom: 3px; }
          .char-work { font-size: 11px; margin-bottom: 15px; }
          .vote-btn { padding: 10px 5px; font-size: 13px; margin-bottom: 10px; }
          .skip-btn { padding: 8px 5px; font-size: 10px; }
          .vs-text { font-size: 16px; margin: 0; }
        }
      `}</style>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', margin: 0, color: '#ff9f43' }}>キャラソート</h1>
          
          {/* 🌟 右上のボタンエリアに「やり直し」と「戻る」を並べる */}
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button 
              onClick={handleReset}
              style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              🔄 はじめから
            </button>
            <Link href="/characters" style={{ color: '#aaa', textDecoration: 'none', padding: '8px 16px', backgroundColor: '#222', borderRadius: '8px', fontSize: '14px' }}>
              ← リストに戻る
            </Link>
          </div>
        </div>

        {!showRanking && matchUp ? (
          <>
            <div style={{ textAlign: 'center', color: '#ccc', marginBottom: '30px', lineHeight: '1.6' }}>
              
              <div style={{ marginBottom: '15px', backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', display: 'inline-block', border: '1px solid #333' }}>
                <label style={{ fontSize: '15px', marginRight: '10px', fontWeight: 'bold' }}>🏆 何のランキングを作る？：</label>
                <input 
                  type="text" 
                  value={sortTheme}
                  onChange={(e) => setSortTheme(e.target.value)}
                  placeholder="例: 最強、友達になりたい"
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #555', backgroundColor: '#2a2a2a', color: '#fff', width: '220px', fontSize: '15px' }}
                />
              </div>
              <br/>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#ff9f43', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox"
                    checked={onlyWatched}
                    onChange={handleOnlyWatchedToggle}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  視聴済キャラクターのみでソートをする
                </label>
              </div>

              「<strong style={{ color: '#ff9f43', fontSize: '18px' }}>{sortTheme || '...'}</strong>」キャラクターを選んでください！<br/>
              （現在の投票数：{totalVotes} 回）<br/>

              
              <div style={{ display: 'inline-block', marginTop: '15px', padding: '10px 20px', backgroundColor: '#333', borderRadius: '30px', border: '1px solid #555' }}>
                {remainingVotes > 0 ? (
                  <>精度が安定するまで <strong style={{ color: '#ff9f43', fontSize: '18px' }}>あと {remainingVotes} 回</strong></>
                ) : (
                  <strong style={{ color: '#69db7c' }}>✅ 十分なデータが集まりました！結果を見てみましょう</strong>
                )}
              </div>
            </div>

            <div className="matchup-container">
              <div className="char-card">
                <div className="char-image-wrap"><img src={matchUp[0].charImage} alt={matchUp[0].charName} /></div>
                <h2 className="char-name">{matchUp[0].charName}</h2>
                <p className="char-work">{matchUp[0].workTitle}</p>
                <button className="vote-btn" onClick={() => handleVote(matchUp[0].id, matchUp[1].id)}>👈 こっち！</button>
                <button className="skip-btn" onClick={() => handleSkip('A')}>知らない（除外）</button>
              </div>

              <div className="vs-text">VS</div>

              <div className="char-card">
                <div className="char-image-wrap"><img src={matchUp[1].charImage} alt={matchUp[1].charName} /></div>
                <h2 className="char-name">{matchUp[1].charName}</h2>
                <p className="char-work">{matchUp[1].workTitle}</p>
                <button className="vote-btn" onClick={() => handleVote(matchUp[1].id, matchUp[0].id)}>こっち！ 👉</button>
                <button className="skip-btn" onClick={() => handleSkip('B')}>知らない（除外）</button>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button onClick={() => handleSkip('Both')} style={{ backgroundColor: '#333', color: '#aaa', border: 'none', padding: '12px 30px', borderRadius: '30px', fontSize: '15px', cursor: 'pointer', marginBottom: '40px' }}>
                両方とも知らない（両方除外）
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '1px solid #333', paddingTop: '30px' }}>
              <button 
                onClick={() => setShowRanking(true)}
                style={{ backgroundColor: 'transparent', color: '#ff9f43', border: '2px solid #ff9f43', padding: '12px 30px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                🏆 現在のランキング・シェア画面へ
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ backgroundColor: '#222', borderRadius: '16px', padding: '30px', marginTop: '20px' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '24px' }}>
                現在の【{sortTheme || 'キャラクター'}】ランキング
              </h2>
              
              {ranking.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#888', marginBottom: '30px', lineHeight: '1.6' }}>
                  投票データがありません。<br/>（まだ投票していないか、ソート対象のキャラクターが2人以上いません）
                </p>
              ) : (
                <>
                  <div className="share-btn-group" style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '40px' }}>
                    <button className="share-btn btn-image" onClick={shareOrDownloadImage}>
                      📸 結果を画像にしてシェア／保存
                    </button>
                    <button className="share-btn btn-twitter" onClick={shareToTwitter}>
                      🐦 X(Twitter)にテキスト投稿
                    </button>
                    <button className="share-btn btn-copy" onClick={copyToClipboard}>
                      📋 {copied ? 'コピーしました！' : 'テキストをコピー'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {ranking.slice(0, 50).map((char, index) => (
                      <div key={char.id} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#333', padding: '15px', borderRadius: '12px', gap: '20px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#888', width: '30px', textAlign: 'center' }}>
                          {index + 1}
                        </div>
                        <img src={char.charImage} alt={char.charName} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{char.charName}</div>
                          <div style={{ fontSize: '13px', color: '#aaa' }}>{char.workTitle}</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '13px', color: '#888' }}>
                          <div>勝敗: {char.matches}戦</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* 🌟 ランキング画面からの各種導線 */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px', flexWrap: 'wrap' }}>
                {activeCount >= 2 && (
                  <button 
                    onClick={() => setShowRanking(false)}
                    style={{ backgroundColor: '#ff9f43', color: '#fff', border: 'none', padding: '12px 40px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    投票に戻る
                  </button>
                )}
                
                <button 
                  onClick={handleReset}
                  style={{ backgroundColor: 'transparent', color: '#dc3545', border: '2px solid #dc3545', padding: '12px 40px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  最初からやり直す
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}