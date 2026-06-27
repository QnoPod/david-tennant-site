'use client';
import React from 'react';

type BaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string; // モーダルの幅を可変にするため
};

export default function BaseModal({ isOpen, onClose, children, maxWidth = '600px' }: BaseModalProps) {
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
          backgroundColor: '#16161a', borderRadius: '12px', 
          maxWidth: maxWidth, width: '100%', position: 'relative', 
          border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', 
          maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column'
        }}
      >
        {/* 🌟 共通化された洗練された閉じるボタン（WorkModalのデザインを全モーダルに適用） */}
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', top: '15px', right: '15px', 
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#fff', 
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '36px', height: '36px', 
            fontSize: '18px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' 
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.9)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)'}
        >
          ✕
        </button>
        
        {/* 各モーダルの独自コンテンツがここに入ります */}
        {children}
        
      </div>
    </div>
  );
}