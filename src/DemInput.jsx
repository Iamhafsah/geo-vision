import React, { useState, useEffect } from 'react';

// The main DemInput component that handles file uploading and data display.
const DemInput = () => {
const [file, setFile] = useState(null);
  const [demDetails, setDemDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScriptLoaded, setIsScriptLoaded] = useState(false); // New state to track script loading

  // This hook dynamically loads the geotiff.js library and updates state.
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/geotiff@2.0.7/dist/geotiff.min.js"; // Corrected URL
    script.async = true;
    script.onload = () => {
      setIsScriptLoaded(true);
    };
    script.onerror = () => {
      setError('Failed to load the GeoTIFF library. Please check your internet connection.');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Handles the file input change event.
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDemDetails(null);
      setError('');
    }
  };

  // Processes the DEM or GeoTIFF file to extract header details.
  const processDemFile = async () => {
    if (!file) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const extension = file.name.split('.').pop().toLowerCase();

      if (extension === 'dem' || extension === 'asc') {
        // --- ASCII DEM Parsing Logic ---
        const reader = new FileReader();
        reader.onload = (e) => {
          const buffer = e.target.result;
          const headerText = new TextDecoder().decode(buffer.slice(0, 500));
          const lines = headerText.split('\n').map(line => line.trim()).filter(line => line);

          const details = {};
          let headerFound = false;

          lines.forEach(line => {
            const parts = line.split(/\s+/);
            if (parts.length >= 2) {
              const key = parts[0].toLowerCase();
              const value = parts.slice(1).join(' ').trim();
              if (['ncols', 'nrows', 'xllcorner', 'yllcorner', 'cellsize', 'nodata_value'].includes(key)) {
                details[key] = isNaN(parseFloat(value)) ? value : parseFloat(value);
                headerFound = true;
              }
            }
          });

          if (headerFound) {
            setDemDetails(details);
          } else {
            setError('Could not parse ASCII DEM file header. Please ensure it is a valid format.');
          }
          setLoading(false);
        };
        reader.readAsArrayBuffer(file);
      } else if (extension === 'tiff' || extension === 'tif') {
        // --- GeoTIFF Parsing Logic using geotiff.js ---
        // The check for window.GeoTIFF is now handled by the isScriptLoaded state
        const arrayBuffer = await file.arrayBuffer();
        const tiff = await window.GeoTIFF.fromArrayBuffer(arrayBuffer);
        const image = await tiff.getImage();

        const tags = image.getFileDirectory();
        
        const details = {};

        // Extract basic dimensions
        details.ncols = image.getWidth();
        details.nrows = image.getHeight();
        
        // Check for ModelTiepointTag
        const modelTiepointTag = tags.ModelTiepointTag;
        const modelPixelScaleTag = tags.ModelPixelScaleTag;
        const modelTransformationTag = tags.ModelTransformationTag;
        
        let georeferenced = false;

        if (modelTiepointTag && modelPixelScaleTag) {
          const [xTie, yTie, zTie, xWorld, yWorld, zWorld] = modelTiepointTag;
          const [xScale, yScale, zScale] = modelPixelScaleTag;
          
          details.xllcorner = xWorld;
          details.yllcorner = yWorld - (details.nrows * yScale);
          details.cellsize = xScale;
          georeferenced = true;
        } else if (modelTransformationTag) {
          // Handle the ModelTransformationTag case
          const transform = modelTransformationTag;
          const xScale = transform[0];
          const yScale = transform[5];
          const xllcorner = transform[3];
          const yllcorner = transform[7] + (details.nrows * yScale);
          
          details.xllcorner = xllcorner;
          details.yllcorner = yllcorner;
          details.cellsize = xScale;
          georeferenced = true;
        }

        if (georeferenced) {
          details.nodata_value = "N/A"; // NoData is not a standard header value for GeoTIFFs
          setDemDetails(details);
        } else {
          setError('GeoTIFF file is not georeferenced (missing a supported georeferencing tag).');
        }

        setLoading(false);

      } else {
        setError('Unsupported file format. Please upload a .dem, .asc, .tif, or .tiff file.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error processing file:', err);
      setError(`An error occurred while processing the file: ${err.message}`);
      setLoading(false);
    }
  };

  // Trigger the processing function only when a new file is selected AND the script is loaded.
  useEffect(() => {
    if (file && isScriptLoaded) {
      processDemFile();
    }
  }, [file, isScriptLoaded]);

  const handleClear = () => {
    setFile(null);
    setDemDetails(null);
    setError('');
    document.getElementById('fileInput').value = null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-xl border border-gray-200 transition-all duration-300 transform hover:scale-[1.01]">
        {/* Header section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">DEM & GeoTIFF Analyzer</h1>
          <p className="text-md text-gray-500">
            Upload a Digital Elevation Model (DEM) or GeoTIFF file to view its header details.
          </p>
        </div>

        {/* File input area */}
        <div className="flex items-center justify-center w-full mb-6">
          <label
            htmlFor="fileInput"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-10 h-10 mb-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-4-4v-1a4 4 0 014-4h4l4-4 4 4h4a4 4 0 014 4v1a4 4 0 01-4 4h-4l-4 4-4-4z"
                ></path>
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-400">DEM, ASCII Grid, GeoTIFF, etc.</p>
            </div>
            <input id="fileInput" type="file" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        {/* File information and details display */}
        {file && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Selected File</h3>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Name:</span> {file.name}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Size:</span> {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        {/* Loading and error messages */}
        {loading && (
          <div className="text-center p-4 text-gray-500">
            <svg
              className="animate-spin h-6 w-6 text-indigo-500 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="mt-2 text-sm">Analyzing file...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-4" role="alert">
            <p className="font-bold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Display parsed DEM details */}
        {demDetails && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">DEM Header Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              {Object.entries(demDetails).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="font-medium text-gray-500 uppercase tracking-wide text-xs">{key.replace('_', ' ')}:</span>
                  <span className="text-gray-900 font-mono text-base">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleClear}
            className="px-6 py-2 bg-slate-50 border border-gray-300 text-gray-700 rounded-full font-medium shadow-sm hover:bg-gray-100 transition-colors duration-200"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};


export default DemInput;
