import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts';
import { Globe } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';

const Chart = () => {
  
  const fallback = {
    aspect: { max: 358.88, min: 0.0 },
    curvature: { max: 518400000, mean: -144.92, min: -366120000 },
    elevation: { max: 656.0, mean: 399.55, min: 336.0, pixel_size: 0.000278, shape: [3601, 3601], std: 32.38 },
    slope: { max: 89.9996, mean: 86.70, min: 0.0, steep_areas_percentage: 96.35 }
  };

  const location = useLocation();
  const navigate = useNavigate();
  const terrain = location?.state?.terrain;
  const terrainData = terrain || fallback;

  // Process data for charts - include ALL attributes
  const chartData = useMemo(() => {
    const stats = [];
    
    Object.entries(terrainData).forEach(([key, values]) => {
      // Calculate mean if not provided (for aspect)
      let mean = values.mean;
      if (mean === undefined && values.max !== undefined && values.min !== undefined) {
        mean = (values.max + values.min) / 2;
      }
      
      if (mean !== undefined) {
        stats.push({
          attribute: key.charAt(0).toUpperCase() + key.slice(1),
          mean: mean,
          min: values.min || 0,
          max: values.max || 0,
          std: values.std || 0,
          range: (values.max || 0) - (values.min || 0)
        });
      }
    });

    return stats;
  }, [terrainData]);

  // Normalize data for radar chart (0-100 scale)
  const radarData = useMemo(() => {
    const normalized = [];
    
    Object.entries(terrainData).forEach(([key, values]) => {
      let normalizedValue;
      
      switch(key) {
        case 'elevation':
          // Use mean elevation, normalize to 0-100 based on typical elevation ranges
          normalizedValue = Math.min((values.mean / 2000) * 100, 100);
          break;
        case 'slope':
          // Use mean slope, normalize to 0-100 based on max possible slope (90°)
          normalizedValue = (values.mean / 90) * 100;
          break;
        case 'curvature':
          // Use absolute mean curvature, normalize based on typical ranges
          normalizedValue = Math.min(Math.abs(values.mean / 10000) * 100, 100);
          break;
        case 'aspect':
          // Use range of aspect values, normalize based on full circle (360°)
          normalizedValue = ((values.max - values.min) / 360) * 100;
          break;
        default:
          normalizedValue = 50;
      }
      
      normalized.push({
        attribute: key.charAt(0).toUpperCase() + key.slice(1),
        value: Math.round(normalizedValue * 100) / 100
      });
    });

    return normalized;
  }, [terrainData]);

  // Key metrics for summary cards
  const keyMetrics = useMemo(() => [
    {
      title: 'Mean Elevation',
      value: `${terrainData.elevation?.mean?.toFixed(1) || 0}m`,
      subtitle: `Range: ${terrainData.elevation?.min || 0}m - ${terrainData.elevation?.max || 0}m`,
      color: 'bg-blue-500'
    },
    {
      title: 'Mean Slope',
      value: `${terrainData.slope?.mean?.toFixed(1) || 0}°`,
      subtitle: `Steep areas: ${terrainData.slope?.steep_areas_percentage?.toFixed(1) || 0}%`,
      color: 'bg-green-500'
    },
    {
      title: 'Terrain Variation',
      value: `±${terrainData.elevation?.std?.toFixed(1) || 0}m`,
      subtitle: 'Elevation standard deviation',
      color: 'bg-purple-500'
    },
    {
      title: 'Data Resolution',
      value: `${terrainData.elevation?.shape?.[0] || 0}×${terrainData.elevation?.shape?.[1] || 0}`,
      subtitle: 'Grid dimensions',
      color: 'bg-orange-500'
    }
  ], [terrainData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl ">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <button onClick={() => navigate('/')} className="cursor-pointer w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center ">
                  <Globe className="h-6 w-6 text-white animate-spin" style={{ animationDuration: '10s' }} />
                </button>
                
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Geo-Vision</h1>
                  <p className="text-xs text-slate-600 font-medium tracking-wide">Terrain Intelligence • Change Detection • AI-Enhanced</p>
                </div>
              </div>
            </div> 
          </div>
        </header>

    <div className="mx-8 py-10 ">
        <div className="">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Terrain Analysis Dashboard</h1>
          <p className="text-gray-600">Topographical data visualization and analysis</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 ">
          {keyMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* coloured border */}
              <div className={`bg-blue-500 h-1`}/>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{metric.title}</h3>
                <p className="text-3xl font-bold text-gray-800 mb-1">{metric.value}</p>
                <p className="text-sm text-gray-600">{metric.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
            {/* Statistical Summary Bar Chart */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl text-slate-600 font-semibold mb-4">Statistical Summary</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="attribute" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      typeof value === 'number' ? value.toFixed(2) : value, 
                      name
                    ]}
                  />
                  <Bar dataKey="mean" fill="#3B82F6" name="Mean Value" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Terrain Profile Radar Chart */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl text-slate-600 font-semibold mb-4">Terrain Profile (Normalized)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="attribute" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="Terrain Characteristics"
                    dataKey="value"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.3}
                  />
                  <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Normalized Value']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Range Analysis */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl text-slate-600 font-semibold mb-4">Value Ranges</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="attribute" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [value.toFixed(2), name]} />
                  <Bar dataKey="range" fill="#10B981" name="Value Range" />
                </BarChart> 
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chart;