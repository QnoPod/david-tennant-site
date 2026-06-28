import { CharacterStat } from '../types';

const SITE_URL = "https://david-tennant-site.vercel.app/character-sort";

export const generateShareText = (ranking: CharacterStat[], sortTheme: string, totalVotes: number) => {
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

export const shareToTwitter = (ranking: CharacterStat[], sortTheme: string, totalVotes: number) => {
  const text = generateShareText(ranking, sortTheme, totalVotes);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SITE_URL)}`;
  window.open(twitterUrl, '_blank');
};

export const copyToClipboard = (ranking: CharacterStat[], sortTheme: string, totalVotes: number) => {
  const text = generateShareText(ranking, sortTheme, totalVotes) + SITE_URL;
  return navigator.clipboard.writeText(text);
};

export const shareOrDownloadImage = async (ranking: CharacterStat[], sortTheme: string, totalVotes: number) => {
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
          text: generateShareText(ranking, sortTheme, totalVotes),
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