import { useNavigate } from "react-router";
import Layout from '../components/Layout';


export default function Home() {
  const navigate = useNavigate()

  return (

    <Layout>
    <div className=" w-screen overflow-hidden "  >
      {/* Dim + grain overlay */}
      {/* <div className="absolute inset-0 bg-black/30" /> */}

      {/* Center content */}
      <main className="h-full w-full flex items-center justify-center mt-18 ">
        <div className="mx-auto max-w-6xl w-full px-4">
          <div className=" flex flex-col items-center">
            <h1 className="max-w-[800px] text-[36px] font-bold text-center mb-4">Transform Satellite Data into Actionable Intelligence</h1>
            <h2 className="text-center text-[18px] ">Run advance analysis with AI-enhanced satellite imagery—all in one streamlined platform.</h2>

            <div className="flex space-x-4 mt-10">
              <button onClick={() => navigate('/satellite')}className="bg-white/90 hover:bg-white/60 text-black text-[18px] rounded-md px-6 font-semibold py-3 w-[300px] cursor-pointer ">Get Started</button>
              {/* <button onClick={() => navigate('/aerial')} className="bg-white/90 hover:bg-white/60 text-black text-[18px] rounded-md px-6 font-semibold py-3 w-[300px] cursor-pointer ">Get Started</button>  */}
            </div>
          </div>


          {/* Footer strip */}
          <div className="absolute text-white/70 text-xs  text-center left-0  w-full -ml-6 bottom-4">
            <span>© {new Date().getFullYear()} DSA Geo-Vision</span>
          </div>
        </div>
      </main>
    </div>
    </Layout>
  );
}
