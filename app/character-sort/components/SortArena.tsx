'use client';
import React from 'react';
import { CharacterStat } from '../hooks/useCharacterSort';
import styles from '../../characters/CharacterList.module.css';

type Props = {
  matchUp: [CharacterStat, CharacterStat] | null;
  sortTheme: string;
  setSortTheme: (val: string) => void;
  onlyWatched: boolean;
  handleOnlyWatchedToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  totalVotes: number;
  remainingVotes: number;
  handleVote: (winnerId: string, loserId: string) => void;
  handleSkip: (type: 'A' | 'B' | 'Both') => void;
  setShowRanking: (val: boolean) => void;
};

export default function SortArena({
  matchUp, sortTheme, setSortTheme, onlyWatched, handleOnlyWatchedToggle,
  totalVotes, remainingVotes, handleVote, handleSkip, setShowRanking
}: Props) {
  if (!matchUp) return null;

  return (
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
  );
}