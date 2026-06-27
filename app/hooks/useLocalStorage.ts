'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

// 🌟 LocalStorageの基本機能を拡張（パッチ）して、
// 同じ画面内での「生のデータ書き換え（全解除など）」を100%検知できるようにする魔法のコード
if (typeof window !== 'undefined') {
  const win = window as any;
  if (!win.__lsPatched) {
    const originalSetItem = window.localStorage.setItem;
    const originalRemoveItem = window.localStorage.removeItem;
    const originalClear = window.localStorage.clear;

    // データを書き込んだら絶対にお知らせする
    window.localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, [key, value]);
      window.dispatchEvent(new Event('local-storage-updated'));
    };

    // データを削除したら絶対にお知らせする
    window.localStorage.removeItem = function(key) {
      originalRemoveItem.apply(this, [key]);
      window.dispatchEvent(new Event('local-storage-updated'));
    };

    // データを全消去したら絶対にお知らせする
    window.localStorage.clear = function() {
      originalClear.apply(this);
      window.dispatchEvent(new Event('local-storage-updated'));
    };

    win.__lsPatched = true; // 2回以上実行されないようにする
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const storedValueRef = useRef<T>(initialValue);

  // 初回読み込み
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        const parsed = JSON.parse(item) as T;
        setStoredValue(parsed);
        storedValueRef.current = parsed;
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  // 値の更新（通常のお気に入りボタンを押した時）
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // 画面の表示と裏のデータを瞬時に更新（1回目のクリックでも絶対反応する）
      const valueToStore = value instanceof Function ? value(storedValueRef.current) : value;
      setStoredValue(valueToStore);
      storedValueRef.current = valueToStore;
      
      if (typeof window !== 'undefined') {
        // ここで保存すると、上のパッチ機能が動いて 'local-storage-updated' が裏で発火する
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  // リアルタイム同期（全解除ボタンを押した時 などの監視）
  useEffect(() => {
    const syncData = () => {
      try {
        const item = window.localStorage.getItem(key);
        const newValue = item !== null ? (JSON.parse(item) as T) : initialValue;
        
        // 実際のデータと画面のデータにズレがある場合のみ、画面を更新する
        if (JSON.stringify(storedValueRef.current) !== JSON.stringify(newValue)) {
          setStoredValue(newValue);
          storedValueRef.current = newValue;
        }
      } catch (e) {}
    };

    // 拡張機能による同じタブ内の変更（全解除ボタンなど）を検知
    window.addEventListener('local-storage-updated', syncData);
    // 別タブからの変更を検知
    window.addEventListener('storage', syncData);

    return () => {
      window.removeEventListener('local-storage-updated', syncData);
      window.removeEventListener('storage', syncData);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
}