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
        <h1>Scandit Inventory</h1>
        {inventory.length > 0 && (
          <button className="btn-clear" onClick={clearInventory}>
            <Trash2 size={16} />
          </button>
        )}
      </header>

      <main className="inventory-list">
        {inventory.length === 0 ? (
          <div className="empty-state">
            <Package />
            <p>Aucun article scanné</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Commencez par scanner un code-barres 128</p>
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
                  padding: '2px 6px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '4px',
                  color: 'var(--primary-hover)'
                }}>
                  {item.symbology.toUpperCase()}
                </span>
              </div>
            </div>
          ))
        )}
      </main>

      {!isScanning && (
        <div className="scan-controls">
          <button className="btn-scan" onClick={startScanning}>
            <Camera size={20} />
            SCANNER
          </button>
        </div>
      )}

      {isScanning && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 2000 }}>
          <button
            onClick={stopScanning}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer'
            }}
          >
            FERMER
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
