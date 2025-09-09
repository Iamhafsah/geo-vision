import { useState, useEffect, useRef } from 'react';
import { Upload, Play, Activity, CheckCircle, Clock, AlertTriangle, BarChart3, Globe, TrendingUp, Mountain, Expand, LayoutDashboard } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import CustomInput from '../components/CustomInput';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router';

const Analysis = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [data, setData] = useState();
  const [resultData, setResultData] = useState();
  const [loading, setLoading] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('idle'); // idle, uploading, processing, completed, error
  const [progress, setProgress] = useState(0);
  const statusCheckInterval = useRef(null);
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams();

  const terrain_id = localStorage?.getItem('terrain_id')

  const analysis = searchParams.get('id');

  useEffect(() => {
    if (analysis && !resultData) {
      getResult(terrain_id);
    }
  }, [analysis]);


 const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(selectedFiles);
        setAnalysisStatus('uploading');

        const formData = new FormData();
        // Append files from CustomFileInput to formData
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
            console.log('Status:', response.data);
            setSelectedFiles([]);
            setAnalysisStatus('processing');
            startStatusChecking(response.data.analysis_id);
        } catch (error) {
            console.error('Upload failed:', error);
            setAnalysisStatus('error');
        }
    }

  const startStatusChecking = (analysisId) => {
    statusCheckInterval.current = setInterval(async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/api/analysis/${analysisId}/status`);
        // setStatusData(response.data);
        //increment progress for demo purposes
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));
        
        if (response.data.status === 'completed') {
          setAnalysisStatus('completed');
          clearInterval(statusCheckInterval.current);  
          setProgress(100);        
          // Automatically fetch results when completed
          getResult(analysisId);
          setProgress(0)
        } else if (response.data.status === 'error') {
          setAnalysisStatus('error');
          clearInterval(statusCheckInterval.current);
        }
      } catch (error) {
        console.error('Status check failed:', error);
      }
    }, 10000); // Check every 10 seconds
  };

  const getResult = async (id) => {
        try {
            const response = await axios.get(`http://127.0.0.1:5000/api/analysis/${id}/results`);
            // Handle the result data as needed
            setLoading(true);
            setResultData(response.data);
            // toast('Analysis retrieved successfully', {type:'success'})
            localStorage?.setItem('terrain_id', id)
            searchParams.set('id', id);
            setSearchParams(searchParams);

            setLoading(false);
        } catch (error) {
            console.error('Result retrieval failed:', error);
            toast('Error retrieving data', {type:'error'})
        }
    }

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
               <button onClick={() => navigate('/')}  className="cursor-pointer w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center ">
                <Globe className="h-6 w-6 text-white animate-spin" style={{ animationDuration: '10s' }} />
              </button>

              <div>
                <h1 className="text-xl font-bold text-slate-900">Geo-Vision</h1>
                <p className="text-xs text-slate-600 font-medium tracking-wide">Terrain Intelligence • Change Detection • AI-Enhanced</p>
              </div>
              
              {/* <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">v0.1</span> */}
            </div>
            <div className="flex items-center space-x-2 text-sm">
              {getStatusIcon()}
              <span className="text-slate-600">{getStatusText()}</span>
            </div>
          </div> 
        </div>
      </header>

      <div className='overflow-y-auto container min-w-[98vw]' style={{ height: 'calc(100vh - 64px)' }}>
      <div className="max-w-7xl min-w-7xl mx-auto p-6 pt-10">
        <div className="flex justify-center gap-6">
          {/* Upload Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 max-w-[30vw] min-w-[30vw]">
            <div className="p-6 pt-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-900">Data Upload</h2>
              </div>
              <p className="text-sm text-slate-500 mt-1">Upload data for analysis</p>
            </div>
            
            <div className="px-6 py-3 space-y-6">
              <CustomInput
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
              />

              {/* Analysis Configuration */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-900">Analysis Configuration</h3>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-2">
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 max-w-[30vw] min-w-[30vw]">
              <div className="p-6 pt-3 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Analysis Visualization</h2>
                <p className="text-sm text-slate-500 mt-1">Terrain analysis results</p>
              </div>
              <div className="p-6">
                <div className='flex justify-between pb-8 w-full ' >
                  <button onClick={() => navigate(`${terrain_id}/chart`,  { state: { terrain: resultData?.statistics} })} className='cursor-pointer flex gap-1 items-center'>
                    <LayoutDashboard className="h-5 w-5 text-slate-600" />
                    <span className='text-slate-600 text-sm font-medium'>View Dashboard</span>
                  </button>

                  <button onClick={() => navigate(`${terrain_id}`,  { state: { details: resultData} })} className='cursor-pointer flex gap-2 items-center'>
                    <Expand className="h-5 w-5 text-slate-600" />
                    <span className='text-slate-600 text-sm font-medium'>Expand</span>
                  </button>
                </div>

                <div className="bg-slate-50 rounded-lg border-1 border-slate-200 overflow-hidden shadow-md">
                  <img 
                    src={`data:image/png;base64,${resultData?.visualization}`}
                    alt="Terrain Analysis Visualization"
                    className="w-full h-auto "
                  />
                </div>
              </div>
            </div>
          )}

          {/* Results Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 max-w-[30vw] min-w-[30vw]">
            <div className="p-6 pt-3 border-b border-slate-200">
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
                  <p className="text-slate-500 text-sm mb-6">Upload data and run analysis to view detailed terrain statistics including elevation, slope, and complexity metrics.</p>
                  
                  {analysisStatus === 'completed' && (
                    <button 
                      onClick={() =>getResult(data.analysis_id)}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-slate-300"
                    >
                      {loading ? 'Retrieving...' : 'Get Result'}
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
                        <span className="font-mono text-sm font-medium text-slate-600">{resultData?.statistics?.elevation?.max}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Minimum</span>
                        <span className="font-mono text-sm font-medium text-slate-600">{resultData?.statistics?.elevation?.min}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Mean</span>
                        <span className="font-mono text-sm font-medium text-slate-600">{Number(resultData?.statistics?.elevation?.mean).toFixed(2)}m</span>
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
                        <span className="font-mono text-sm font-medium text-slate-600">{Number(resultData?.statistics?.slope?.max).toFixed(2)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Minimum</span>
                        <span className="font-mono text-sm font-medium text-slate-600">{Number(resultData?.statistics?.slope?.min).toFixed(2)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Mean</span>
                        <span className="font-mono text-sm font-medium text-slate-600">{Number(resultData?.statistics?.slope?.mean).toFixed(2)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Steep Areas</span>
                        <span className="font-mono text-sm font-medium text-slate-600">{Number(resultData?.statistics?.slope?.steep_areas_percentage).toFixed(1)}%</span>
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
                        <span className="font-mono text-sm font-medium text-slate-600">{Number(resultData?.statistics?.curvature?.max).toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Minimum</span>
                        <span className="font-mono text-sm font-medium text-slate-600">{Number(resultData?.statistics?.curvature?.min).toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Mean</span>
                        <span className="font-mono text-sm font-medium text-slate-600">{Number(resultData?.statistics?.curvature?.mean).toFixed(3)}</span>
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
    </div>
  );
};

export default Analysis;