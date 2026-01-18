import { useState, useEffect, useRef, useCallback } from 'react';
import { DataCaptureContext } from "@scandit/web-datacapture-core";
import {
    SparkScan,
    SparkScanSettings,
    SparkScanView,
    SparkScanViewSettings,
    Symbology,
    barcodeCaptureLoader,
    SparkScanBarcodeSuccessFeedback
} from "@scandit/web-datacapture-barcode";

const LICENSE_KEY = "Aplm1QpULSQXAyefS+LamLYrRrRhHEGWgzHT60QpNI2mGknMjEwJYihCrACBVJ3e1E+mwutGs94CGNdCyWgDpGEiQJOiS2AueCkbA4soubrcAMxQiChIMDEWsNxifsAd3n18MzRfOMYVRVypA20kTMtaOwQTdHZllFpbgMJQMGr9dGvTVVPAqwpe7zM9axlgHW7ivT9W8uzrR/FCmHuROqNtso1OTz1KqQiQKMpYiFKTX8m9TkVnndFz+zJ7FMDZZ25lcVZkflf7ROD/Q0d0+QlXVqiwZYjSiHISLF5ggKRPf1yND2lWyJplAe1ieU2Od0/2AiZskMYEIKVYXw8sotw594sUS/MBTQI2zZtyDa59EXCeN1iySSMkb4QlVFNpegeSu6l/tJpLfxd+8USg/PYxycVNUf/Y+08Wu3VrzRUHXbmrPlMPn+8tqwtMZSVYeSMYFA1cBf2UaIY/vVzwCclEufOTaz/oT3/UG4xd8hW+bSeLYkIefwseHpj/MZPFn3b7nFl4JlkkBz6LigyHXhUyciOiVDOaxuFaeGCWGNRgsbAAYbpaG1w+Obv4HWVEqEgT8ln+TuoqN2oEV4JnTYKrxKeG8H5Nf10b7TuML7SjDKsz/1+8mtMgFi7eEQfTIp5L0O4ijwPCfm5sT70VcNkbYY/rgNJ2DOlIFC6t3cNsPN11TZGIqznd9XaBTmKcfBH7/5+FA0bXH7rWyc+B/JpUPUPLuXMB6kj6Lg2/EkfizLezx29aT9wSFp6YnMj4Ih8d++Oj7FzfuGslH4ErTEBhAczloBfXA9xOftPU6VEr+ejZB2HpuXNKB6Fyfe2Gt6FdtevhpzmtrAlPheNbOnqAyEcyUE/v84RTnyUFKVxLaTA6glRnnkVz6Nzl85HTP0VwzbaGqNf4JrexKYp51iwXoSOzBnp7BHSFyEDdbDu8o6xRpKK8beoVtyV4nGAwNZxOPB30SeEJXkk6v9PqzLac82M9eb5ZQ6ncv7SkIBAVXUMsGqoMtCp7vNDa0MXrYG+0ecSNBs99U8HMpxr0FaIapPDwi3J7GYBFs5oMW3FXZ+BaRKfhPtZZVnszVqX6mIlacWD8lBZyw8T0YTslYt5CqrfBZNQ99vqNxYquUXyELhUqrryZwnNGSroCpcEMKufauRN0gNdTP8o6bpLHCA/+vmkM0ANMwZ4nAbJ1SfbbViqyN77sTQtSTzaRKu0O+bo=";

/**
 * Simple Scandit SparkScan Hook
 * Uses SparkScan's default UI - no custom controls
 */
export const useScandit = (onScan) => {
    const [isReady, setIsReady] = useState(false);
    const contextRef = useRef(null);
    const sparkScanRef = useRef(null);
    const viewRef = useRef(null);
    const onScanRef = useRef(onScan);

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    // Initialize Scandit SDK once
    useEffect(() => {
        const init = async () => {
            try {
                const context = await DataCaptureContext.forLicenseKey(LICENSE_KEY, {
                    libraryLocation: "https://cdn.jsdelivr.net/npm/@scandit/web-datacapture-barcode@latest/sdc-lib/",
                    moduleLoaders: [barcodeCaptureLoader()],
                });

                const settings = new SparkScanSettings();
                settings.enableSymbologies([Symbology.Code128]);

                const sparkScan = SparkScan.forSettings(settings);

                sparkScan.addListener({
                    didScan: (_, session) => {
                        const barcode = session.newlyRecognizedBarcode;
                        if (barcode && onScanRef.current) {
                            onScanRef.current({
                                data: barcode.data,
                                symbology: barcode.symbology,
                                timestamp: new Date().toISOString()
                            });
                        }
                    },
                });

                contextRef.current = context;
                sparkScanRef.current = sparkScan;
                setIsReady(true);
            } catch (error) {
                console.error("Scandit init error:", error);
            }
        };
        init();

        return () => {
            if (viewRef.current) {
                viewRef.current.stopScanning();
                viewRef.current.detach();
            }
        };
    }, []);

    /**
     * Show the SparkScan scanner with DEFAULT UI
     */
    const showScanner = useCallback((container) => {
        if (!isReady || !container || viewRef.current) return;

        // Use default settings - SparkScan knows best
        const viewSettings = new SparkScanViewSettings();

        // Enable continuous scanning toggle in UI
        viewSettings.scanningBehaviorButtonVisible = true;

        const view = SparkScanView.forElement(
            container,
            contextRef.current,
            sparkScanRef.current,
            viewSettings
        );

        // Success feedback
        view.feedbackDelegate = {
            feedbackForBarcode: () => new SparkScanBarcodeSuccessFeedback(),
        };

        viewRef.current = view;
    }, [isReady]);

    /**
     * Hide the scanner
     */
    const hideScanner = useCallback(async () => {
        if (viewRef.current) {
            await viewRef.current.stopScanning();
            viewRef.current.detach();
            viewRef.current = null;
        }
    }, []);

    return { isReady, showScanner, hideScanner };
};
