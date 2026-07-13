import React, { useState, useEffect } from "react";

export const StorageBiometricsTab: React.FC = () => {
  // CloudStorage State
  const [storageKey, setStorageKey] = useState<string>("favorite_theme");
  const [storageValue, setStorageValue] = useState<string>("Dark Sci-Fi");
  const [storedItems, setStoredItems] = useState<Record<string, string>>({});
  const [storageStatus, setStorageStatus] = useState<string>("");

  // Biometrics State
  const [bioAvailable, setBioAvailable] = useState<boolean>(false);
  const [bioType, setBioType] = useState<string>("unknown");
  const [bioGranted, setBioGranted] = useState<boolean>(false);
  const [authStatus, setAuthStatus] = useState<string>("");

  const webApp = window.Telegram?.WebApp;
  const cloudStorage = webApp?.CloudStorage;
  const biometricManager = webApp?.BiometricManager;

  useEffect(() => {
    refreshCloudKeys();

    if (biometricManager) {
      biometricManager.init(() => {
        setBioAvailable(biometricManager.isBiometricAvailable);
        setBioType(biometricManager.biometricType);
        setBioGranted(biometricManager.isAccessGranted);
      });
    }
  }, []);

  const refreshCloudKeys = () => {
    if (!cloudStorage) {
      setStorageStatus("CloudStorage not supported in current environment.");
      return;
    }
    cloudStorage.getKeys((err, keys) => {
      if (err) {
        setStorageStatus(`Error loading keys: ${err}`);
      } else if (keys && keys.length > 0) {
        cloudStorage.getItems(keys, (err2, values) => {
          if (!err2 && values) setStoredItems(values);
        });
      } else {
        setStoredItems({});
      }
    });
  };

  const handleSaveCloud = () => {
    if (!cloudStorage || !storageKey.trim()) return;
    setStorageStatus("Saving...");
    cloudStorage.setItem(storageKey.trim(), storageValue, (err, success) => {
      if (err) {
        setStorageStatus(`Error: ${err}`);
      } else if (success) {
        setStorageStatus(`Saved "${storageKey}" to Telegram CloudStorage!`);
        webApp?.HapticFeedback?.notificationOccurred("success");
        refreshCloudKeys();
      }
    });
  };

  const handleDeleteCloud = (key: string) => {
    if (!cloudStorage) return;
    cloudStorage.removeItem(key, (err, success) => {
      if (success) {
        webApp?.HapticFeedback?.impactOccurred("medium");
        refreshCloudKeys();
      } else if (err) {
        setStorageStatus(`Delete error: ${err}`);
      }
    });
  };

  const handleRequestBioAccess = () => {
    if (!biometricManager) {
      setAuthStatus("BiometricManager SDK not supported in this environment.");
      return;
    }
    biometricManager.requestAccess({ reason: "Protect your sensitive Oneseco configurations" }, (granted) => {
      setBioGranted(granted);
      setAuthStatus(granted ? "Biometric access granted by device!" : "Access denied by user.");
    });
  };

  const handleAuthenticateBio = () => {
    if (!biometricManager) {
      setAuthStatus("Biometrics not available.");
      return;
    }
    setAuthStatus("Requesting biometric scan...");
    biometricManager.authenticate({ reason: "Confirm FaceID / TouchID identity" }, (isAuth, token) => {
      if (isAuth) {
        setAuthStatus(`Identity verified successfully! Token: ${token || "OK"}`);
        webApp?.HapticFeedback?.notificationOccurred("success");
      } else {
        setAuthStatus("Biometric authentication failed.");
        webApp?.HapticFeedback?.notificationOccurred("error");
      }
    });
  };

  return (
    <div className="tab-pane">
      <section className="card storage-card">
        <div className="card-header-icon">
          <span>☁️</span>
          <div>
            <h2>Telegram CloudStorage</h2>
            <p className="description">Persistent key-value data stored directly in Telegram's cloud across all user devices.</p>
          </div>
        </div>

        <div className="storage-form">
          <input
            type="text"
            placeholder="Key (e.g. settings)"
            value={storageKey}
            onChange={(e) => setStorageKey(e.target.value)}
            className="select-input"
          />
          <input
            type="text"
            placeholder="Value"
            value={storageValue}
            onChange={(e) => setStorageValue(e.target.value)}
            className="select-input"
          />
          <button className="btn btn-primary" onClick={handleSaveCloud}>
            Save to Cloud
          </button>
        </div>

        {storageStatus && <p className="status-hint">{storageStatus}</p>}

        {Object.keys(storedItems).length > 0 && (
          <div className="storage-table">
            <h4>Stored Cloud Keys</h4>
            {Object.entries(storedItems).map(([k, v]) => (
              <div key={k} className="storage-row">
                <div>
                  <strong>{k}:</strong> <span>{v}</span>
                </div>
                <button className="btn-icon" onClick={() => handleDeleteCloud(k)}>
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card bio-card">
        <div className="card-header-icon">
          <span>🔒</span>
          <div>
            <h2>Biometric Authentication</h2>
            <p className="description">Integrate native Face ID / Touch ID security checks (`BiometricManager`).</p>
          </div>
        </div>

        <div className="card-body">
          <div className="info-row">
            <span className="label">Biometrics Available:</span>
            <span className="value">{bioAvailable ? `Yes (${bioType})` : "No / Emulator"}</span>
          </div>
          <div className="info-row">
            <span className="label">Access Granted:</span>
            <span className="value">{bioGranted ? "Yes" : "Not yet requested"}</span>
          </div>
        </div>

        <div className="bio-buttons">
          {!bioGranted ? (
            <button className="btn btn-secondary" onClick={handleRequestBioAccess}>
              Request Biometric Permission
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleAuthenticateBio}>
              Perform Biometric Scan
            </button>
          )}
        </div>

        {authStatus && <p className="status-hint">{authStatus}</p>}
      </section>
    </div>
  );
};
