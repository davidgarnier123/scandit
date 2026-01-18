import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Package, Trash2, Camera, X } from 'lucide-react';
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

  const handleScan = useCallback((barcode) => {
    if (navigator.vibrate) navigator.vibrate(100);

    const newItem = { ...barcode, id: Date.now() };
    setInventory(prev => {
      const newList = [newItem, ...prev];
      localStorage.setItem('inventory', JSON.stringify(newList));
      return newList;
    });
  }, []);

  const { isReady, showScanner, hideScanner } = useScandit(handleScan);

  // Open scanner
  const openScanner = useCallback(() => {
    setScannerOpen(true);
  }, []);

  // Mount scanner when opened
  useEffect(() => {
    if (scannerOpen && containerRef.current && isReady) {
      showScanner(containerRef.current);
    }
  }, [scannerOpen, isReady, showScanner]);

  // Close scanner
  const closeScanner = useCallback(async () => {
    await hideScanner();
    setScannerOpen(false);
  }, [hideScanner]);

  const clearInventory = () => {
    if (window.confirm('Vider l\'inventaire ?')) {
      setInventory([]);
      localStorage.removeItem('inventory');
    }
  };

  return (
    <>
      {/* Scanner - SparkScan handles its own UI */}
      <div className={`scanner-fullscreen ${scannerOpen ? 'visible' : ''}`}>
        <div className="scanner-container" ref={containerRef}></div>

        {/* Just a close button */}
        <button className="close-scanner-btn" onClick={closeScanner}>
          <X size={20} />
          <span>Fermer</span>
        </button>

        {/* Small counter */}
        <div className="scan-counter">
          {inventory.length} scanné{inventory.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Home */}
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
              <p className="empty-hint">Appuyez sur Scanner</p>
            </div>
          ) : (
            inventory.map((item) => (
              <div key={item.id} className="inventory-card">
                <span className="card-data">{item.data}</span>
                <span className="card-meta">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
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
