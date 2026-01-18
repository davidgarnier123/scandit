import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Package, Trash2, Camera, X, Pause, Play } from 'lucide-react';
import { useScandit } from './hooks/useScandit';
import ReloadPrompt from './ReloadPrompt';
import './index.css';

function App() {
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('inventory');
    return saved ? JSON.parse(saved) : [];
  });
  const [scannerOpen, setScannerOpen] = useState(false);
  const containerRef = useRef(null);

  // Scan handler - stable reference
  const handleScan = useCallback((barcode) => {
    if (navigator.vibrate) navigator.vibrate(100);

    const newItem = { ...barcode, id: Date.now() };
    setInventory(prev => {
      const newList = [newItem, ...prev];
      localStorage.setItem('inventory', JSON.stringify(newList));
      return newList;
    });
  }, []);

  const {
    isReady,
    isActive,
    mountScanner,
    startScanning,
    pauseScanning,
    resumeScanning,
    unmountScanner
  } = useScandit(handleScan);

  // Open scanner: mount then start
  const openScanner = useCallback(async () => {
    setScannerOpen(true);
  }, []);

  // Effect to mount and start scanner when container is ready
  useEffect(() => {
    if (scannerOpen && containerRef.current && isReady) {
      mountScanner(containerRef.current);
      // Small delay to ensure mount is complete
      setTimeout(() => {
        startScanning();
      }, 100);
    }
  }, [scannerOpen, isReady, mountScanner, startScanning]);

  // Close scanner: stop and unmount
  const closeScanner = useCallback(async () => {
    await unmountScanner();
    setScannerOpen(false);
  }, [unmountScanner]);

  // Toggle pause/resume
  const togglePause = useCallback(async () => {
    if (isActive) {
      await pauseScanning();
    } else {
      await resumeScanning();
    }
  }, [isActive, pauseScanning, resumeScanning]);

  // Clear inventory
  const clearInventory = () => {
    if (window.confirm('Vider l\'inventaire ?')) {
      setInventory([]);
      localStorage.removeItem('inventory');
    }
  };

  return (
    <>
      {/* Scanner View - always in DOM, visibility controlled by CSS */}
      <div className={`scanner-fullscreen ${scannerOpen ? 'visible' : ''}`}>
        <div className="scanner-container" ref={containerRef}></div>

        {/* Bottom controls */}
        <div className="scanner-controls">
          <button className="scanner-btn pause" onClick={togglePause}>
            {isActive ? <Pause size={24} /> : <Play size={24} />}
            <span>{isActive ? 'PAUSE' : 'REPRENDRE'}</span>
          </button>
          <button className="scanner-btn close" onClick={closeScanner}>
            <X size={24} />
            <span>FERMER</span>
          </button>
        </div>

        {/* Scanned items overlay */}
        <div className="scanner-results">
          <div className="results-header">
            <span>{inventory.length} article{inventory.length !== 1 ? 's' : ''} scanné{inventory.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="results-list">
            {inventory.slice(0, 5).map((item) => (
              <div key={item.id} className="result-item">
                <span className="result-data">{item.data}</span>
                <span className="result-time">{new Date(item.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Home View */}
      <div className={`app-container ${scannerOpen ? 'hidden' : ''}`}>
        <ReloadPrompt />

        <header className="header">
          <h1 className="app-title">Inventaire</h1>
          {inventory.length > 0 && (
            <button className="btn-clear" onClick={clearInventory}>
              <Trash2 size={18} />
            </button>
          )}
        </header>

        <main className="inventory-list">
          {inventory.length === 0 ? (
            <div className="empty-state">
              <Package size={48} />
              <p>Aucun article</p>
              <p className="empty-hint">Appuyez sur Scanner pour commencer</p>
            </div>
          ) : (
            inventory.map((item) => (
              <div key={item.id} className="inventory-card">
                <div className="card-content">
                  <span className="card-data">{item.data}</span>
                  <span className="card-meta">
                    {item.symbology.replace('sy-', '').toUpperCase()} • {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </main>

        <div className="fab-container">
          <button className="fab" onClick={openScanner} disabled={!isReady}>
            <Camera size={24} />
            <span>SCANNER</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
