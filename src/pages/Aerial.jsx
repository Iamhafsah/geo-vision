import { useState, useEffect, useRef } from 'react';
import { Upload, FileImage, Play, Activity, CheckCircle, Clock, AlertTriangle, BarChart3, Mountain, TrendingUp } from 'lucide-react';

// Mock CustomFileInput component
const CustomFileInput = ({ selectedFiles, setSelectedFiles }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors duration-200 rounded-lg p-8 text-center cursor-pointer bg-slate-50 hover:bg-blue-50"
      >
        <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <p className="text-slate-600 font-medium">Click to upload or drag and drop</p>
        <p className="text-sm text-slate-500 mt-2">Supported formats: PNG, JPG, TIFF, GeoTIFF</p>
        {selectedFiles.length > 0 && (
          <div className="mt-4 text-left">
            <p className="text-sm font-medium text-slate-700 mb-2">Selected files:</p>
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center text-sm text-slate-600 bg-white rounded px-3 py-2 mb-2">
                <FileImage className="h-4 w-4 mr-2 text-blue-500" />
                {file.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Mock toast function
const toast = (message, options) => {
  console.log(`Toast: ${message}`, options);
};

// Mock axios
const axios = {
  post: async (url, data, config) => {
    // Simulate API response
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      data: {
        analysis_id: 'analysis_' + Date.now(),
        status: 'uploaded',
        message: 'Files uploaded successfully'
      }
    };
  },
  get: async (url) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (url.includes('/status')) {
      return {
        data: {
          status: Math.random() > 0.3 ? 'completed' : 'running',
          progress: Math.floor(Math.random() * 100)
        }
      };
    } else {
      return {
        data: {
          status: 'completed',
          visualization: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          statistics: {
            elevation: {
              max: 316,
              min: 189,
              mean: 250.9189997131995
            },
            slope: {
              max: 89.99939022884836,
              min: 0,
              mean: 86.56739327221885,
              steep_areas_percentage: 96.20197142004663
            },
            curvature: {
              max: 0.45,
              min: -0.32,
              mean: 0.067
            }
          }
        }
      };
    }
  }
};

const Aerial = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [data, setData] = useState();
  const [statusData, setStatusData] = useState();
  const [resultData, setResultData] = useState();
  const [loading, setLoading] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('idle'); // idle, uploading, processing, completed, error
  const [progress, setProgress] = useState(0);
  const statusCheckInterval = useRef(null);

  const handleSubmit = async () => {
    console.log(selectedFiles);
    setAnalysisStatus('uploading');

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('file', file);
    });

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/analysis/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload successful:', response.data);
      setData(response.data);
      toast('Data sent successfully', {type:'success'});
      setSelectedFiles([]);
      setAnalysisStatus('processing');
      startStatusChecking(response.data.analysis_id);
    } catch (error) {
      console.error('Upload failed:', error);
      toast('Error sending data', {type:'error'});
      setAnalysisStatus('error');
    }
  };

  const startStatusChecking = (analysisId) => {
    statusCheckInterval.current = setInterval(async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/api/analysis/${analysisId}/status`);
        console.log('Status:', response.data);
        setStatusData(response.data);
        setProgress(response.data.progress || 0);
        
        if (response.data.status === 'completed') {
          setAnalysisStatus('completed');
          clearInterval(statusCheckInterval.current);
          // Automatically fetch results when completed
          getResult();
        } else if (response.data.status === 'error') {
          setAnalysisStatus('error');
          clearInterval(statusCheckInterval.current);
        }
      } catch (error) {
        console.error('Status check failed:', error);
      }
    }, 10000); // Check every 10 seconds
  };

  const getStatus = async () => {
    const id = data.analysis_id;
    console.log(id);
    
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/analysis/${id}/status`);
      console.log('Status:', response.data);
      setStatusData(response.data);
    } catch (error) {
      console.error('Status check failed:', error);
    }
  };

  const getResult = async () => {
    const id = data.analysis_id;
    console.log(id);
    setLoading(true);

    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/analysis/${id}/results`);
      console.log('Result:', response.data);
      
      if(response?.data?.status == 'running'){
        toast('Analysis still running, please try again in a moment', {type:'info'});
        setLoading(false);
        return;
      } else {
        setResultData(response.data);
        toast('Analysis retrieved successfully', {type:'success'});
        console.log(response.data);
        setLoading(false);
        setAnalysisStatus('completed');
      }
    } catch (error) {
      console.error('Result retrieval failed:', error);
      toast('Error retrieving data', {type:'error'});
      setLoading(false);
      setAnalysisStatus('error');
    }
  };

  useEffect(() => {
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, []);

  const getStatusIcon = () => {
    switch (analysisStatus) {
      case 'uploading':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'processing':
        return <Activity className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <BarChart3 className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusText = () => {
    switch (analysisStatus) {
      case 'uploading':
        return 'Uploading files...';
      case 'processing':
        return `Processing analysis... ${progress}%`;
      case 'completed':
        return 'Analysis completed';
      case 'error':
        return 'Analysis failed';
      default:
        return 'Ready to analyze';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Mountain className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-slate-900">TerrainScope</h1>
              <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">v2.1</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              {getStatusIcon()}
              <span className="text-slate-600">{getStatusText()}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-900">Data Upload</h2>
              </div>
              <p className="text-sm text-slate-500 mt-1">Upload aerial imagery for terrain analysis</p>
            </div>
            
            <div className="p-6 space-y-6">
              <CustomFileInput
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
              />

              {/* Analysis Configuration */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-900">Analysis Configuration</h3>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="hidden" />
                    <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <span className="font-medium text-slate-900">Terrain Analysis</span>
                      <p className="text-sm text-slate-600">Comprehensive elevation, slope, and curvature analysis</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Progress Bar */}
              {analysisStatus === 'processing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Processing...</span>
                    <span className="text-slate-900 font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <button 
                onClick={handleSubmit}
                disabled={selectedFiles.length === 0 || analysisStatus === 'processing' || analysisStatus === 'uploading'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>
                  {analysisStatus === 'uploading' ? 'Uploading...' : 
                   analysisStatus === 'processing' ? 'Processing...' : 
                   'Run Analysis'}
                </span>
              </button>
            </div>
          </div>

          {/* Visualization Panel */}
          {resultData && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Analysis Visualization</h2>
                <p className="text-sm text-slate-500 mt-1">Interactive terrain analysis results</p>
              </div>
              <div className="p-6">
                <div className="bg-slate-50 rounded-lg overflow-hidden">
                  <img 
                    src={`data:image/png;base64,${resultData?.visualization}`} 
                    alt="Terrain Analysis Visualization"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Results Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-900">Analysis Results</h2>
              </div>
              <p className="text-sm text-slate-500 mt-1">Detailed terrain statistics and metrics</p>
            </div>

            <div className="p-6 space-y-6">
              {!resultData ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Ready for Analysis</h3>
                  <p className="text-slate-500 text-sm mb-6">Upload imagery and run terrain analysis to view detailed statistics including elevation, slope, and complexity metrics.</p>
                  
                  {analysisStatus === 'completed' && (
                    <button 
                      onClick={getResult}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-slate-300"
                    >
                      {loading ? 'Retrieving...' : 'Get Results'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Elevation Stats */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                      <Mountain className="h-4 w-4 mr-2 text-green-600" />
                      Terrain Elevation
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Maximum</span>
                        <span className="font-mono text-sm font-medium">{resultData?.statistics?.elevation?.max}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Minimum</span>
                        <span className="font-mono text-sm font-medium">{resultData?.statistics?.elevation?.min}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Mean</span>
                        <span className="font-mono text-sm font-medium">{Number(resultData?.statistics?.elevation?.mean).toFixed(2)}m</span>
                      </div>
                    </div>
                  </div>

                  {/* Slope Stats */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-orange-600" />
                      Terrain Slope
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Maximum</span>
                        <span className="font-mono text-sm font-medium">{Number(resultData?.statistics?.slope?.max).toFixed(2)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Minimum</span>
                        <span className="font-mono text-sm font-medium">{Number(resultData?.statistics?.slope?.min).toFixed(2)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Mean</span>
                        <span className="font-mono text-sm font-medium">{Number(resultData?.statistics?.slope?.mean).toFixed(2)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Steep Areas</span>
                        <span className="font-mono text-sm font-medium">{Number(resultData?.statistics?.slope?.steep_areas_percentage).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Curvature Stats */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                      <Activity className="h-4 w-4 mr-2 text-purple-600" />
                      Terrain Curvature
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Maximum</span>
                        <span className="font-mono text-sm font-medium">{Number(resultData?.statistics?.curvature?.max).toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Minimum</span>
                        <span className="font-mono text-sm font-medium">{Number(resultData?.statistics?.curvature?.min).toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Mean</span>
                        <span className="font-mono text-sm font-medium">{Number(resultData?.statistics?.curvature?.mean).toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Aerial;