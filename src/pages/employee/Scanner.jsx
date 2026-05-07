import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import api from '../../services/api';
import bluetoothScale from '../../utils/bluetooth';
import wifiScale from '../../utils/wifi';
import '../../styles/Scanner.css';

const Scanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [weight, setWeight] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [connectionMode, setConnectionMode] = useState('manual');
  const [bluetoothConnected, setBluetoothConnected] = useState(false);
  const [wifiUrl, setWifiUrl] = useState('');
  const [wifiConnected, setWifiConnected] = useState(false);
  const [error, setError] = useState('');
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [partNoInput, setPartNoInput] = useState('');
  const scannerRef = useRef(null);
  const scannerContainerId = 'qr-reader';

  const isScanningRef = useRef(false);

const handleScan = useCallback(async (partNo) => {
    if (isScanningRef.current) return;
    const upperPartNo = (partNo || '').trim().toUpperCase();
    if (!upperPartNo) return;

    setPartNoInput(upperPartNo);
    isScanningRef.current = true;
    setLoading(true);
    setError('');
    setValidationResult(null);
    setScanResult(null);
    setWeight('');
    setConnectionMode('manual');
    setBluetoothConnected(false);
    setWifiConnected(false);
    bluetoothScale.disconnect();
    wifiScale.disconnect();

    try {
      const res = await api.get(`/demo-data/${upperPartNo}`);
      setScanResult(res.data);
      setIsNewProduct(false);
    } catch (err) {
      // Backend returns 404 with { message, requiresDemoData: true }
      // Allow demo creation for that case and stop treating it as a hard error.
      if (err.response?.status === 404 && err.response?.data?.requiresDemoData) {
        setScanResult({
          partNo: upperPartNo,
          partDescription: '',
          unitWeight: '',
          toleranceWeight: '',
          totalCount: ''
        });
        setIsNewProduct(true);
        return;
      }

      setError(err.response?.data?.message || 'Product not found');
    } finally {
      setLoading(false);
      isScanningRef.current = false;
    }
  }, [setLoading, setError, setValidationResult, setScanResult, setWeight, setConnectionMode, setBluetoothConnected, setWifiConnected, setPartNoInput]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.error('Stop scanner error:', e);
      }
    }
  }, []);

  const startScanner = useCallback(async () => {
    try {
      scannerRef.current = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
        ]
      });
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const rawText = (decodedText || '').trim();
          const upperRaw = rawText.toUpperCase();

          // QR may contain a full URL like: https://Q.ME-QR.COM/I6CJM9PG
          // Convert it to the actual Part No: I6CJM9PG
          let extractedPartNo = upperRaw;
          try {
            if (upperRaw.includes('/')) {
              extractedPartNo = upperRaw.substring(upperRaw.lastIndexOf('/') + 1);
            }
            // Remove query string if present
            if (extractedPartNo.includes('?')) {
              extractedPartNo = extractedPartNo.split('?')[0];
            }
            extractedPartNo = (extractedPartNo || '').trim();
          } catch {
            extractedPartNo = upperRaw.trim();
          }

          setPartNoInput(extractedPartNo);
          handleScan(extractedPartNo);
        },
        () => {}
      );
      setScannerReady(true);
    } catch (err) {
      console.error('Scanner init error:', err);
      setError('Camera access denied or not available. You can enter Part No manually below.');
    }
  }, [handleScan]);

  useEffect(() => {
    startScanner();

    return () => {
      stopScanner();
      bluetoothScale.disconnect();
      wifiScale.disconnect();
    };
  }, [startScanner, stopScanner]);

  const handleValidate = async () => {
    if (!scanResult || !weight) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/scan', {
        partNo: scanResult.partNo,
        measuredWeight: parseFloat(weight)
      });
      setValidationResult(res.data);
      setScanResult(prev => ({ ...prev, remainingCount: res.data.remainingCount }));

      // Also refetch scanResult to ensure remainingCount is updated
      try {
        const res = await api.get(`/demo-data/${scanResult.partNo}`);
        setScanResult(res.data);
      } catch (err) {
        console.error('Failed to refetch scan result:', err);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (mode) => {
    setConnectionMode(mode);
    setWeight('');
    if (mode !== 'bluetooth') {
      bluetoothScale.disconnect();
      setBluetoothConnected(false);
    }
    if (mode !== 'wifi') {
      wifiScale.disconnect();
      setWifiConnected(false);
    }
  };

  const handleBluetoothConnect = async () => {
    try {
      await bluetoothScale.connect(
        null,
        null,
        (newWeight) => {
          setWeight(newWeight.toFixed(2));
        }
      );
      setBluetoothConnected(true);
    } catch (err) {
      setError('Bluetooth connection failed: ' + err.message);
    }
  };

  const handleWifiConnect = async () => {
    if (!wifiUrl) {
      setError('Please enter the WiFi scale URL');
      return;
    }
    try {
      await wifiScale.connect(
        wifiUrl,
        (newWeight) => {
          setWeight(newWeight.toFixed(2));
        },
        1000
      );
      setWifiConnected(true);
    } catch (err) {
      setError('WiFi connection failed: ' + err.message);
      setWifiConnected(false);
    }
  };

  const handleManualPartNo = (e) => {
    e.preventDefault();
    if (partNoInput) {
      handleScan(partNoInput);
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setValidationResult(null);
    setWeight('');
    setError('');
    setConnectionMode('manual');
    setBluetoothConnected(false);
    setWifiConnected(false);
    setIsNewProduct(false);
    setPartNoInput('');
    bluetoothScale.disconnect();
    wifiScale.disconnect();
  };

  const handleCreateDemo = async () => {
    if (!scanResult.partDescription || !scanResult.unitWeight || scanResult.toleranceWeight === '' || !scanResult.totalCount) {
      setError('Please fill all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/demo-data', {
        partNo: scanResult.partNo,
        partDescription: scanResult.partDescription,
        unitWeight: parseFloat(scanResult.unitWeight),
        toleranceWeight: parseFloat(scanResult.toleranceWeight),
        totalCount: parseInt(scanResult.totalCount)
      });
      // Fetch the created demo data
      const res = await api.get(`/demo-data/${scanResult.partNo}`);
      setScanResult(res.data);
      setIsNewProduct(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create demo data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="quantix-scanner">
      <h1 className="quantix-scanner__title">Product Scanner</h1>

      {!scanResult && (
        <>
          <div className="quantix-scanner__card quantix-scanner__card--center">
            <div id={scannerContainerId} className="quantix-scanner__qr-container" />
            {!scannerReady && !error && <p>Initializing camera...</p>}
          </div>

          <div className="quantix-scanner__card">
            <h3 className="quantix-scanner__section-title">Or Enter Part No Manually</h3>
            <form onSubmit={handleManualPartNo} className="quantix-scanner__form">
              <input
                name="partNo"
                value={partNoInput}
                onChange={(e) => setPartNoInput(e.target.value.toUpperCase())}
                placeholder="Enter Part No"
                className="quantix-scanner__input"
              />
              <button type="submit" className="quantix-scanner__button">
                Search
              </button>
            </form>
          </div>
        </>
      )}

      {error && (
        <div className="quantix-scanner__card quantix-scanner__card--error">
          {error}
          <button onClick={resetScan} className="quantix-scanner__button--reset">
            Reset
          </button>
        </div>
      )}

      {scanResult && (
        <div className="quantix-scanner__scan-grid">
          <div className="quantix-scanner__scan-grid-main">
            <div className="quantix-scanner__card">
              <div className="quantix-scanner__product-header">
                <h3 className="quantix-scanner__product-title">{isNewProduct ? 'Create Demo Data' : 'Product Details'}</h3>
                <button onClick={resetScan} className="quantix-scanner__button--small-gray">
                  New Scan
                </button>
              </div>

            <table className="quantix-scanner__table">
              <thead>
                <tr>
                  <th>Part No</th>
                  <th>Description</th>
                  <th>Unit Weight</th>
                  <th>Tolerance Weight</th>
                  {isNewProduct && <th>Total Count</th>}
                  {!isNewProduct && <th>Total Ideal Product Count</th>}
                  {!isNewProduct && <th>Weight</th>}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="quantix-scanner__part-no">{scanResult.partNo}</td>
                  <td>
                    {isNewProduct ? (
                      <input
                        type="text"
                        value={scanResult.partDescription}
                        onChange={(e) => setScanResult({ ...scanResult, partDescription: e.target.value })}
                        placeholder="Enter description"
                        className="quantix-scanner__input"
                      />
                    ) : (
                      scanResult.partDescription
                    )}
                  </td>
                  <td>
                    {isNewProduct ? (
                      <input
                        type="number"
                        step="0.001"
                        value={scanResult.unitWeight}
                        onChange={(e) => setScanResult({ ...scanResult, unitWeight: e.target.value })}
                        placeholder="kg"
                        className="quantix-scanner__input"
                      />
                    ) : (
                      `${parseFloat(scanResult.unitWeight).toFixed(3)} kg`
                    )}
                  </td>
                  <td>
                    {isNewProduct ? (
                      <input
                        type="number"
                        step="0.001"
                        value={scanResult.toleranceWeight}
                        onChange={(e) => setScanResult({ ...scanResult, toleranceWeight: e.target.value })}
                        placeholder="kg"
                        className="quantix-scanner__input"
                        min="0"
                      />
                    ) : (
                      `${parseFloat(scanResult.toleranceWeight ?? 0).toFixed(3)} kg`
                    )}
                  </td>
                  {isNewProduct && (
                    <td>
                      <input
                        type="number"
                        value={scanResult.totalCount}
                        onChange={(e) => setScanResult({ ...scanResult, totalCount: e.target.value })}
                        placeholder="Count"
                        className="quantix-scanner__input"
                        min="1"
                      />
                    </td>
                  )}
                  {!isNewProduct && (
                    <td>{scanResult.totalCount}</td>
                  )}
                  {!isNewProduct && (
                    <td className={weight ? 'quantix-scanner__weight-value' : 'quantix-scanner__weight-placeholder'}>
                      {weight ? `${parseFloat(weight).toFixed(2)} kg` : '-'}
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="quantix-scanner__card">
            {isNewProduct ? (
              <button
                onClick={handleCreateDemo}
                disabled={loading}
                className="quantix-scanner__button--validate"
              >
                {loading ? 'Creating...' : 'Create Demo Data'}
              </button>
            ) : (
              <>
                <h3 className="quantix-scanner__section-title">Weight Input</h3>
                <div className="quantix-scanner__mode-buttons">
                  <button onClick={() => handleModeChange('manual')} className={`quantix-scanner__mode-btn ${connectionMode === 'manual' ? 'quantix-scanner__mode-btn--active' : ''}`}>Manual</button>
                  <button onClick={() => handleModeChange('bluetooth')} className={`quantix-scanner__mode-btn ${connectionMode === 'bluetooth' ? 'quantix-scanner__mode-btn--active' : ''}`}>Bluetooth</button>
                  <button onClick={() => handleModeChange('wifi')} className={`quantix-scanner__mode-btn ${connectionMode === 'wifi' ? 'quantix-scanner__mode-btn--active' : ''}`}>WiFi</button>
                </div>

                {connectionMode === 'manual' && (
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Weight in kg"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="quantix-scanner__input quantix-scanner__input--full"
                  />
                )}

                {connectionMode === 'bluetooth' && (
                  <div className="quantix-scanner__input-row">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Weight in kg"
                      value={weight}
                      readOnly
                      className="quantix-scanner__input quantix-scanner__input--readonly"
                    />
                    <button
                      onClick={handleBluetoothConnect}
                      className={`quantix-scanner__connect-btn ${bluetoothConnected ? 'quantix-scanner__connect-btn--bt-connected' : 'quantix-scanner__connect-btn--bt'}`}
                    >
                      {bluetoothConnected ? 'BT Connected' : 'Connect BT'}
                    </button>
                  </div>
                )}

                {connectionMode === 'wifi' && (
                  <div className="quantix-scanner__input-row quantix-scanner__input-row--wrap">
                    <input
                      type="url"
                      placeholder="http://192.168.1.100:8080/weight"
                      value={wifiUrl}
                      onChange={(e) => setWifiUrl(e.target.value)}
                      className="quantix-scanner__input"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Weight in kg"
                      value={weight}
                      readOnly
                      className="quantix-scanner__input quantix-scanner__input--readonly"
                    />
                    <button
                      onClick={handleWifiConnect}
                      className={`quantix-scanner__connect-btn ${wifiConnected ? 'quantix-scanner__connect-btn--wifi-connected' : 'quantix-scanner__connect-btn--wifi'}`}
                    >
                      {wifiConnected ? 'WiFi Connected' : 'Connect WiFi'}
                    </button>
                  </div>
                )}

                <button
                  onClick={handleValidate}
                  disabled={!weight || loading}
                  className="quantix-scanner__button--validate"
                >
                  {loading ? 'Validating...' : 'Validate Weight'}
                </button>
              </>
            )}
          </div>

          {validationResult && !isNewProduct && (
            <div className={`quantix-scanner__card ${validationResult.status === 'match' ? 'quantix-scanner__card--success' : 'quantix-scanner__card--fail'}`}>
              <div className="quantix-scanner__validation-icon">
                {validationResult.status === 'match' ? '✅' : '❌'}
              </div>
              <div className={`quantix-scanner__validation-status ${validationResult.status === 'match' ? 'quantix-scanner__validation-status--match' : 'quantix-scanner__validation-status--mismatch'}`}>
                {(() => {
                  if (validationResult.status === 'match') return 'MATCH';
                  if (validationResult.measuredWeight > validationResult.expectedWeight) return 'OVERWEIGHT';
                  return 'UNDERWEIGHT';
                })()}
              </div>
              <div className="quantix-scanner__validation-detail">
                Measured: {validationResult.measuredWeight} kg
              </div>
              <div className="quantix-scanner__validation-detail">
                Expected: {validationResult.expectedWeight} kg
              </div>
              <div className="quantix-scanner__validation-detail">
                Tolerance: {validationResult.toleranceWeight} kg
              </div>
              <div className="quantix-scanner__validation-detail">
                Expected Count: {validationResult.expectedCount}
              </div>
            </div>
          )}
          </div>

        </div>
      )}
   </div>
    </>
  );
};

export default Scanner;

