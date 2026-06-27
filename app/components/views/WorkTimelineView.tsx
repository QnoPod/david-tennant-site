'use client';

import React from 'react';
import styles from '../../WorkList.module.css'; // 🌟 ../ から ../../ に修正

type WorkTimelineViewProps = {
  sortedWorks: any[];
  onWorkClick: (work: any) => void;
};

export default function WorkTimelineView({ sortedWorks, onWorkClick }: WorkTimelineViewProps) {
  return (
    <div className={styles.timelineContainer}>
      {sortedWorks.map((work: any, index: number) => {
        const year = work.first_air_date 
          ? work.first_air_date.substring(0, 4) 
          : work.release_date 
            ? work.release_date.substring(0, 4) 
            : '年不明';

        return (
          <div key={`${work.id}-${index}`} className={styles.timelineItem}>
            <div className={styles.timelineDot}></div>
            <div className={styles.timelineContent} onClick={() => onWorkClick(work)}>
              {work.poster_path ? (
                <img 
                  src={`https://image.tmdb.org/t/p/w200${work.poster_path}`} 
                  alt={work.title || work.name} 
                  style={{ width: '70px', height: '105px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} 
                />
              ) : (
                <div style={{ width: '70px', height: '105px', backgroundColor: '#0a0a0c', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px', opacity: 0.5 }}>
                  🎬
                </div>
              )}
              <div>
                <div className={styles.timelineDate}>{year}</div>
                <h3 className={styles.timelineTitle}>{work.title || work.name}</h3>
                <p className={styles.timelineMeta}>
                  {work.media_type === 'movie' ? '🎬 映画' : '📺 TV番組'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}