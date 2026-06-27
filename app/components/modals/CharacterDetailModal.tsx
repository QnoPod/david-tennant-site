'use client';
import React from 'react';
import BaseModal from './BaseModal'; // 🌟 同じフォルダ内なので ./ だけでOKです

type Props = {
  character: any | null;
  onClose: () => void;
  getCustomWorkTitle: (char: any) => string;
};

export default function CharacterDetailModal({ character, onClose, getCustomWorkTitle }: Props) {
  return (
    <BaseModal isOpen={!!character} onClose={onClose} maxWidth="600px">
      {character && (
        <div style={{ padding: '30px' }}>
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
      )}
    </BaseModal>
  );
}