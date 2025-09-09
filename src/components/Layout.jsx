import Logo from '../assets/dsa.png';
import GeoImage from '../assets/map.png';
import AFRDI from '../assets/AFRDI.svg';

const Layout = ({children}) => {
  return (
    <div className=' min-h-screen bg-cover bg-center bg-no-repeat ' style={{ backgroundImage: `url(${GeoImage})` }}>
      {/* Top bar */}
      <div className="">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-3 rounded-2xl 
        px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl ">
              {/* <Satellite className="h-6 w-6 text-white" /> */}
              <img src={Logo} alt="dsa logo" className="w-20" />
            </div>
            <div>
              <h1 className="text-white text-[36px] font-bold leading-tight">Geo-Vision</h1>
              <p className="text-white/70 text-[14px] ml-1"> Satellite Analytics • Real-time • AI-assisted</p>
            </div>
          </div>

          <div>
            <img src={AFRDI} alt="" className='w-[100px]' />
          </div>
        </div>
      </div>

      {children}
    </div>
  )
}

export default Layout