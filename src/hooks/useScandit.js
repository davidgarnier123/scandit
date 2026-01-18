import { useState, useEffect } from 'react';
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

// Replace with your actual license key
const LICENSE_KEY = "Aplm1QpULSQXAyefS+LamLYrRrRhHEGWgzHT60QpNI2mGknMjEwJYihCrACBVJ3e1E+mwutGs94CGNdCyWgDpGEiQJOiS2AueCkbA4soubrcAMxQiChIMDEWsNxifsAd3n18MzRfOMYVRVypA20kTMtaOwQTdHZllFpbgMJQMGr9dGvTVVPAqwpe7zM9axlgHW7ivT9W8uzrR/FCmHuROqNtso1OTz1KqQiQKMpYiFKTX8m9TkVnndFz+zJ7FMDZZ25lcVZkflf7ROD/Q0d0+QlXVqiwZYjSiHISLF5ggKRPf1yND2lWyJplAe1ieU2Od0/2AiZskMYEIKVYXw8sotw594sUS/MBTQI2zZtyDa59EXCeN1iySSMkb4QlVFNpegeSu6l/tJpLfxd+8USg/PYxycVNUf/Y+08Wu3VrzRUHXbmvPlMPn+8tqwtMZSVYeSMYFA1cBf2UaIY/vVzwCclEufOTaz/oT3/UG4xd8hW+bSeLYkIefwseHpj/MZPFn3b7nFl4JlkkBz6LigyHXhUyciOiVDOaxuFaeGCWGNRgsbAAYbpaG1w+Obv4HWVEqEgT8ln+TuoqN2oEV4JnTYKrxKeG8H5Nf10b7TuML7SjDKsz/1+8mtMgFi7eEQfTIp5L0O4ijwPCfm5sT70VcNkbYY/rgNJ2DOlIFC6t3cNs8n11TZGIqznd9XaBTmKcfBH7/5+FA0bXH7rWyc+B/JpUPUPLuXMB6kj6Lg2/EkfizLezx29aT9wSFp6YnMj4Ih8d++Oj7FzfuGslH4ErTEBhAczloBfXA9xOftPU6VEr+ejZB2HpuXNKB6Fyfe2Gt6FdtevhpzmtrAlPheNbOnqAyEcyUE/v84RTnyUFKVxLaTA6glRnnkVz6Nzl85HTP0VwzbaGqNf4JrexKYp51iwXoSOzBnp7BHSFyEDdbDu8o6xRpKK8beoVtyV4nGAwNZxOPB30SeEJXkk6v9PqzLac82M9eb5ZQ6ncv7SkIBAVXUMsGqoMtCp7vNDa0MXrYG+0ecSNBs99U8HMpxr0FaIapPDwi3J7GYBFs5oMW3FXZ+BaRKfhPtZZVnszVqX6mIlacWD8lBZyw8T0YTslYt5CqrfBZNQ99vqNxYquUXyELhUqrryZwnNGSroCpcEMKufauRN0gNdTP8o6bpLHCA/+vmkM0ANMwZ4nAbJ1SfbbViqyN77sTQtSTzaRKu0O+bo=";

export const useScandit = (onScan) => {
    const [sparkScan, setSparkScan] = useState(null);
    const [context, setContext] = useState(null);

    useEffect(() => {
        let view = null;

        const initScandit = async () => {
            try {
                const dataCaptureContext = await DataCaptureContext.forLicenseKey(LICENSE_KEY, {
                    libraryLocation: "https://cdn.jsdelivr.net/npm/@scandit/web-datacapture-barcode@latest/sdc-lib/",
                    moduleLoaders: [barcodeCaptureLoader()],
                });

                const settings = new SparkScanSettings();
                settings.enableSymbologies([Symbology.Code128]);

                const sparkScanInstance = SparkScan.forSettings(settings);

                sparkScanInstance.addListener({
                    didScan: (sparkScan, session) => {
                        const barcode = session.newlyRecognizedBarcode;
                        if (barcode) {
                            onScan({
                                data: barcode.data,
                                symbology: barcode.symbology,
                                timestamp: new Date().toISOString()
                            });
                        }
                    },
                });

                setContext(dataCaptureContext);
                setSparkScan(sparkScanInstance);
            } catch (error) {
                console.error("Scandit Init Error:", error);
            }
        };

        initScandit();

        return () => {
            // Cleanup handled in component unmount usually, 
            // but we could stop scanning here if needed.
        };
    }, []);

    const createView = (element) => {
        if (!sparkScan || !context) return null;

        const viewSettings = new SparkScanViewSettings();
        // Force continuous scanning behavior
        viewSettings.scanningBehavior = SparkScanScanningBehavior.Continuous;
        // Enable the button to switch behavior just in case
        viewSettings.scanningBehaviorButtonVisible = true;

        const sparkScanView = SparkScanView.forElement(
            element,
            context,
            sparkScan,
            viewSettings
        );

        // Optional: Add feedback for successful scan to confirm it captured
        sparkScanView.feedbackDelegate = {
            getFeedbackForBarcode: (barcode) => {
                return new SparkScanBarcodeSuccessFeedback();
            },
        };

        return sparkScanView;
    };

    return { sparkScan, context, createView };
};
