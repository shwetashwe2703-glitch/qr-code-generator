import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import "./App.css";

function App() {
  const [type, setType] = useState("URL");
  const [value, setValue] = useState("");
  const [generatedValue, setGeneratedValue] = useState("");

  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiSecurity, setWifiSecurity] = useState("WPA");

  const [size, setSize] = useState(220);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [level, setLevel] = useState("M");
  const [margin, setMargin] = useState(true);
  const [error, setError] = useState("");

  const [history, setHistory] = useState([]);

  const types = ["URL", "TEXT", "EMAIL", "PHONE", "WIFI"];

  useEffect(() => {
    const savedHistory = localStorage.getItem("qrHistory");

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const getQRValue = () => {
    if (type === "EMAIL") {
      return `mailto:${value}`;
    }

    if (type === "PHONE") {
      return `tel:${value}`;
    }

    if (type === "WIFI") {
      return `WIFI:T:${wifiSecurity};S:${wifiName};P:${wifiPassword};;`;
    }

    return value;
  };

  const validateInput = () => {
    if (type === "WIFI") {
      if (!wifiName.trim()) {
        setError("Please enter the Wi-Fi name.");
        return false;
      }

      if (wifiSecurity !== "nopass" && !wifiPassword.trim()) {
        setError("Please enter the Wi-Fi password.");
        return false;
      }

      return true;
    }

    if (!value.trim()) {
      setError("Please enter something first.");
      return false;
    }

    if (type === "URL") {
      try {
        const url = new URL(value);

        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error();
        }
      } catch {
        setError("Please enter a valid URL, e.g. https://example.com");
        return false;
      }
    }

    if (type === "EMAIL") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(value)) {
        setError("Please enter a valid email address.");
        return false;
      }
    }

    if (type === "PHONE") {
      if (!/^[+0-9\s()-]{7,}$/.test(value)) {
        setError("Please enter a valid phone number.");
        return false;
      }
    }

    return true;
  };

  const saveToHistory = (qrValue) => {
    const newItem = {
      type: type,
      value: qrValue,
      label: type === "WIFI" ? wifiName : value,
      date: new Date().toLocaleString(),
    };

    const updatedHistory = [
      newItem,
      ...history.filter((item) => item.value !== qrValue),
    ].slice(0, 5);

    setHistory(updatedHistory);

    localStorage.setItem(
      "qrHistory",
      JSON.stringify(updatedHistory)
    );
  };

  const handleGenerate = () => {
    setError("");

    if (validateInput()) {
      const qrValue = getQRValue();

      setGeneratedValue(qrValue);
      saveToHistory(qrValue);
    } else {
      setGeneratedValue("");
    }
  };

  const downloadQR = () => {
    if (!generatedValue) return;

    const canvas = document.querySelector("#qr-code");

    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "qr-code.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const applyPreset = (preset) => {
    if (preset === "classic") {
      setFgColor("#000000");
      setBgColor("#ffffff");
      setLevel("M");
      setMargin(true);
    }

    if (preset === "dark") {
      setFgColor("#ffffff");
      setBgColor("#111111");
      setLevel("H");
      setMargin(true);
    }

    if (preset === "soft") {
      setFgColor("#5b21b6");
      setBgColor("#f5f3ff");
      setLevel("Q");
      setMargin(true);
    }
  };

  const changeType = (newType) => {
    setType(newType);
    setValue("");
    setGeneratedValue("");
    setError("");

    setWifiName("");
    setWifiPassword("");
    setWifiSecurity("WPA");
  };

  const loadHistoryItem = (item) => {
    setType(item.type);
    setGeneratedValue(item.value);
    setError("");

    if (item.type === "WIFI") {
      setWifiName(item.label);
    } else {
      setValue(item.label);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("qrHistory");
  };

  // Calculate simple contrast between foreground and background
  const getBrightness = (hex) => {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);

    return (r * 299 + g * 587 + b * 114) / 1000;
  };

  const contrastTooLow =
    Math.abs(getBrightness(fgColor) - getBrightness(bgColor)) < 80;

  const sizeTooSmall = size < 160;

  return (
    <div className="app">
      <header>
        <h1>QR SCANNER</h1>
        <p>Create. Customize. Connect.</p>
      </header>

      <main>
        <section className="controls">
          <h2>Create your QR</h2>

          <div className="type-buttons">
            {types.map((item) => (
              <button
                key={item}
                className={type === item ? "active" : ""}
                onClick={() => changeType(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {type === "WIFI" ? (
            <div className="wifi-fields">
              <label>Wi-Fi Name</label>

              <input
                type="text"
                value={wifiName}
                onChange={(e) => {
                  setWifiName(e.target.value);
                  setGeneratedValue("");
                  setError("");
                }}
                placeholder="My Wi-Fi"
              />

              <label>Security</label>

              <select
                value={wifiSecurity}
                onChange={(e) => {
                  setWifiSecurity(e.target.value);
                  setGeneratedValue("");
                  setError("");
                }}
              >
                <option value="WPA">WPA / WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">No Password</option>
              </select>

              {wifiSecurity !== "nopass" && (
                <>
                  <label>Password</label>

                  <input
                    type="password"
                    value={wifiPassword}
                    onChange={(e) => {
                      setWifiPassword(e.target.value);
                      setGeneratedValue("");
                      setError("");
                    }}
                    placeholder="Wi-Fi password"
                  />
                </>
              )}
            </div>
          ) : (
            <>
              <label>
                {type === "URL" && "Website URL"}
                {type === "TEXT" && "Plain Text"}
                {type === "EMAIL" && "Email Address"}
                {type === "PHONE" && "Phone Number"}
              </label>

              <textarea
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setGeneratedValue("");
                  setError("");
                }}
                placeholder={
                  type === "URL"
                    ? "https://example.com"
                    : type === "EMAIL"
                    ? "example@email.com"
                    : type === "PHONE"
                    ? "+91 9876543210"
                    : "Enter your text here..."
                }
              />
            </>
          )}

          {error && <p className="error">{error}</p>}

          <button className="generate" onClick={handleGenerate}>
            Generate QR
          </button>

          <h3>Customize</h3>

          <label>QR Size: {size}px</label>

          <input
            type="range"
            min="120"
            max="400"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />

          <label>Foreground Color</label>

          <input
            type="color"
            value={fgColor}
            onChange={(e) => setFgColor(e.target.value)}
          />

          <label>Background Color</label>

          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
          />

          <label>Error Correction</label>

          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="L">Low</option>
            <option value="M">Medium</option>
            <option value="Q">Quartile</option>
            <option value="H">High</option>
          </select>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={margin}
              onChange={(e) => setMargin(e.target.checked)}
            />
            Add margin
          </label>

          <h3>Presets</h3>

          <div className="presets">
            <button onClick={() => applyPreset("classic")}>
              Classic
            </button>

            <button onClick={() => applyPreset("dark")}>
              Dark
            </button>

            <button onClick={() => applyPreset("soft")}>
              Soft
            </button>
          </div>

          {generatedValue && (contrastTooLow || sizeTooSmall) && (
            <div className="scan-warning">
              <strong>⚠ Scan Reliability Warning</strong>

              {contrastTooLow && (
                <p>
                  The foreground and background colors have
                  low contrast. Consider using more contrasting
                  colors.
                </p>
              )}

              {sizeTooSmall && (
                <p>
                  The QR code is quite small. Increasing the
                  size may improve scanning reliability.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="preview">
          <h2>Preview</h2>

          <div
            className="qr-box"
            style={{ backgroundColor: bgColor }}
          >
            {generatedValue ? (
              <>
                <QRCodeCanvas
                  id="qr-code"
                  value={generatedValue}
                  size={size}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level={level}
                  includeMargin={margin}
                />

                <button
                  className="download-btn"
                  onClick={downloadQR}
                >
                  Download PNG
                </button>
              </>
            ) : (
              <p>Your QR code will appear here</p>
            )}
          </div>
        </section>
      </main>

      {history.length > 0 && (
        <section className="history">
          <div className="history-header">
            <h2>Recent QR Codes</h2>

            <button
              className="clear-history"
              onClick={clearHistory}
            >
              Clear
            </button>
          </div>

          <div className="history-list">
            {history.map((item, index) => (
              <button
                key={index}
                className="history-item"
                onClick={() => loadHistoryItem(item)}
              >
                <strong>{item.type}</strong>
                <span>{item.label}</span>
                <small>{item.date}</small>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;