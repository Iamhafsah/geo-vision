import { Globe, SaveAll } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import downloadBase64Image from '../components/Download';

const Details = () => {

    const location = useLocation();
    const navigate = useNavigate();
    const details = location?.state?.details;

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
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
          </div> 
        </div>
      </header>

      <div className='overflow-y-auto pb-10 h-[90vh] w-full'>
        <div className='flex justify-end w-[80%] mt-6 mx-auto'>
          <button className='text-white bg-blue-500 px-4 py-2 rounded-md cursor-pointer shadow-md'
            onClick={() => downloadBase64Image(details?.visualization)}
            >
              <SaveAll className="h-7 w-7 inline-block mr-1"/> 
              <span className=' text-[16px] font-medium '>Download</span>
            </button>
        </div>

        <img 
        src={`data:image/png;base64,${details?.visualization}`}
        alt="Terrain Analysis Visualization"
        className="w-[80%] mx-auto mt-10 shadow-md border-2 border-slate-200 "
        />
      </div>
    </div>
  )
}

export default Details