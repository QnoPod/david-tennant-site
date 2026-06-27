'use client';
import React from 'react';
import Link from 'next/link';

type PageHeaderProps = {
  title: string;
  subtitle: string;
  backLink?: { href: string; label: string; icon: string };
};

export default function PageHeader({ title, subtitle, backLink }: PageHeaderProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
      <div>
        <h1 style={{ fontSize: '28px', margin: '0 0 4px 0', fontWeight: 500, color: '#ffffff', letterSpacing: '0.02em' }}>
          {title}
        </h1>
        <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 500, color: '#eaeaea', letterSpacing: '0.05em' }}>
          {subtitle}
        </h2>
      </div>
      
      {backLink && (
        <Link 
          href={backLink.href} 
          style={{ 
            color: '#d0d0d0', border: '1px solid #333', padding: '10px 16px', fontSize: '13px', 
            background: 'transparent', borderRadius: '6px', fontWeight: 500, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#222228'; e.currentTarget.style.borderColor = '#444'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#333'; }}
        >
          <span>{backLink.icon}</span> {backLink.label}
        </Link>
      )}
    </div>
  );
}