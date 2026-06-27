'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeader from '../components/PageHeader';
import ScrollButtons from '../components/ScrollButtons';
import CharacterDetailModal from '../components/CharacterDetailModal';
import CharacterGridView from '../components/CharacterGridView';
import CharacterTimelineView from '../components/CharacterTimelineView';
import { useCharacters } from '../hooks/useCharacters';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { customCharacterInfo } from '../data/details';
import styles from './CharacterList.module.css';

export default function CharacterList({ tmdbWorks }: { tmdbWorks: any[] }) {
  const [selectedCharacter, setSelectedCharacter] = useState<any | null>(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // 🌟 ローカルストレージのお気に入りもフックで1行に！
  const [favoriteChars, setFavoriteChars] = useLocalStorage<string[]>('favoriteCharacters', []);

  const {
    viewMode, handleToggleView,
    showAttributes, setShowAttributes,
    watchStatusFilter, setWatchStatusFilter, 
    characters, groupedCharacters, groupKeys
  } = useCharacters(tmdbWorks);

  const getCharKey = (char: any) => `${char.charName}-${char.workTitle}`;

  const toggleFavorite = (char: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = getCharKey(char);
    setFavoriteChars(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleAttributeClick = (attr: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setSelectedCharacter(null); 
    
    if (!showAttributes) {
      setShowAttributes(true);
      setTimeout(() => scrollToGroup(attr), 100);
    } else {
      scrollToGroup(attr);
    }
  };

  const scrollToGroup = (attr: string) => {
    const el = document.getElementById(`attr-group-${attr}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const getCustomWorkTitle = (char: any) => {
    if (!char) return '';
    const charName = char.charName || '';
    const workTitle = char.workTitle || '';

    if (charName.includes('10代目ドクター')) return 'Doctor Whoシリーズ';
    if (workTitle === 'Scrooge McDuck' || charName.includes('Scrooge McDuck') || charName.includes('スクルージ')) return 'ディズニー';
    if (['ドナルド・ピーターソン', 'ロデリック・ピーターソン'].includes(charName)) return 'Nativity 2: Danger in the Manger!';
    
    return char.displayWorkTitle;
  };

  const displayCharacters = showOnlyFavorites 
    ? characters.filter(c => favoriteChars.includes(getCharKey(c)))
    : characters;

  const displayGroupedCharacters = Object.keys(groupedCharacters).reduce((acc, key) => {
    acc[key] = showOnlyFavorites
      ? groupedCharacters[key].filter(c => favoriteChars.includes(getCharKey(c)))
      : groupedCharacters[key];
    return acc;
  }, {} as Record<string, any[]>);

  const sortedGroupKeys = [...groupKeys].sort((a, b) => {
    const isOtherA = a === 'その他' || a === 'その他職業';
    const isOtherB = b === 'その他' || b === 'その他職業';

    if (isOtherA && !isOtherB) return 1;
    if (!isOtherA && isOtherB) return -1;
    if (isOtherA && isOtherB) return a === 'その他職業' && b === 'その他' ? -1 : (a === 'その他' && b === 'その他職業' ? 1 : 0);

    const countDiff = displayGroupedCharacters[b].length - displayGroupedCharacters[a].length;
    if (countDiff !== 0) return countDiff;
    return a.localeCompare(b, 'ja');
  });

  const viewProps = {
    favoriteChars,
    onToggleFavorite: toggleFavorite,
    onCharacterClick: setSelectedCharacter,
    showAttributes,
    onAttributeClick: handleAttributeClick,
    getCharKey,
    getCustomWorkTitle
  };

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        
        {/* 🌟 共通化されたヘッダーコンポーネント。戻るボタンもPropsで渡すだけ！ */}
        <PageHeader 
          title="David Tennant" 
          subtitle="Characters" 
          backLink={{ href: '/', label: '作品一覧', icon: '🎬' }} 
        />
        
        <div className={styles.topNav}>
          <Link href="/character-sort" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
            <span style={{ color: '#111', fontSize: '14px' }}>🏆</span> 投票で遊ぶ
          </Link>
          <button className={`${styles.actionBtn} ${showOnlyFavorites ? styles.actionBtnActive : ''}`} onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}>
            <span style={{ color: '#ff9f43', fontSize: '14px' }}>★</span> {showOnlyFavorites ? 'お気に入りのみ表示' : 'お気に入りだけ表示'}
          </button>
          <button className={styles.actionBtn} onClick={handleToggleView}>
            <span style={{ color: '#7aa5d2', fontSize: '14px' }}>📅</span> {viewMode === 'grid' ? 'タイムライン表示' : 'グリッド表示'}
          </button>
          <button className={`${styles.actionBtn} ${showAttributes ? styles.actionBtnActive : ''}`} onClick={() => setShowAttributes(!showAttributes)}>
            <span style={{ color: '#7aa5d2', fontSize: '14px' }}>🏷️</span> {showAttributes ? '属性をオフ' : '属性でカテゴライズ'}
          </button>
          <select value={watchStatusFilter} onChange={(e) => setWatchStatusFilter(e.target.value)} className={styles.fcSelect}>
            <option value="ALL">すべて視聴状況</option>
            <option value="WATCHED">視聴済</option>
            <option value="UNWATCHED">未視聴</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>カードをクリックすると詳細が表示されます</p>
          <p style={{ color: '#d4af37', fontWeight: '500', margin: 0, fontSize: '14px' }}>
            {displayCharacters.length} / {Object.keys(customCharacterInfo).length} 人
          </p>
        </div>

        {showAttributes ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
            {sortedGroupKeys.map(attr => displayGroupedCharacters[attr].length > 0 && (
              <div key={attr} id={`attr-group-${attr}`} style={{ border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '12px', padding: '30px 15px 15px', position: 'relative', scrollMarginTop: '40px' }}>
                <span style={{ position: 'absolute', top: '-12px', left: '16px', backgroundColor: '#0a0a0c', color: '#d4af37', padding: '0 12px', fontWeight: '500', fontSize: '14px', letterSpacing: '0.05em' }}>
                  {attr} <span style={{ color: '#555', fontSize: '12px' }}>({displayGroupedCharacters[attr].length})</span>
                </span>
                {viewMode === 'grid' 
                  ? <CharacterGridView characters={displayGroupedCharacters[attr]} {...viewProps} /> 
                  : <CharacterTimelineView characters={displayGroupedCharacters[attr]} {...viewProps} />}
              </div>
            ))}
            {displayCharacters.length === 0 && <p style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>該当するキャラクターがいません。</p>}
          </div>
        ) : (
          displayCharacters.length > 0 
            ? (viewMode === 'grid' ? <CharacterGridView characters={displayCharacters} {...viewProps} /> : <CharacterTimelineView characters={displayCharacters} {...viewProps} />)
            : <p style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>該当するキャラクターがいません。</p>
        )}
      </div>

      <CharacterDetailModal 
        character={selectedCharacter} 
        onClose={() => setSelectedCharacter(null)} 
        getCustomWorkTitle={getCustomWorkTitle} 
      />
      <ScrollButtons />
    </main>
  );
}