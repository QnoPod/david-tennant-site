'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { customCharacterInfo } from '../data/details';
import { customCharacterImages } from '../data/characters';
import styles from '../characters/CharacterList.module.css'; // 既存のCSSを流用

type CharacterStat = {
  id: string;
  charName: string;
  charImage: string;
  workTitle: string;
  rating: number;
  matches: number;
  wins: number; // 🌟 勝利（選ばれた）回数を追加
  unknowns: number;
  isExcluded: boolean;
  isWatched: boolean;
};

const INITIAL_RATING = 1500;
const K_FACTOR = 32;
const SITE_URL = "https://david-tennant-site.vercel.app/character-sort";

export default function CharacterSortPage() {
  const [stats, setStats] = useState<Record<string, CharacterStat>>({});
  const [matchUp, setMatchUp] = useState<[CharacterStat, CharacterStat] | null>(null);
  const [showRanking, setShowRanking] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [copied, setCopied] = useState(false);
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

    ctx.fillStyle = '#d4af37';
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
      ctx.fillStyle = '#0a0a0c';
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

      ctx.fillStyle = '#eaeaea';
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

  if (!matchUp && !showRanking) return <div style={{ color: '#eaeaea', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <main className={styles.container}>
      <style>{`
        .matchup-container {
          display: flex;
          justify-content: center;
          align-items: stretch;
          gap: 30px;
          margin-bottom: 40px;
          flex-wrap: nowrap;
        }
        .char-card {
          background-color: #16161a;
          border-radius: 12px;
          padding: 24px 16px;
          text-align: center;
          flex: 1;
          max-width: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 8px 20px rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.03);
        }
        /* 🌟 画像の大きさをPC/スマホ共に少し拡大 */
        .char-image-wrap {
          width: 140px; /* 120px -> 140px */
          height: 140px; /* 120px -> 140px */
          border-radius: 50%;
          overflow: hidden;
          margin: 0 auto 16px auto;
          background-color: #0a0a0c;
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 10px 20px rgba(0,0,0,0.6);
        }
        .char-image-wrap img { width: 100%; height: 100%; object-fit: cover; }
        
        .char-name { color: #d4af37; margin: 0 0 6px 0; font-size: 18px; font-weight: 600; }
        .char-work { color: #888; font-size: 12px; margin-bottom: 20px; line-height: 1.4; }
        .vs-text { display: flex; align-items: center; font-size: 20px; font-weight: bold; color: #666; padding: 0 10px; }
        
        .vote-btn-primary { 
          width: 100%; 
          margin-bottom: 10px; 
          font-size: 14px !important; 
          padding: 16px 16px !important; 
        }
        .vote-btn-skip { width: 100%; border: none; background: transparent; font-size: 12px !important; padding: 10px !important; }

        @media (max-width: 600px) {
          .matchup-container { gap: 10px; margin-bottom: 20px; }
          .char-card { padding: 15px 8px; border-radius: 8px; justify-content: space-between; }
          .char-image-wrap { 
            width: 80px; /* 60px -> 80px */
            height: 80px; /* 60px -> 80px */
            margin: 0 auto 10px auto; 
          }
          .char-name { font-size: 11px; margin-bottom: 4px; line-height: 1.3; } 
          .char-work { font-size: 9px; margin-bottom: 10px; line-height: 1.2; } 
          .vs-text { font-size: 14px; padding: 0; }
          
          .vote-btn-primary { 
            font-size: 12px !important; 
            padding: 14px 6px !important; 
            margin-bottom: 8px !important; 
          }
          .vote-btn-skip { font-size: 10px !important; padding: 4px !important; }
        }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '24px' }}>
          
          <div className={styles.titleContainer} style={{ marginBottom: 0 }}>
            <h1 className={styles.mainTitle} style={{ color: '#ffffff', fontSize: '28px' }}>David Tennant</h1>
            <h2 className={styles.subTitle} style={{ color: '#eaeaea', fontSize: '16px' }}>Sort</h2>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              onClick={handleReset}
              className={styles.actionBtn}
              style={{ borderColor: '#dc3545', color: '#dc3545', background: 'transparent', fontSize: '13px', padding: '8px 12px' }}
            >
              🔄 はじめから
            </button>
            <Link href="/characters" className={styles.actionBtn} style={{ background: 'transparent', fontSize: '13px', padding: '8px 12px' }}>
              👥 キャラ一覧
            </Link>
            <Link href="/" className={styles.actionBtn} style={{ background: 'transparent', fontSize: '13px', padding: '8px 12px' }}>
              🎬 作品一覧
            </Link>
          </div>
        </div>

        {matchUp && !showRanking ? (
          <>
            <div style={{ textAlign: 'center', color: '#ccc', marginBottom: '24px', lineHeight: '1.6', fontSize: '14px' }}>
              
              <div style={{ marginBottom: '15px', backgroundColor: '#16161a', padding: '12px 16px', borderRadius: '8px', display: 'inline-block', border: '1px solid rgba(255,255,255,0.03)', boxShadow: '0 8px 20px rgba(0,0,0,0.4)' }}>
                <label style={{ fontSize: '13px', marginRight: '10px', fontWeight: 'bold' }}>🏆 何のランキングを作る？：</label>
                <input 
                  type="text" 
                  value={sortTheme}
                  onChange={(e) => setSortTheme(e.target.value)}
                  placeholder="例: 最強、友達になりたい"
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #2a2a2a', backgroundColor: '#0a0a0c', color: '#eaeaea', width: '200px', fontSize: '13px' }}
                />
              </div>
              <br/>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#d4af37', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}>
                  <input 
                    type="checkbox"
                    checked={onlyWatched}
                    onChange={handleOnlyWatchedToggle}
                    style={{ transform: 'scale(1.1)' }}
                  />
                  視聴済キャラクターのみでソートをする
                </label>
              </div>

              「<strong style={{ color: '#d4af37', fontSize: '16px' }}>{sortTheme || '...'}</strong>」キャラクターを選んでください！<br/>
              （現在の投票数：{totalVotes} 回）<br/>

              
              <div style={{ display: 'inline-block', marginTop: '12px', padding: '8px 16px', backgroundColor: '#16161a', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)', fontSize: '13px' }}>
                {remainingVotes > 0 ? (
                  <>精度が安定するまで <strong style={{ color: '#d4af37', fontSize: '15px' }}>あと {remainingVotes} 回</strong></>
                ) : (
                  <strong style={{ color: '#20b2aa' }}>✅ 十分なデータが集まりました！結果を見てみましょう</strong>
                )}
              </div>
            </div>

            <div className="matchup-container">
              <div className="char-card">
                <div style={{ width: '100%' }}>
                  <div className="char-image-wrap">
                    <img src={matchUp[0].charImage} alt={matchUp[0].charName} />
                  </div>
                  <h2 className="char-name">{matchUp[0].charName}</h2>
                  <p className="char-work">作品：{matchUp[0].workTitle}</p>
                </div>
                <div style={{ width: '100%' }}>
                  <button className={`${styles.actionBtnPrimary} vote-btn-primary`} onClick={() => handleVote(matchUp[0].id, matchUp[1].id)}>👈 こっち！</button>
                  <button className={`${styles.actionBtn} vote-btn-skip`} onClick={() => handleSkip('A')}>知らない（除外）</button>
                </div>
              </div>
              
              <div className="vs-text">VS</div>
              
              <div className="char-card">
                <div style={{ width: '100%' }}>
                  <div className="char-image-wrap">
                    <img src={matchUp[1].charImage} alt={matchUp[1].charName} />
                  </div>
                  <h2 className="char-name">{matchUp[1].charName}</h2>
                  <p className="char-work">作品：{matchUp[1].workTitle}</p>
                </div>
                <div style={{ width: '100%' }}>
                  <button className={`${styles.actionBtnPrimary} vote-btn-primary`} onClick={() => handleVote(matchUp[1].id, matchUp[0].id)}>こっち！ 👉</button>
                  <button className={`${styles.actionBtn} vote-btn-skip`} onClick={() => handleSkip('B')}>知らない（除外）</button>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button onClick={() => handleSkip('Both')} className={styles.actionBtn} style={{ borderRadius: '30px', padding: '10px 24px', fontSize: '13px' }}>
                両方とも知らない（両方除外）
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '24px', borderTop: '1px solid #333', paddingTop: '24px' }}>
              <button 
                onClick={() => setShowRanking(true)}
                className={styles.actionBtn}
                style={{ color: '#d4af37', borderColor: '#d4af37', background: 'transparent', fontSize: '14px', padding: '10px 24px' }}
              >
                🏆 現在のランキング・シェア画面へ
              </button>
            </div>
          </>
        ) : (
          <div style={{ backgroundColor: '#16161a', borderRadius: '16px', padding: '24px', marginTop: '20px', border: '1px solid rgba(255,255,255,0.03)', boxShadow: '0 8px 20px rgba(0,0,0,0.4)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '24px', fontSize: '20px', color: '#eaeaea' }}>
              現在の【<span style={{ color: '#d4af37' }}>{sortTheme || 'キャラクター'}</span>】ランキング
            </h2>
            
            {ranking.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', marginBottom: '24px', lineHeight: '1.6', fontSize: '14px' }}>
                投票データがありません。<br/>（まだ投票していないか、ソート対象のキャラクターが2人以上いません）
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '30px' }}>
                  <button className={styles.actionBtn} style={{ background: '#d4af37', color: '#0a0a0c', borderColor: '#d4af37', fontSize: '12px', padding: '8px 12px' }} onClick={shareOrDownloadImage}>
                    📸 結果を画像にしてシェア／保存
                  </button>
                  <button className={styles.actionBtn} style={{ background: '#1DA1F2', color: '#fff', borderColor: '#1DA1F2', fontSize: '12px', padding: '8px 12px' }} onClick={shareToTwitter}>
                    🐦 X(Twitter)にテキスト投稿
                  </button>
                  <button className={styles.actionBtn} style={{ fontSize: '12px', padding: '8px 12px' }} onClick={copyToClipboard}>
                    📋 {copied ? 'コピーしました！' : 'テキストをコピー'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {ranking.slice(0, 50).map((char, index) => (
                    <div key={char.id} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0a0a0c', padding: '12px', borderRadius: '10px', gap: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#888', width: '36px', textAlign: 'center' }}>
                        {index + 1}
                      </div>
                      {/* 🌟 ランキングの画像も少し拡大（60px -> 70px） */}
                      <img src={char.charImage} alt={char.charName} style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.05)' }} />
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#eaeaea' }}>{char.charName}</div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>作品：{char.workTitle}</div>
                      </div>
                      
                      <div style={{ textAlign: 'right', fontSize: '12px', color: '#888' }}>
                        <div style={{ marginBottom: '4px' }}>対戦: {char.matches}回</div>
                        <div style={{ color: '#d4af37', fontWeight: 'bold' }}>選択: {char.wins}回</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '30px', flexWrap: 'wrap' }}>
              {activeCount >= 2 && (
                <button 
                  onClick={() => setShowRanking(false)}
                  className={styles.actionBtnPrimary}
                  style={{ padding: '12px 40px', fontSize: '14px' }}
                >
                  投票に戻る
                </button>
              )}
              
              <button 
                onClick={handleReset}
                className={styles.actionBtn}
                style={{ color: '#dc3545', borderColor: '#dc3545', background: 'transparent', padding: '12px 30px', fontSize: '14px' }}
              >
                最初からやり直す
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}