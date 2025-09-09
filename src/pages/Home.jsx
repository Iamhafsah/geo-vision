import { ArrowRight, Globe } from 'lucide-react';
import { useNavigate } from 'react-router';

const GeoVisionLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden flex  flex-col ">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-blue-900/30 via-transparent to-transparent"></div>
        
        {/* Enhanced grid with depth */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.4) 1px, transparent 1px),
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px'
          }}
        />
        
        {/* Subtle light rays */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-gradient-to-l from-indigo-500/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Logo - Top Left */}
      <div className=" flex items-center space-x-3 z-10 mt-6 ml-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
          <Globe className="h-7 w-7 text-white animate-spin" style={{ animationDuration: '10s' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Geo-Vision</h1>
          <p className="text-xs text-blue-200 font-medium tracking-wide">Terrain Intelligence • Change Detection • AI-Enhanced</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="text-center max-w-5xl mx-auto px-8 z-10 mt-24">
        <div className="mb-8">
          <h1 className=" relative text-5xl md:text-6xl font-black text-white mb-6 leading-[1.2] tracking-tight">
            Transform Satellite Data into{' '}
            <span className="relative">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
                Actionable Intelligence
              </span>
            </span>
          </h1>
        </div>
        
        <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
          Run advanced analysis on Aerial or satellite imagery—all in one streamlined platform.
        </p>

        <div className='flex gap-4 w-full justify-center'>
          <button onClick={() => navigate('/analysis')} className="group text-blue-900 cursor-pointer bg-white px-7 py-3 rounded-2xl font-bold text-xl transition-all duration-500 flex items-center space-x-4  border border-blue-400/20">
            <span>Terrain Analysis</span>
            <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
          </button>

          <button onClick={() => navigate('/change_detection')} className="group text-blue-900 cursor-pointer bg-white px-7 py-3 rounded-2xl font-bold text-xl transition-all duration-500 flex items-center space-x-4 border border-blue-400/20">
            <span>Change Detection</span>
            <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeoVisionLanding;