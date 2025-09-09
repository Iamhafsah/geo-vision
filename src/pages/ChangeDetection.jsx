import { useState } from 'react';
import axios from 'axios';
import { Upload, FileImage, Download, AlertCircle, CheckCircle2, Loader2, Globe } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';

const NDSIProcessor = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [plotData, setPlotData] = useState(null);
  const [loadingPlot, setLoadingPlot] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

const navigate = useNavigate();

  const API_BASE = 'http://localhost:5000';

  const handleFileSelect = (event) => {
    // Convert FileList object to an array and set the state
    const selectedFiles = Array.from(event.target.files);
    setFiles(selectedFiles);
    setError('');
    setMessage('');
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select one or more files first');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    // Appended each file in the array to the FormData object
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(`${API_BASE}/ndbi/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const result = response.data;

      setMessage(result.message);
      setDownloadUrl(result.download_urls); // Made to handle array
      setUploading(false);
      toast('Data uploaded successfully', {type:'success'})
      // Auto-fetch plot after successful upload
      await fetchPlot();
    } catch (err) {
      if (err.response) {
        // The request was made and the server responded with a status code that falls out of the range of 2xx
        setError(err.response.data.error || 'Upload failed');
      } else if (err.request) {
        // The request was made but no response was received
        setError('Network error: No response from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('Error: ' + err.message);
      }
    } finally {
      setUploading(false);
    }
  };

  const fetchPlot = async () => {
    setLoadingPlot(true);
    setError('');
    setPlotData(null); 
    try {
      const response = await axios.get(`${API_BASE}/ndbi/plot`);
      const result = response.data;

      setPlotData(`data:image/png;base64,${result.image}`);
    } catch (err) {
      if (err.response) {
        setError(err.response.data.error || 'Failed to generate plot');
      } else {
        setError('Network error: Unable to fetch plot');
      }
    } finally {
      setLoadingPlot(false);
    }
  };

  const downloadPlot = () => {
    if (plotData) {
      const link = document.createElement('a');
      link.href = plotData;
      link.download = 'ndbi_plot.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-2">
      <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <button onClick={() => navigate('/')}  className="cursor-pointer w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center ">
                  <Globe className="h-6 w-6 text-white animate-spin" style={{ animationDuration: '10s' }} />
                </button>

                <div>
                  <h1 className="text-xl font-bold text-slate-900">Geo-Vision</h1>
                  <p className="text-xs text-slate-600 font-medium tracking-wide">Terrain Intelligence • Change Detection • AI-Enhanced</p>
                </div>
              </div>

              {message ? <div className="flex items-center">
                <CheckCircle2 className="text-green-600 mr-3" size={20} />
                <p className="text-green-800 font-medium text-sm">{message}</p>
              </div> : ''}
            </div> 
          </div>
        </header>

      <div className='overflow-y-auto h-[90vh] w-full'>
       <div className="text-center ">
          <p className="text-lg text-gray-800 pt-8 max-w-2xl mx-auto">
            Upload JP2 files to calculate and visualize the Normalized Difference Built-up Index in an area over a   period of time. 
          </p>
        </div>

      <div className="max-w-4xl mx-auto px-4 pt-8 flex gap-6">
        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 pb-8 mb-8 max-w-[35vw] min-w-[35vw]">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Upload className="mr-3 text-blue-600" size={24} />
            Upload Data
          </h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".jp2"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              multiple // Allow multiple files
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <FileImage className="text-blue-600" size={16} />
              </div>
              <p className="text-md font-medium text-gray-700 mb-1">
                Choose  JP2 files
              </p>
              <p className="text-gray-500">
                Select B11 and B8A band files
              </p>
            </label>
          </div>

          {files.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Selected files:
              </p>
              <ul className="list-disc list-inside text-sm text-blue-600">
                {files.map((file, index) => (
                  <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 w-full">
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading || loadingPlot}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-full mb-3 cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2" size={20} />
                  Process Data
                </>
              )}
            </button>
            
            <button
              onClick={fetchPlot}
              className="px-6 py-3 bg-green-600 text-white cursor-pointer rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center w-full justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={!plotData || loadingPlot || uploading}
            >
              {loadingPlot ? (
                <Loader2 className="animate-spin mr-2" size={20} />
              ) : (
                <FileImage className="mr-2" size={20} />
              )}
              {loadingPlot ? 'Generating Plot...' : 'Generate Plot'}
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className=" bg-white rounded-xl shadow-lg px-8 pt-8 max-w-[35vw] min-w-[35vw]">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            About NDBI & File Requirements
          </h3>
          <p className="text-gray-600 text-center leading-relaxed mb-4">
            The Normalized Difference Built-up Index (NDBI) is used to identify built-up areas 
            from satellite imagery. It uses the SWIR (Short Wave Infrared) and NIR (Near Infrared) 
            bands from Sentinel-2 data. Higher NDBI values typically indicate more built-up or 
            urban areas, while lower values represent natural vegetation or water bodies.
          </p>
          
          <div className=" gap-4">
            <div className="p-4 bg-green-50 rounded-lg mb-4 shadow-md">
              <p className="text-sm text-gray-700">
                <strong>Formula:</strong> NDBI = (SWIR - NIR) / (SWIR + NIR)
              </p>
              <p className="text-sm text-gray-700 mt-2">
                <strong>Bands used:</strong> B11 (SWIR - 1610nm) and B8A (NIR - 865nm)
              </p>
            </div>
            
            <div className="p-4 mb-8 bg-blue-50 rounded-lg shadow-md">
              <p className="text-sm font-medium text-blue-800 mb-2">File Requirements:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Upload **both** B11 and B8A band files from the same scene.</li>
                <li>• Files must be in JP2 format.</li>
                <li>• Files should be from a single, unzipped Sentinel-2 folder.</li>
                <li>• Example: `*_B11_20m.jp2` and `*_B8A_20m.jp2`</li>
              </ul>
            </div>

              {downloadUrl && (
              <div className="mt-6">
                {downloadUrl.map((url) => (
                  <a
                    key={url}
                    href={url}
                    className="inline-flex items-center text-green-700 hover:text-green-800 text-sm font-medium mr-4"
                  >
                    <Download className="mr-2" size={16} />
                    Download NDBI ({url.split('/').pop().replace('Reprojected_NDBI_', '').replace('.tif', '')})
                  </a>
                ))}
              </div>
            )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 mt-2">
            <div className="flex items-center">
              <AlertCircle className="text-red-600 mr-3" size={20} />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

          </div>
        </div>
      </div>



<div className='max-w-[75vw] mx-auto mt-8 '>
        {/* Plot Display */}
        {plotData && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                NDBI Visualization
              </h2>
              <button
                onClick={downloadPlot}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer transition-colors"
              >
                <Download className="mr-2" size={16} />
                Download Plot
              </button>
            </div>
            
            <div className="flex justify-center">
              <img
                src={plotData}
                alt="NDBI Plot"
                className="max-w-full h-auto rounded-lg shadow-md border"
              />
            </div>
          </div>
        )}
    </div>
    </div>
    </div>
  );
};

export default NDSIProcessor;