import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [languages, setLanguages] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("eng");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("image"); // 'image' or 'text'
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const response = await fetch("http://localhost:7860/languages");
      const data = await response.json();
      setLanguages(data);
    } catch (error) {
      setError("Failed to load languages");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files).slice(0, 5);
      setSelectedImages(files);
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files).slice(0, 5);
    setSelectedImages(files);
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTextSubmit = async () => {
    if (!inputText.trim()) {
      setError("Please enter some text");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:7860/translate/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          target_lang: targetLanguage,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setResults([data]);
      } else {
        setError(data.error || "Translation failed");
      }
    } catch (error) {
      setError("Failed to translate text");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSubmit = async () => {
    if (selectedImages.length === 0) {
      setError("Please select at least one image");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    selectedImages.forEach((image) => {
      formData.append("images", image);
    });
    formData.append("source_lang", sourceLanguage);
    formData.append("target_lang", targetLanguage);

    try {
      const response = await fetch("http://localhost:7860/translate/image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setResults(data.results);
      } else {
        setError(data.error || "Translation failed");
      }
    } catch (error) {
      setError("Failed to translate images");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Text Translation</h1>

        <div className="mode-selector">
          <button
            className={mode === "image" ? "active" : ""}
            onClick={() => {
              setMode("image");
              setResults(null);
              setError(null);
            }}
          >
            Image Translation
          </button>
          <button
            className={mode === "text" ? "active" : ""}
            onClick={() => {
              setMode("text");
              setResults(null);
              setError(null);
            }}
          >
            Text Translation
          </button>
        </div>

        {mode === "image" ? (
          <div
            className={`image-section ${dragActive ? "drag-active" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="file-input"
              id="file-input"
            />
            <label htmlFor="file-input" className="file-input-label">
              {selectedImages.length === 0 ? (
                <div>
                  <p>Drag and drop images here or click to select</p>
                  <p className="file-input-hint">(Maximum 5 images)</p>
                </div>
              ) : (
                <p>Click to add more images</p>
              )}
            </label>
            {selectedImages.length > 0 && (
              <div className="image-preview">
                {selectedImages.map((image, index) => (
                  <div key={index} className="preview-container">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="preview-image"
                    />
                    <button
                      className="remove-image"
                      onClick={() => removeImage(index)}
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-section">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to translate..."
              className="text-input"
            />
            <div className="text-actions">
              <button
                className="clear-button"
                onClick={() => setInputText("")}
                disabled={!inputText.trim()}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="language-selection">
          {mode === "image" && (
            <div className="select-group">
              <label>Source Language:</label>
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
              >
                {Object.entries(languages).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="select-group">
            <label>Target Language:</label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
            >
              {Object.entries(languages).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={mode === "image" ? handleImageSubmit : handleTextSubmit}
          disabled={
            loading ||
            (mode === "image" ? selectedImages.length === 0 : !inputText.trim())
          }
          className={`submit-button ${loading ? "loading" : ""}`}
        >
          {loading ? "Translating..." : "Translate"}
        </button>

        {error && <div className="error-message">{error}</div>}

        {results && (
          <div className="results-section">
            {results.map((result, index) => (
              <div key={index} className="result-box">
                <div className="result-item">
                  <h3>Original Text:</h3>
                  <p>{result.original_text}</p>
                </div>
                <div className="result-item">
                  <h3>Translated Text:</h3>
                  <p>{result.translated_text}</p>
                </div>
                <button
                  className="copy-button"
                  onClick={() => {
                    navigator.clipboard.writeText(result.translated_text);
                  }}
                  title="Copy to clipboard"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
