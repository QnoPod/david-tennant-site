// app/utils/characterUtils.ts

/**
 * details.ts に登録されているキャラクターのテキストデータを解析し、
 * 「日本語のキャラクター名」と「詳細な説明文」に分割して返すヘルパー関数です。
 */
export function parseCharacterInfo(rawInfo: string | undefined): { jaName: string, description: string } {
  const defaultMessage = '詳細なキャラクター情報はありません。';
  
  if (!rawInfo || rawInfo === defaultMessage) {
    return { jaName: '', description: rawInfo || defaultMessage };
  }

  const cleanRawInfo = rawInfo.trim();
  const newlineIndex = cleanRawInfo.indexOf('\n');
  const colonIndex = cleanRawInfo.indexOf('：');

  let splitIndex = -1;
  
  // 改行かコロン、どちらか最初に出現した位置を分割ポイントにする
  if (newlineIndex !== -1 && colonIndex !== -1) {
    splitIndex = Math.min(newlineIndex, colonIndex);
  } else if (newlineIndex !== -1) {
    splitIndex = newlineIndex;
  } else if (colonIndex !== -1) {
    splitIndex = colonIndex;
  }

  // 分割ポイントが見つかった場合（名前と説明文が両方ある）
  if (splitIndex !== -1) {
    return {
      jaName: cleanRawInfo.substring(0, splitIndex).trim(),
      description: cleanRawInfo.substring(splitIndex + 1).trim()
    };
  }

  // コロンも改行もない場合（名前しか登録されていないと判定）
  return {
    jaName: cleanRawInfo,
    description: '' 
  };
}