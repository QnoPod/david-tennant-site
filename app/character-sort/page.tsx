'use client';
import React from 'react';
import Link from 'next/link';
import SortArena from './components/SortArena';
import SortRanking from './components/SortRanking';
import { useCharacterSort } from './hooks/useCharacterSort';
import styles from '../characters/CharacterList.module.css';

export default function CharacterSortPage() {
  const {
    matchUp, showRanking, setShowRanking,
    totalVotes, sortTheme, setSortTheme,
    onlyWatched, handleOnlyWatchedToggle,
    handleVote, handleSkip, handleReset,
    ranking, activeCount, remainingVotes
  } = useCharacterSort();

  if (!matchUp && !showRanking) return <div style={{ color: '#eaeaea', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <main className={styles.container}>
      {/* 🌟 元のスタイル定義をそのまま維持 */}
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
        
        {/* ヘッダーエリア */}
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

        {/* 状態に応じたコンポーネントの出し分け */}
        {matchUp && !showRanking ? (
          <SortArena 
            matchUp={matchUp}
            sortTheme={sortTheme} setSortTheme={setSortTheme}
            onlyWatched={onlyWatched} handleOnlyWatchedToggle={handleOnlyWatchedToggle}
            totalVotes={totalVotes} remainingVotes={remainingVotes}
            handleVote={handleVote} handleSkip={handleSkip}
            setShowRanking={setShowRanking}
          />
        ) : (
          <SortRanking 
            ranking={ranking}
            sortTheme={sortTheme}
            totalVotes={totalVotes}
            activeCount={activeCount}
            setShowRanking={setShowRanking}
            handleReset={handleReset}
          />
        )}

      </div>
    </main>
  );
}