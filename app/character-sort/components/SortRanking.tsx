'use client';
import React, { useState } from 'react';
import { CharacterStat } from '../hooks/useCharacterSort';
import styles from '../../characters/CharacterList.module.css';

const SITE_URL = "https://david-tennant-site.vercel.app/character-sort";

type Props = {
  ranking: CharacterStat[];
  sortTheme: string;
  totalVotes: number;
  activeCount: number;
  setShowRanking: (val: boolean) => void;
  handleReset: () => void;
};

export default function SortRanking({ ranking, sortTheme, totalVotes, activeCount, setShowRanking, handleReset }: Props) {
  const [copied, setCopied] = useState(false);

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
  );
}