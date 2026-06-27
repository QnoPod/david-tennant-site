'use client';
import React from 'react';

type Props = {
  character: any | null;
  onClose: () => void;
  getCustomWorkTitle: (char: any) => string;
};

export default function CharacterDetailModal({ character, onClose, getCustomWorkTitle }: Props) {
  if (!character) return null;

  return (
    <div 
      onClick={onClose} 
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{ backgroundColor: '#16161a', padding: '30px', borderRadius: '12px', maxWidth: '600px', width: '100%', position: 'relative', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#666', fontSize: '20px', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#666'}>✕</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#0a0a0c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 10px 20px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {character.charImage ? (
              <img src={character.charImage} alt={character.charName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '30px', opacity: 0.5 }}>🎭</span>
            )}
          </div>
          <div>
            <h2 style={{ color: '#d4af37', margin: '0 0 6px 0', fontSize: '22px', fontWeight: '600', letterSpacing: '0.02em' }}>
              {(character.charName.includes('Scrooge McDuck') || character.charName.includes('スクルージ')) ? 'スクルージ・マクダック' : character.charName}
            </h2>
            <p style={{ fontSize: '13px', color: '#888', margin: 0, letterSpacing: '0.05em' }}>
              作品：{getCustomWorkTitle(character)}
            </p>
          </div>
        </div>

        {character.fullDescription && (
          <div style={{ backgroundColor: '#0a0a0c', padding: '20px', borderRadius: '8px', maxHeight: '40vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.02)' }}>
            <p style={{ fontSize: '13px', lineHeight: '1.9', color: '#d0d0d0', whiteSpace: 'pre-wrap', margin: 0, letterSpacing: '0.02em' }}>
              {character.fullDescription}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}