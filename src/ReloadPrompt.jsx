import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady] = [false, () => { }],
        needUpdate: [needUpdate, setNeedUpdate] = [false, () => { }],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    }) || {}

    const close = () => {
        setOfflineReady(false)
        setNeedUpdate(false)
    }

    return (
        <div className="pwa-toast-container">
            {(offlineReady || needUpdate) && (
                <div className="pwa-toast">
                    <div className="pwa-toast-message">
                        {offlineReady ? (
                            <span>Application prête pour une utilisation hors ligne.</span>
                        ) : (
                            <span>Une nouvelle version est disponible !</span>
                        )}
                    </div>
                    <div className="pwa-toast-actions">
                        {needUpdate && (
                            <button className="pwa-toast-button reload" onClick={() => updateServiceWorker(true)}>
                                METTRE À JOUR
                            </button>
                        )}
                        <button className="pwa-toast-button close" onClick={() => close()}>
                            FERMER
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ReloadPrompt
