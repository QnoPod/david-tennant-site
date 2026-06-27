'use client';
import { useState, useEffect } from 'react';

export default function ScrollButtons() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (top: boolean) => {
    window.scrollTo({
      top: top ? 0 : document.body.scrollHeight,
      behavior: 'smooth'
    });
  };

  // 統一するボタンのスタイル
  const buttonStyle: React.CSSProperties = {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#4dabf7', // 統一色
    color: '#fff',
    cursor: 'pointer',
    fontSize: '20px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 1000
    }}>
      {/* 1. 上へ行くボタン */}
      {showTop && (
        <button onClick={() => scrollTo(true)} style={buttonStyle}>
          ▲
        </button>
      )}

      {/* 2. 下へ行くボタン */}
      <button onClick={() => scrollTo(false)} style={buttonStyle}>
        ▼
      </button>
    </div>
  );
}