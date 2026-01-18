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
    SparkScanScanningBehavior
} from "@scandit/web-datacapture-barcode";

const LICENSE_KEY = "Aplm1QpULSQXAyefS+LamLYrRrRhHEGWgzHT60QpNI2mGknMjEwJYihCrACBVJ3e1E+mwutGs94CGNdCyWgDpGEiQJOiS2AueCkbA4soubrcAMxQiChIMDEWsNxifsAd3n18MzRfOMYVRVypA20kTMtaOwQTdHZllFpbgMJQMGr9dGvTVVPAqwpe7zM9axlgHW7ivT9W8uzrR/FCmHuROqNtso1OTz1KqQiQKMpYiFKTX8m9TkVnndFz+zJ7FMDZZ25lcVZkflf7ROD/Q0d0+QlXVqiwZYjSiHISLF5ggKRPf1yND2lWyJplAe1ieU2Od0/2AiZskMYEIKVYXw8sotw594sUS/MBTQI2zZtyDa59EXCeN1iySSMkb4QlVFNpegeSu6l/tJpLfxd+8USg/PYxycVNUf/Y+08Wu3VrzRUHXbmrPlMPn+8tqwtMZSVYeSMYFA1cBf2UaIY/vVzwCclEufOTaz/oT3/UG4xd8hW+bSeLYkIefwseHpj/MZPFn3b7nFl4JlkkBz6LigyHXhUyciOiVDOaxuFaeGCWGNRgsbAAYbpaG1w+Obv4HWVEqEgT8ln+TuoqN2oEV4JnTYKrxKeG8H5Nf10b7TuML7SjDKsz/1+8mtMgFi7eEQfTIp5L0O4ijwPCfm5sT70VcNkbYY/rgNJ2DOlIFC6t3cNsPN11TZGIqznd9XaBTmKcfBH7/5+FA0bXH7rWyc+B/JpUPUPLuXMB6kj6Lg2/EkfizLezx29aT9wSFp6YnMj4Ih8d++Oj7FzfuGslH4ErTEBhAczloBfXA9xOftPU6VEr+ejZB2HpuXNKB6Fyfe2Gt6FdtevhpzmtrAlPheNbOnqAyEcyUE/v84RTnyUFKVxLaTA6glRnnkVz6Nzl85HTP0VwzbaGqNf4JrexKYp51iwXoSOzBnp7BHSFyEDdbDu8o6xRpKK8beoVtyV4nGAwNZxOPB30SeEJXkk6v9PqzLac82M9eb5ZQ6ncv7SkIBAVXUMsGqoMtCp7vNDa0MXrYG+0ecSNBs99U8HMpxr0FaIapPDwi3J7GYBFs5oMW3FXZ+BaRKfhPtZZVnszVqX6mIlacWD8lBZyw8T0YTslYt5CqrfBZNQ99vqNxYquUXyELhUqrryZwnNGSroCpcEMKufauRN0gNdTP8o6bpLHCA/+vmkM0ANMwZ4nAbJ1SfbbViqyN77sTQtSTzaRKu0O+bo=";

export const useScandit = (onScan) => {
    const [isReady, setIsReady] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const contextRef = useRef(null);
    const sparkScanRef = useRef(null);
    const viewRef = useRef(null);
    const onScanRef = useRef(onScan);

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    // Initialize Scandit once
    useEffect(() => {
        const init = async () => {
            try {
                const ctx = await DataCaptureContext.forLicenseKey(LICENSE_KEY, {
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

                contextRef.current = ctx;
                sparkScanRef.current = sparkScan;
                setIsReady(true);
            } catch (error) {
                console.error("Scandit Init Error:", error);
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

    const startScanning = useCallback(async (container) => {
        if (!isReady || !container) return;

        // Create the view only once
        if (!viewRef.current) {
            const viewSettings = new SparkScanViewSettings();
            viewSettings.scanningBehavior = SparkScanScanningBehavior.Continuous;
            viewSettings.holdToScanEnabled = false;

            const view = SparkScanView.forElement(
                container,
                contextRef.current,
                sparkScanRef.current,
                viewSettings
            );

            // Hide the default trigger button - we use our own
            view.triggerButtonVisible = false;
            view.feedbackDelegate = {
                getFeedbackForBarcode: () => new SparkScanBarcodeSuccessFeedback(),
            };

            viewRef.current = view;
        }

        await viewRef.current.prepareScanning();
        await viewRef.current.startScanning();
        setIsScanning(true);
    }, [isReady]);

    const stopScanning = useCallback(async () => {
        if (viewRef.current) {
            await viewRef.current.pauseScanning();
        }
        setIsScanning(false);
    }, []);

    const closeScanner = useCallback(async () => {
        if (viewRef.current) {
            await viewRef.current.stopScanning();
            viewRef.current.detach();
            viewRef.current = null;
        }
        setIsScanning(false);
    }, []);

    return { isReady, isScanning, startScanning, stopScanning, closeScanner };
};
