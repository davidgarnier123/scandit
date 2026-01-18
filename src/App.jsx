import { Search, Package, Trash2, Camera } from 'lucide-react';
import { useScandit } from './hooks/useScandit';
import ReloadPrompt from './ReloadPrompt';
import './index.css';

function App() {
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('inventory');
    return saved ? JSON.parse(saved) : [];
  });
  const [isScanning, setIsScanning] = useState(false);
  const [activeView, setActiveView] = useState(null);

  const [lastScannedId, setLastScannedId] = useState(null);

  const handleScan = (barcode) => {
    // Haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    const newItem = { ...barcode, id: Date.now() };
    setInventory(prev => {
      const newList = [newItem, ...prev];
      localStorage.setItem('inventory', JSON.stringify(newList));
      return newList;
    });

    setLastScannedId(newItem.id);
    // Remove highlight after animation
    setTimeout(() => setLastScannedId(null), 1000);
  };

  const { createView } = useScandit(handleScan);

  const startScanning = async () => {
    setIsScanning(true);
    const container = document.getElementById('scandit-container');
    const view = createView(container);
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
      <ReloadPrompt />
      <div id="scandit-container"></div>
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
          inventory.map((item) => (
            <div
              key={item.id || item.timestamp}
              className={`inventory-card ${lastScannedId === item.id ? 'new-item' : ''}`}
            >
              <div className="info">
                <h3>{item.data}</h3>
                <p>{new Date(item.timestamp).toLocaleTimeString()}</p>
              </div>
              <div className="symbology">
                <span style={{
                  fontSize: '0.65rem',
                  padding: '3px 6px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: '5px',
                  color: '#a78bfa',
                  fontWeight: '600',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  textTransform: 'uppercase'
                }}>
                  {item.symbology.replace('sy-', '')}
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
        <div style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top, 0px) + 20px)',
          right: '20px',
          zIndex: 2000
        }}>
          <button
            onClick={stopScanning}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '10px',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem'
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
