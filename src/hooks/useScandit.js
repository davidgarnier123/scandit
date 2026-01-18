import { useState, useEffect, useRef, useCallback } from 'react';
import {
    DataCaptureContext,
    Camera,
    CameraPosition,
    DataCaptureView,
    FrameSourceState
} from "@scandit/web-datacapture-core";
import {
    BarcodeCapture,
    BarcodeCaptureSettings,
    BarcodeCaptureOverlay,
    Symbology,
    barcodeCaptureLoader
} from "@scandit/web-datacapture-barcode";

const LICENSE_KEY = "Aplm1QpULSQXAyefS+LamLYrRrRhHEGWgzHT60QpNI2mGknMjEwJYihCrACBVJ3e1E+mwutGs94CGNdCyWgDpGEiQJOiS2AueCkbA4soubrcAMxQiChIMDEWsNxifsAd3n18MzRfOMYVRVypA20kTMtaOwQTdHZllFpbgMJQMGr9dGvTVVPAqwpe7zM9axlgHW7ivT9W8uzrR/FCmHuROqNtso1OTz1KqQiQKMpYiFKTX8m9TkVnndFz+zJ7FMDZZ25lcVZkflf7ROD/Q0d0+QlXVqiwZYjSiHISLF5ggKRPf1yND2lWyJplAe1ieU2Od0/2AiZskMYEIKVYXw8sotw594sUS/MBTQI2zZtyDa59EXCeN1iySSMkb4QlVFNpegeSu6l/tJpLfxd+8USg/PYxycVNUf/Y+08Wu3VrzRUHXbmrPlMPn+8tqwtMZSVYeSMYFA1cBf2UaIY/vVzwCclEufOTaz/oT3/UG4xd8hW+bSeLYkIefwseHpj/MZPFn3b7nFl4JlkkBz6LigyHXhUyciOiVDOaxuFaeGCWGNRgsbAAYbpaG1w+Obv4HWVEqEgT8ln+TuoqN2oEV4JnTYKrxKeG8H5Nf10b7TuML7SjDKsz/1+8mtMgFi7eEQfTIp5L0O4ijwPCfm5sT70VcNkbYY/rgNJ2DOlIFC6t3cNsPN11TZGIqznd9XaBTmKcfBH7/5+FA0bXH7rWyc+B/JpUPUPLuXMB6kj6Lg2/EkfizLezx29aT9wSFp6YnMj4Ih8d++Oj7FzfuGslH4ErTEBhAczloBfXA9xOftPU6VEr+ejZB2HpuXNKB6Fyfe2Gt6FdtevhpzmtrAlPheNbOnqAyEcyUE/v84RTnyUFKVxLaTA6glRnnkVz6Nzl85HTP0VwzbaGqNf4JrexKYp51iwXoSOzBnp7BHSFyEDdbDu8o6xRpKK8beoVtyV4nGAwNZxOPB30SeEJXkk6v9PqzLac82M9eb5ZQ6ncv7SkIBAVXUMsGqoMtCp7vNDa0MXrYG+0ecSNBs99U8HMpxr0FaIapPDwi3J7GYBFs5oMW3FXZ+BaRKfhPtZZVnszVqX6mIlacWD8lBZyw8T0YTslYt5CqrfBZNQ99vqNxYquUXyELhUqrryZwnNGSroCpcEMKufauRN0gNdTP8o6bpLHCA/+vmkM0ANMwZ4nAbJ1SfbbViqyN77sTQtSTzaRKu0O+bo=";

/**
 * Scandit BarcodeCapture Hook
 * Uses the standard BarcodeCapture API for continuous scanning
 */
export const useScandit = (onScan) => {
    const [isReady, setIsReady] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const contextRef = useRef(null);
    const cameraRef = useRef(null);
    const barcodeCaptureRef = useRef(null);
    const viewRef = useRef(null);
    const onScanRef = useRef(onScan);

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    // Initialize Scandit SDK
    useEffect(() => {
        const init = async () => {
            try {
                // 1. Create Data Capture Context
                const context = await DataCaptureContext.forLicenseKey(LICENSE_KEY, {
                    libraryLocation: "https://cdn.jsdelivr.net/npm/@scandit/web-datacapture-barcode@latest/sdc-lib/",
                    moduleLoaders: [barcodeCaptureLoader()],
                });

                // 2. Configure Barcode Capture Settings
                const settings = new BarcodeCaptureSettings();
                settings.enableSymbologies([Symbology.Code128]);
                settings.codeDuplicateFilter = 500;

                // 3. Create BarcodeCapture instance
                const barcodeCapture = await BarcodeCapture.forContext(context, settings);

                // 4. Add scan listener
                barcodeCapture.addListener({
                    didScan: (bc, session) => {
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

                // 5. Setup Camera - use atPosition to get back camera
                const camera = Camera.atPosition(CameraPosition.WorldFacing);
                if (camera) {
                    const cameraSettings = BarcodeCapture.recommendedCameraSettings;
                    await camera.applySettings(cameraSettings);
                    await context.setFrameSource(camera);
                    cameraRef.current = camera;
                    console.log("Camera configured");
                } else {
                    console.error("No camera found");
                }

                contextRef.current = context;
                barcodeCaptureRef.current = barcodeCapture;
                setIsReady(true);
                console.log("BarcodeCapture initialized");
            } catch (error) {
                console.error("Scandit init error:", error);
            }
        };
        init();

        return () => {
            if (cameraRef.current) {
                cameraRef.current.switchToDesiredState(FrameSourceState.Off);
            }
            if (viewRef.current) {
                viewRef.current.detachFromElement();
            }
        };
    }, []);

    /**
     * Start scanning - creates view and turns on camera
     */
    const startScanning = useCallback(async (container) => {
        if (!isReady || !container) return;

        // Create DataCaptureView
        const view = await DataCaptureView.forContext(contextRef.current);
        view.connectToElement(container);

        // Add overlay for visual feedback
        await BarcodeCaptureOverlay.withBarcodeCaptureForView(
            barcodeCaptureRef.current,
            view
        );

        viewRef.current = view;

        // Turn on camera
        if (cameraRef.current) {
            await cameraRef.current.switchToDesiredState(FrameSourceState.On);
        }

        // Enable barcode capture
        await barcodeCaptureRef.current.setEnabled(true);
        setIsScanning(true);
        console.log("Scanning started");
    }, [isReady]);

    /**
     * Stop scanning - turns off camera
     */
    const stopScanning = useCallback(async () => {
        // Disable barcode capture
        if (barcodeCaptureRef.current) {
            await barcodeCaptureRef.current.setEnabled(false);
        }

        // Turn off camera
        if (cameraRef.current) {
            await cameraRef.current.switchToDesiredState(FrameSourceState.Off);
        }

        // Detach view
        if (viewRef.current) {
            viewRef.current.detachFromElement();
            viewRef.current = null;
        }

        setIsScanning(false);
        console.log("Scanning stopped");
    }, []);

    return { isReady, isScanning, startScanning, stopScanning };
};
