import React, { useState } from 'react';
import { CharacterStat } from '../types';
import { shareOrDownloadImage, shareToTwitter, copyToClipboard } from '../utils/shareUtils';
import styles from '../../characters/CharacterList.module.css';

type Props = {
  ranking: CharacterStat[];
  sortTheme: string;
  totalVotes: number;
  activeCount: number;
  setShowRanking: (val: boolean) => void;
  handleReset: () => void;
};

export default function RankingBoard({ ranking, sortTheme, totalVotes, activeCount, setShowRanking, handleReset }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    copyToClipboard(ranking, sortTheme, totalVotes).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
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
            <button className={styles.actionBtn} style={{ background: '#d4af37', color: '#0a0a0c', borderColor: '#d4af37', fontSize: '12px', padding: '8px 12px' }} onClick={() => shareOrDownloadImage(ranking, sortTheme, totalVotes)}>
              📸 結果を画像にしてシェア／保存
            </button>
            <button className={styles.actionBtn} style={{ background: '#1DA1F2', color: '#fff', borderColor: '#1DA1F2', fontSize: '12px', padding: '8px 12px' }} onClick={() => shareToTwitter(ranking, sortTheme, totalVotes)}>
              🐦 X(Twitter)にテキスト投稿
            </button>
            <button className={styles.actionBtn} style={{ fontSize: '12px', padding: '8px 12px' }} onClick={onCopy}>
              📋 {copied ? 'コピーしました！' : 'テキストをコピー'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ranking.slice(0, 50).map((char, index) => (
              <div key={char.id} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0a0a0c', padding: '12px', borderRadius: '10px', gap: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#888', width: '36px', textAlign: 'center' }}>
                  {index + 1}
                </div>
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
  );
}