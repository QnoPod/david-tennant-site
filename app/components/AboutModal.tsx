'use client';

import React from 'react';
import { siteUpdates } from '../data/updates';

type AboutModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose} 
      style={{ 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' 
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          backgroundColor: '#16161a', padding: '30px', borderRadius: '12px', 
          maxWidth: '600px', width: '100%', position: 'relative', 
          border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', 
          maxHeight: '80vh', overflowY: 'auto' 
        }}
      >
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', top: '15px', right: '15px', background: 'none', 
            border: 'none', color: '#666', fontSize: '20px', cursor: 'pointer', transition: 'color 0.2s' 
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#666'}
        >
          ✕
        </button>
        
        <h2 style={{ color: '#d4af37', marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '12px', fontWeight: '500', fontSize: '20px' }}>
          ℹ️ サイトについて
        </h2>
        <p style={{ color: '#d0d0d0', fontSize: '13px', lineHeight: '1.8', marginBottom: '30px', letterSpacing: '0.03em' }}>
          当サイトは、デヴィッド・テナントの出演作品およびキャラクターの情報をまとめた非公式のファンデータベースです。<br />
          配信状況の確認や、各キャラクターの詳細設定を振り返るのにお役立てください。
        </p>
        
        <h2 style={{ color: '#d4af37', margin: '0 0 16px 0', borderBottom: '1px solid #333', paddingBottom: '12px', fontWeight: '500', fontSize: '18px' }}>
          🕒 更新履歴
        </h2>
        <ul style={{ color: '#d0d0d0', fontSize: '13px', lineHeight: '2', paddingLeft: '20px', margin: 0 }}>
          {siteUpdates.map((update: any, index: number) => (
            <li key={index} style={{ color: update.isImportant ? '#d4af37' : '#d0d0d0', fontWeight: update.isImportant ? 'bold' : 'normal' }}>
              <strong>{update.date}</strong> - {update.content}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}