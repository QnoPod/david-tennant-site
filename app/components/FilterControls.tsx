'use client';

type Props = {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  availabilityFilter: string;
  setAvailabilityFilter: (val: string) => void;
  allProviders: string[];
  selectedProviders: string[];
  toggleProvider: (name: string) => void;
  setSelectedProviders: (providers: string[]) => void;
};

export default function FilterControls({
  searchTerm, setSearchTerm, availabilityFilter, setAvailabilityFilter,
  allProviders, selectedProviders, toggleProvider, setSelectedProviders
}: Props) {
  return (
    <>
      {/* 検索窓 */}
      <input 
        type="text"
        placeholder="作品名で検索..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', fontSize: '16px' }}
      />
    
      {/* 配信状況の切り替えボタン */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        {['ALL', 'AVAILABLE', 'UNAVAILABLE'].map((val) => (
          <button 
            key={val}
            onClick={() => setAvailabilityFilter(val)}
            style={{ 
              padding: '8px 16px', borderRadius: '20px', border: '1px solid #444', cursor: 'pointer',
              backgroundColor: availabilityFilter === val ? '#4dabf7' : '#333', color: '#fff'
            }}
          >
            {val === 'ALL' ? 'すべて' : val === 'AVAILABLE' ? '配信あり' : '配信なし'}
          </button>
        ))}
      </div>

      {/* 複数選択用チェックボックスリスト */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        {allProviders.map(name => (
          <label key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#ccc' }}>
            <input 
              type="checkbox" 
              checked={selectedProviders.includes(name)}
              onChange={() => toggleProvider(name)}
              style={{ width: '16px', height: '16px' }}
            />
            {name}
          </label>
        ))}
        {selectedProviders.length > 0 && (
           <button onClick={() => setSelectedProviders([])} style={{ background: 'none', border: 'none', color: '#4dabf7', cursor: 'pointer', textDecoration: 'underline' }}>
             全解除
           </button>
        )}
      </div>
    </>
  );
}