import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import api, { getVendorSubmissionsForPart } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import bluetoothScale from '../../utils/bluetooth';
import wifiScale from '../../utils/wifi';
import '../../styles/Scanner.css';

const Scanner = () => {
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState(null);
  const [weight, setWeight] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vendorSubmissions, setVendorSubmissions] = useState([]);
  const [vendorSubmissionsLoading, setVendorSubmissionsLoading] = useState(false);
  const [vendorSubmissionsError, setVendorSubmissionsError] = useState('');
  const [selectedVendorSubmissionId, setSelectedVendorSubmissionId] = useState('');
  const [selectedVendorSubmission, setSelectedVendorSubmission] = useState(null);
  const [productDetailsUnlocked, setProductDetailsUnlocked] = useState(false);
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
  const shouldReviewVendorSubmissions = user?.role === 'employee' && user?.employeeType !== 'vendor';

  const loadVendorSubmissions = useCallback(async (partNo) => {
    setVendorSubmissions([]);
    setVendorSubmissionsError('');
    setSelectedVendorSubmissionId('');
    setSelectedVendorSubmission(null);

    if (!shouldReviewVendorSubmissions) {
      setProductDetailsUnlocked(true);
      return;
    }

    setVendorSubmissionsLoading(true);
    setProductDetailsUnlocked(false);

    try {
      const res = await getVendorSubmissionsForPart(partNo);
      const vendors = res.data?.vendors || [];
      setVendorSubmissions(vendors);
      setSelectedVendorSubmissionId(vendors.length === 1 ? getVendorSubmissionId(vendors[0]) : '');
    } catch (err) {
      setVendorSubmissionsError(err.response?.data?.message || 'Failed to load vendor submissions');
    } finally {
      setVendorSubmissionsLoading(false);
    }
  }, [shouldReviewVendorSubmissions]);

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
    setVendorSubmissions([]);
    setVendorSubmissionsError('');
    setSelectedVendorSubmissionId('');
    setSelectedVendorSubmission(null);
    setProductDetailsUnlocked(false);
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
      await loadVendorSubmissions(upperPartNo);
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
        setProductDetailsUnlocked(true);
        return;
      }

      setError(err.response?.data?.message || 'Product not found');
    } finally {
      setLoading(false);
      isScanningRef.current = false;
    }
  }, [loadVendorSubmissions, setLoading, setError, setValidationResult, setScanResult, setWeight, setConnectionMode, setBluetoothConnected, setWifiConnected, setPartNoInput]);

const safeStopScanner = useCallback(async () => {
  if (!scannerRef.current) return;

  try {
    await scannerRef.current.stop();
  } catch (e) {
    const msg = e?.message || '';
    if (!msg.includes('scanner is not running or paused')) {
      console.error('Stop scanner error:', e);
    }
  }

  try {
    await scannerRef.current.clear();
  } catch (e) {
    console.error('Clear scanner error:', e);
  }

  scannerRef.current = null;
  setScannerReady(false);
}, []);


 const startScanner = useCallback(async () => {
  try {
    // Prevent duplicate initialization
    if (scannerRef.current) {
      return;
    }

    const el = document.getElementById(scannerContainerId);
    if (el) {
      el.innerHTML = '';
    }

    const scanner = new Html5Qrcode(scannerContainerId, {
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

    scannerRef.current = scanner;

    await scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      async (decodedText) => {
        const rawText = (decodedText || '').trim();
        const upperRaw = rawText.toUpperCase();

        let extractedPartNo = upperRaw;

        try {
          if (upperRaw.includes('/')) {
            extractedPartNo =
              upperRaw.substring(upperRaw.lastIndexOf('/') + 1);
          }

          if (extractedPartNo.includes('?')) {
            extractedPartNo = extractedPartNo.split('?')[0];
          }

          extractedPartNo = extractedPartNo.trim();
        } catch {
          extractedPartNo = upperRaw.trim();
        }

        // STOP CAMERA AFTER SUCCESSFUL SCAN
        await safeStopScanner();

        setPartNoInput(extractedPartNo);
        handleScan(extractedPartNo);
      },
      () => {}
    );

    setScannerReady(true);
  } catch (err) {
    console.error('Scanner init error:', err);

    setError(
      'Camera access denied or not available. You can enter Part No manually below.'
    );
  }
}, [handleScan, safeStopScanner]);




  const parseWeightNumber = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  };

  const formatWeight = (val) => {
    const n = parseWeightNumber(val);
    return n === null ? 'N/A' : `${n.toFixed(2)} kg`;
  };

  const getVendorSubmissionId = (vendor) => (
    String(vendor.vendorId || `${vendor.vendorName}-${vendor.submittedAt}`)
  );

  const getFinalValidationDisplay = () => {
    if (!validationResult?.finalValidationStatus) return '-';
    return validationResult.finalValidationStatus === 'accepted' ? 'Accepted' : 'Rejected';
  };

  const handleContinueToProductDetails = () => {
    if (vendorSubmissions.length > 0 && !selectedVendorSubmissionId) return;

    const selectedVendor = vendorSubmissions.find((vendor) => (
      getVendorSubmissionId(vendor) === selectedVendorSubmissionId
    ));

    setSelectedVendorSubmission(selectedVendor || null);
    setWeight('');
    setProductDetailsUnlocked(true);
  };

  const getLiveWeightStatus = () => {
    if (!scanResult) return null;
    // Backend uses unitWeight/toleranceWeight on demo-data response.
    // Some responses may also include expectedWeight; support both.
    //const expectedValue = scanResult.expectedWeight ?? (scanResult.unitWeight * scanResult.totalCount);
    const selectedReferenceWeight = selectedVendorSubmission?.overallWeight ?? selectedVendorSubmission?.measuredWeight;
    const expected = selectedReferenceWeight ?? scanResult.expectedWeight ?? (scanResult.unitWeight * scanResult.totalCount);
    const measured = parseWeightNumber(weight);
    if (expected === null || measured === null) return null;

    const diff = measured - expected;

    if (selectedReferenceWeight !== undefined && selectedReferenceWeight !== null) {
      if (diff === 0) return { kind: 'match', displayDiff: 0 };
    } else {
      const toleranceRaw = scanResult.toleranceWeight ?? 0;
      const tolerance = parseWeightNumber(toleranceRaw);
      const safeTolerance = tolerance === null ? 0 : tolerance;
      if (Math.abs(diff) <= safeTolerance) return { kind: 'match', displayDiff: 0 };
    }

    if (diff > 0) return { kind: 'excess', displayDiff: diff };
    return { kind: 'short', displayDiff: diff };
  };

  const handleValidate = async () => {
    if (!scanResult || !weight) return;
    setLoading(true);
    setError('');

    // Snapshot live validation to keep UI in sync.
    // (Used to show border + +/- adornment before validate completes.)


    try {
      const referenceWeight = selectedVendorSubmission?.overallWeight ?? selectedVendorSubmission?.measuredWeight;
      const res = await api.post('/scan', {
        partNo: scanResult.partNo,
        measuredWeight: parseFloat(weight),
        ...(referenceWeight !== undefined && referenceWeight !== null && referenceWeight !== ''
          ? { referenceWeight: parseFloat(referenceWeight) }
          : {})
      });
      setValidationResult(res.data);
      //setScanResult(prev => ({ ...prev, remainingCount: res.data.remainingCount }));

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

 const handleManualPartNo = async (e) => {
  e.preventDefault();

  if (partNoInput) {
    await safeStopScanner();
    handleScan(partNoInput);
  }
};

 const resetScan = async () => {
  setScanResult(null);
  setValidationResult(null);
  setWeight('');
  setError('');
  setVendorSubmissions([]);
  setVendorSubmissionsError('');
  setSelectedVendorSubmissionId('');
  setSelectedVendorSubmission(null);
  setProductDetailsUnlocked(false);
  setConnectionMode('manual');
  setBluetoothConnected(false);
  setWifiConnected(false);
  setIsNewProduct(false);
  setPartNoInput('');

  bluetoothScale.disconnect();
  wifiScale.disconnect();

  isScanningRef.current = false;

  // Stop existing camera
  await safeStopScanner();

  // Clear DOM container
  const el = document.getElementById(scannerContainerId);
  if (el) {
    el.innerHTML = '';
  }

  // Small delay ensures DOM is ready
  setTimeout(() => {
    startScanner();
  }, 300);
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
      setProductDetailsUnlocked(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create demo data');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
  startScanner();

  return () => {
    safeStopScanner();

    bluetoothScale.disconnect();
    wifiScale.disconnect();
  };
}, [startScanner, safeStopScanner]);

  const showVendorReview = scanResult && !isNewProduct && shouldReviewVendorSubmissions && !productDetailsUnlocked;

  return (
    <>
    <div
      className="quantix-scanner"
      onMouseDown={(e) => {
        // Prevent an invisible html5-qrcode input from keeping focus when user clicks on blank page/body.
        if (e.target === e.currentTarget) {
          document.activeElement?.blur?.();
        }
      }}
    >
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
      <br></br>
      {showVendorReview && (
        <div className="quantix-scanner__card quantix-scanner__vendor-review">
          <div className="quantix-scanner__product-header">
            <div>
              <h3 className="quantix-scanner__product-title">Vendor Submissions</h3>
              <div className="quantix-scanner__vendor-part">Part No: {scanResult.partNo}</div>
            </div>
            <button onClick={resetScan} className="quantix-scanner__button--small-gray">
              New Scan
            </button>
          </div>

          {vendorSubmissionsLoading ? (
            <div className="quantix-scanner__vendor-empty">Loading vendor submissions...</div>
          ) : vendorSubmissionsError ? (
            <div className="quantix-scanner__vendor-error">{vendorSubmissionsError}</div>
          ) : vendorSubmissions.length === 0 ? (
            <div className="quantix-scanner__vendor-empty">
              No vendor has submitted this part number yet.
            </div>
          ) : (
            <div className="quantix-scanner__vendor-list">
              {vendorSubmissions.map((vendor) => (
                <label
                  key={getVendorSubmissionId(vendor)}
                  className={`quantix-scanner__vendor-item ${selectedVendorSubmissionId === getVendorSubmissionId(vendor) ? 'quantix-scanner__vendor-item--selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="vendorSubmission"
                    value={getVendorSubmissionId(vendor)}
                    checked={selectedVendorSubmissionId === getVendorSubmissionId(vendor)}
                    onChange={() => setSelectedVendorSubmissionId(getVendorSubmissionId(vendor))}
                    className="quantix-scanner__vendor-radio"
                  />
                  <div>
                    <div className="quantix-scanner__vendor-name">{vendor.vendorName}</div>
                    <div className="quantix-scanner__vendor-meta">
                      {vendor.vendorCode ? `Vendor ID: ${vendor.vendorCode}` : 'Vendor ID: N/A'}
                    </div>
                    <div className="quantix-scanner__vendor-weight">
                      Overall Weight Recorded: {formatWeight(vendor.overallWeight ?? vendor.measuredWeight)}
                    </div>
                  </div>
                  <div className="quantix-scanner__vendor-stats">
                    <span>{vendor.scanCount} submission{vendor.scanCount === 1 ? '' : 's'}</span>
                    <span>{new Date(vendor.submittedAt).toLocaleString()}</span>
                  </div>
                </label>
              ))}
            </div>
          )}

          <button
            onClick={handleContinueToProductDetails}
            className="quantix-scanner__button--validate"
            disabled={vendorSubmissionsLoading || (vendorSubmissions.length > 0 && !selectedVendorSubmissionId)}
          >
            Continue to Product Details
          </button>
        </div>
      )}

      {scanResult && !showVendorReview && (
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
                  {!isNewProduct && <th>Overall Weight</th>}
                  {!isNewProduct && <th>Weight</th>}
                  {!isNewProduct && <th>Final Validation Status</th>}
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
                    <td>{scanResult.unitWeight * scanResult.totalCount}</td>
                  )}
                  {!isNewProduct && (
                    <td className={weight ? 'quantix-scanner__weight-value' : 'quantix-scanner__weight-placeholder'}>
                      {weight ? `${parseFloat(weight).toFixed(2)} kg` : '-'}
                    </td>
                  )}
                  {!isNewProduct && (
                    <td>
                      {validationResult?.finalValidationStatus ? (
                        <span className={`quantix-scanner__final-status quantix-scanner__final-status--${validationResult.finalValidationStatus}`}>
                          {getFinalValidationDisplay()}
                        </span>
                      ) : (
                        '-'
                      )}
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
                {selectedVendorSubmission && (
                  <div className="quantix-scanner__reference-weight">
                    <span>Cross-checking vendor weight</span>
                    <strong>{formatWeight(selectedVendorSubmission.overallWeight ?? selectedVendorSubmission.measuredWeight)}</strong>
                  </div>
                )}
                <div className="quantix-scanner__mode-buttons">
                  <button onClick={() => handleModeChange('manual')} className={`quantix-scanner__mode-btn ${connectionMode === 'manual' ? 'quantix-scanner__mode-btn--active' : ''}`}>Manual</button>
                  <button onClick={() => handleModeChange('bluetooth')} className={`quantix-scanner__mode-btn ${connectionMode === 'bluetooth' ? 'quantix-scanner__mode-btn--active' : ''}`}>Bluetooth</button>
                  <button onClick={() => handleModeChange('wifi')} className={`quantix-scanner__mode-btn ${connectionMode === 'wifi' ? 'quantix-scanner__mode-btn--active' : ''}`}>WiFi</button>
                </div>

                {connectionMode === 'manual' && (() => {
                  const live = getLiveWeightStatus();
                  const kind = live?.kind;
                  const diff = live?.displayDiff ?? 0;
                  const diffText = live ? (diff === 0 ? '0' : `${diff > 0 ? '+' : ''}${diff.toFixed(3)}`) : '';
                  const inputBorderClass = kind === 'match'
                    ? 'quantix-scanner__weight-input-wrapper--matched'
                    : kind === 'excess'
                      ? 'quantix-scanner__weight-input-wrapper--excess'
                      : kind === 'short'
                        ? 'quantix-scanner__weight-input-wrapper--short'
                        : '';

                  return (
                    <div className={`quantix-scanner__weight-input-wrapper ${inputBorderClass}`}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Weight in kg"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="quantix-scanner__weight-input"
                      />
                      {live ? (
                        <div className="quantix-scanner__weight-input-adornment">
                          {diffText}
                        </div>
                      ) : null}
                    </div>
                  );
                })()}

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
                <br></br>
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
           <br></br>
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
              <div className="quantix-scanner__validation-detail">
                Final Validation Status: {validationResult.finalValidationStatus === 'accepted' ? 'Accepted' : 'Rejected'}
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

