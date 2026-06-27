'use client';
import React from 'react';
import BaseModal from './BaseModal'; 
import { siteUpdates } from '../../data/updates'; 

type AboutModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="600px">
      <div style={{ padding: '30px' }}>
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
    </BaseModal>
  );
}