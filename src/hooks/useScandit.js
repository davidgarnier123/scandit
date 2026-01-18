import { useState, useEffect, useRef, useCallback } from 'react';
import { DataCaptureContext } from "@scandit/web-datacapture-core";
import {
    SparkScan,
    SparkScanSettings,
    SparkScanView,
    SparkScanViewSettings,
    Symbology,
    barcodeCaptureLoader,
    SparkScanBarcodeSuccessFeedback,
    SparkScanScanningBehavior,
    SparkScanPreviewBehavior,
    SparkScanScanningModeDefault
} from "@scandit/web-datacapture-barcode";

const LICENSE_KEY = "Aplm1QpULSQXAyefS+LamLYrRrRhHEGWgzHT60QpNI2mGknMjEwJYihCrACBVJ3e1E+mwutGs94CGNdCyWgDpGEiQJOiS2AueCkbA4soubrcAMxQiChIMDEWsNxifsAd3n18MzRfOMYVRVypA20kTMtaOwQTdHZllFpbgMJQMGr9dGvTVVPAqwpe7zM9axlgHW7ivT9W8uzrR/FCmHuROqNtso1OTz1KqQiQKMpYiFKTX8m9TkVnndFz+zJ7FMDZZ25lcVZkflf7ROD/Q0d0+QlXVqiwZYjSiHISLF5ggKRPf1yND2lWyJplAe1ieU2Od0/2AiZskMYEIKVYXw8sotw594sUS/MBTQI2zZtyDa59EXCeN1iySSMkb4QlVFNpegeSu6l/tJpLfxd+8USg/PYxycVNUf/Y+08Wu3VrzRUHXbmrPlMPn+8tqwtMZSVYeSMYFA1cBf2UaIY/vVzwCclEufOTaz/oT3/UG4xd8hW+bSeLYkIefwseHpj/MZPFn3b7nFl4JlkkBz6LigyHXhUyciOiVDOaxuFaeGCWGNRgsbAAYbpaG1w+Obv4HWVEqEgT8ln+TuoqN2oEV4JnTYKrxKeG8H5Nf10b7TuML7SjDKsz/1+8mtMgFi7eEQfTIp5L0O4ijwPCfm5sT70VcNkbYY/rgNJ2DOlIFC6t3cNsPN11TZGIqznd9XaBTmKcfBH7/5+FA0bXH7rWyc+B/JpUPUPLuXMB6kj6Lg2/EkfizLezx29aT9wSFp6YnMj4Ih8d++Oj7FzfuGslH4ErTEBhAczloBfXA9xOftPU6VEr+ejZB2HpuXNKB6Fyfe2Gt6FdtevhpzmtrAlPheNbOnqAyEcyUE/v84RTnyUFKVxLaTA6glRnnkVz6Nzl85HTP0VwzbaGqNf4JrexKYp51iwXoSOzBnp7BHSFyEDdbDu8o6xRpKK8beoVtyV4nGAwNZxOPB30SeEJXkk6v9PqzLac82M9eb5ZQ6ncv7SkIBAVXUMsGqoMtCp7vNDa0MXrYG+0ecSNBs99U8HMpxr0FaIapPDwi3J7GYBFs5oMW3FXZ+BaRKfhPtZZVnszVqX6mIlacWD8lBZyw8T0YTslYt5CqrfBZNQ99vqNxYquUXyELhUqrryZwnNGSroCpcEMKufauRN0gNdTP8o6bpLHCA/+vmkM0ANMwZ4nAbJ1SfbbViqyN77sTQtSTzaRKu0O+bo=";

/**
 * Scandit SparkScan Hook
 * 
 * Configuration based on documentation:
 * - Scanning Behavior: Continuous (scan barcodes consecutively)
 * - Preview Behavior: Persistent (camera stays visible)
 * - Custom Trigger: Hide default button, use our own controls
 */
export const useScandit = (onScan) => {
    const [isReady, setIsReady] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const contextRef = useRef(null);
    const sparkScanRef = useRef(null);
    const viewRef = useRef(null);
    const onScanRef = useRef(onScan);

    // Keep callback reference updated
    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    // Initialize Scandit SDK once on mount
    useEffect(() => {
        const initializeScandit = async () => {
            try {
                // 1. Create Data Capture Context
                const context = await DataCaptureContext.forLicenseKey(LICENSE_KEY, {
                    libraryLocation: "https://cdn.jsdelivr.net/npm/@scandit/web-datacapture-barcode@latest/sdc-lib/",
                    moduleLoaders: [barcodeCaptureLoader()],
                });

                // 2. Configure SparkScan Settings
                const settings = new SparkScanSettings();
                settings.enableSymbologies([Symbology.Code128]);

                // 3. Create SparkScan instance
                const sparkScan = SparkScan.forSettings(settings);

                // 4. Add scan listener
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
                console.log("Scandit SDK initialized successfully");
            } catch (error) {
                console.error("Scandit initialization error:", error);
            }
        };

        initializeScandit();

        // Cleanup on unmount
        return () => {
            if (viewRef.current) {
                viewRef.current.stopScanning();
                viewRef.current.detach();
                viewRef.current = null;
            }
        };
    }, []);

    /**
     * Mount the SparkScan view to a container element
     */
    const mountScanner = useCallback((container) => {
        if (!isReady || !container || viewRef.current) return;

        // Configure View Settings
        const viewSettings = new SparkScanViewSettings();

        // CONTINUOUS: Scan barcodes consecutively without stopping
        viewSettings.scanningBehavior = SparkScanScanningBehavior.Continuous;

        // Disable hold-to-scan - we control with custom buttons
        viewSettings.holdToScanEnabled = false;

        // PERSISTENT preview: Camera stays visible, doesn't fade after scan
        viewSettings.defaultScanningMode = new SparkScanScanningModeDefault(
            SparkScanPreviewBehavior.Persistent
        );

        // DISABLE inactivity timeout: -1 means infinite (no auto-stop)
        viewSettings.inactiveStateTimeout = -1;

        // Create the SparkScan View
        const view = SparkScanView.forElement(
            container,
            contextRef.current,
            sparkScanRef.current,
            viewSettings
        );

        // Hide default trigger button - we use our own UI controls
        view.triggerButtonVisible = false;

        // Provide success feedback for each scan
        view.feedbackDelegate = {
            feedbackForBarcode: () => new SparkScanBarcodeSuccessFeedback(),
        };

        viewRef.current = view;
        console.log("SparkScan view mounted");
    }, [isReady]);

    /**
     * Start scanning - call after mounting
     */
    const startScanning = useCallback(async () => {
        if (!viewRef.current) return;

        await viewRef.current.prepareScanning();
        await viewRef.current.startScanning();
        setIsActive(true);
        console.log("Scanning started");
    }, []);

    /**
     * Pause scanning - camera stays visible but stops detecting
     */
    const pauseScanning = useCallback(async () => {
        if (!viewRef.current) return;

        await viewRef.current.pauseScanning();
        setIsActive(false);
        console.log("Scanning paused");
    }, []);

    /**
     * Resume scanning after pause
     */
    const resumeScanning = useCallback(async () => {
        if (!viewRef.current) return;

        await viewRef.current.startScanning();
        setIsActive(true);
        console.log("Scanning resumed");
    }, []);

    /**
     * Stop and detach the scanner completely
     */
    const unmountScanner = useCallback(async () => {
        if (!viewRef.current) return;

        await viewRef.current.stopScanning();
        viewRef.current.detach();
        viewRef.current = null;
        setIsActive(false);
        console.log("SparkScan view unmounted");
    }, []);

    return {
        isReady,
        isActive,
        mountScanner,
        startScanning,
        pauseScanning,
        resumeScanning,
        unmountScanner
    };
};
