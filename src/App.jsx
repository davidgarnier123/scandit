import React, { useState, useEffect } from 'react';
import { Search, Package, Trash2, Camera } from 'lucide-react';
import { useScandit } from './hooks/useScandit';
import './index.css';

function App() {
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('inventory');
    return saved ? JSON.parse(saved) : [];
  });
  const [isScanning, setIsScanning] = useState(false);
  const [activeView, setActiveView] = useState(null);

  const handleScan = (barcode) => {
    setInventory(prev => {
      const newList = [barcode, ...prev];
      localStorage.setItem('inventory', JSON.stringify(newList));
      return newList;
    });
  };

  const { createView } = useScandit(handleScan);

  const startScanning = async () => {
    setIsScanning(true);
    const view = createView(document.body);
    if (view) {
      setActiveView(view);
      await view.prepareScanning();
    }
  };

  const stopScanning = async () => {
    if (activeView) {
      await activeView.stopScanning();
      activeView.detach();
      setActiveView(null);
    }
    setIsScanning(false);
  };

  const clearInventory = () => {
    if (window.confirm('Voulez-vous vraiment vider l\'inventaire ?')) {
      setInventory([]);
      localStorage.removeItem('inventory');
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>Scandit Inventory</h1>
        {inventory.length > 0 && (
          <button className="btn-clear" onClick={clearInventory} title="Vider l'inventaire">
            <Trash2 size={18} />
          </button>
        )}
      </header>

      <main className="inventory-list">
        {inventory.length === 0 ? (
          <div className="empty-state">
            <Package />
            <p>Aucun article scanné</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.6 }}>Tapez sur SCANNER pour commencer</p>
          </div>
        ) : (
          inventory.map((item, index) => (
            <div key={index} className="inventory-card">
              <div className="info">
                <h3>{item.data}</h3>
                <p>{new Date(item.timestamp).toLocaleTimeString()}</p>
              </div>
              <div className="symbology">
                <span style={{
                  fontSize: '0.7rem',
                  padding: '4px 8px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  borderRadius: '6px',
                  color: '#a78bfa',
                  fontWeight: '600',
                  border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                  {item.symbology.replace('sy-', '').toUpperCase()}
                </span>
              </div>
            </div>
          ))
        )}
      </main>

      {!isScanning && (
        <div className="scan-controls">
          <button className="btn-scan" onClick={startScanning}>
            <Camera size={22} />
            SCANNER
          </button>
        </div>
      )}

      {isScanning && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 2000 }}>
          <button
            onClick={stopScanning}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            FERMER LE SCANNER
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
