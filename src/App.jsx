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
  const [scannerVisible, setScannerVisible] = useState(false);
  const containerRef = useRef(null);

  // Use a ref to store inventory for the scan handler to avoid re-renders
  const inventoryRef = useRef(inventory);
  useEffect(() => {
    inventoryRef.current = inventory;
  }, [inventory]);

  // Stable scan handler that doesn't cause re-renders during scanning
  const handleScan = useCallback((barcode) => {
    if (navigator.vibrate) navigator.vibrate(100);

    const newItem = { ...barcode, id: Date.now() };
    setInventory(prev => {
      const newList = [newItem, ...prev];
      localStorage.setItem('inventory', JSON.stringify(newList));
      return newList;
    });
  }, []);

  const { isReady, isScanning, startScanning, stopScanning, closeScanner } = useScandit(handleScan);

  const openScanner = async () => {
    setScannerVisible(true);
    // Wait for React to render the container
    requestAnimationFrame(async () => {
      if (containerRef.current) {
        await startScanning(containerRef.current);
      }
    });
  };

  const handleCloseScanner = async () => {
    await closeScanner();
    setScannerVisible(false);
  };

  const togglePause = async () => {
    if (isScanning) {
      await stopScanning();
    } else {
      if (containerRef.current) {
        await startScanning(containerRef.current);
      }
    }
  };

  const clearInventory = () => {
    if (window.confirm('Vider l\'inventaire ?')) {
      setInventory([]);
      localStorage.removeItem('inventory');
    }
  };

  return (
    <>
      {/* Scanner fullscreen - ALWAYS mounted, visibility controlled by CSS */}
      <div className={`scanner-fullscreen ${scannerVisible ? 'visible' : ''}`}>
        <div className="scanner-container" ref={containerRef}></div>

        {/* Control bar at the bottom */}
        <div className="scanner-controls">
          <button className="scanner-btn pause" onClick={togglePause}>
            {isScanning ? <Pause size={24} /> : <Play size={24} />}
            <span>{isScanning ? 'PAUSE' : 'REPRENDRE'}</span>
          </button>
          <button className="scanner-btn close" onClick={handleCloseScanner}>
            <X size={24} />
            <span>FERMER</span>
          </button>
        </div>

        {/* Scanned items overlay */}
        <div className="scanner-results">
          <div className="results-header">
            <span>{inventory.length} article{inventory.length !== 1 ? 's' : ''}</span>
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

      {/* Home view with inventory list */}
      <div className={`app-container ${scannerVisible ? 'hidden' : ''}`}>
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
          <button
            className="fab"
            onClick={openScanner}
            disabled={!isReady}
          >
            <Camera size={24} />
            <span>SCANNER</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
