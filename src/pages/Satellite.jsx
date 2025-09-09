import { useState } from 'react';
import CustomFileInput from '../components/Input';
import axios from 'axios';
import { toast } from 'react-toastify';
// import Output from '../src/assets/output.jpg';

const Aerial = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [data, setData] = useState();
  const [statusData, setStatusData] = useState();
  const [resultData, setResultData] = useState();
  const [loading, setLoading] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(selectedFiles);

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
            toast('Data sent successfully', {type:'success'})
            setSelectedFiles([]);
        } catch (error) {
            console.error('Upload failed:', error);
            toast('Error sending data', {type:'error'})
        }
    }

    const getStatus = async () => {
        const id = data.analysis_id
        console.log(id);
        
        try {
            const response = await axios.get(`http://127.0.0.1:5000/api/analysis/${id}/status`);
            console.log('Status:', response.data);
            setStatusData(response.data);
        } catch (error) {
            console.error('Status check failed:', error);
        }
    }

    const getResult = async () => {
        const id = data.analysis_id
        console.log(id);

        try {
            const response = await axios.get(`http://127.0.0.1:5000/api/analysis/${id}/results`);
            console.log('Result:', response.data);
            // Handle the result data as needed
            setLoading(true);
           if(response?.data?.status == 'running'){
                toast('Analysis still running, please try again in a moment', {type:'info'})
                setLoading(false);
                return;
            } else {
                setResultData(response.data);
                toast('Analysis retrieved successfully', {type:'success'})
                console.log(resultData);
                setLoading(false);
            }
        } catch (error) {
            console.error('Result retrieval failed:', error);
            toast('Error retrieving data', {type:'error'})
        }
    }


  return (
    <div className="h-screen w-screen bg-gray-200 overflow-hidden text-black">
        <div className="flex justify-between gap-10 border-t border-black border-t-2 ">
            {/* left hand side */}
            <form className="bg-white border-r-2 border-gray-500 lg:w-[30vw] w-[30vw] min-h-screen px-8 pt-10 " onSubmit={handleSubmit}>
                <p className='font-bold pb-2 text-gray-800 text-[18px] uppercase '>Upload</p>
                <div className='flex flex-col items-center bg-white rounded-md border border-grey-300 border '>
                    <CustomFileInput
                        selectedFiles={selectedFiles}
                        setSelectedFiles={setSelectedFiles}
                    />
                </div>

                <div>
                    <p className='font-bold pb-2 text-gray-800 text-[2em] pt-5 uppercase'>Analysis</p>
                    
                    <div>
                        <label htmlFor="terrain" className='flex items-center gap-2 rounded-md py-[8px] border border-gray-800 text-gray-800 font-bold border-2 text-[1em]'>
                            <input type="checkbox" className='invisible' name="terrain" value="terrain" /> Terrain Analysis
                        </label>
                        <p className='text-gray-600 text-[14px] mt-2'>The terrain of the uploaded image will be analyzed. </p>

                        <button className='text-white/80 bg-gray-800 mt-10 w-full rounded-md py-3 mt-10 cursor-pointer'>Run Analysis</button>

                        {/* <button type='button' onClick={getStatus} className='text-white/80 bg-gray-800 mt-10 w-full rounded-md py-3 cursor-pointer'>Get Analysis Status</button> */}

                        {/* <label htmlFor="change" className='flex items-center gap-2 rounded-md py-3 border border-gray-800 mt-4 text-gray-800 font-bold border-2'>
                            <input type="checkbox" className='invisible' name="change" value="change" /> Change Detection
                        </label> */}
                    </div>
                </div>


            </form>

           {resultData && <div className='w-[45vw] mt-30'>
                {/* <img src={Output} alt="" /> */}
                <img src={`data:image/png;base64,${resultData?.visualization}`} alt="" />
            </div>}

            {/* right hand side */}
            <div className="bg-white border-l-2 border-gray-500 lg:w-[30vw] w-[30vw] min-h-screen px-8 pt-10">
                 <p className='font-bold pb-5 text-gray-800 text-[18px] uppercase'>Analysis Results</p>

                 <div className='flex flex-col justify-between h-[80vh]'>
                    <div>

                    <div className={`p-3  bg-white rounded-md min-h-[200px] border border-grey-300 border overflow-y-auto ${resultData ? 'h-[80vh]' : ''}`}>
                    <p className='font-bold text-gray-800 text-[18px] mb-2'>Summary</p>

                    <p className='text-gray-600 text-[14px] mt-2'>This analysis will provide the user with a detailed description of the terrain including its elevation, slope, and complexity.</p>

                    <button type='button' onClick={getResult} className='text-white/80 bg-gray-800 w-full rounded-md py-2 mt-4 cursor-pointer mb-2'>{ loading ? 'Retrieving result...' : 'Get Analysis Result'}</button>

                    {resultData && (
                        <div>
                    <p className=' text-gray-600 mt-5 font-bold'>Terrain Elevation</p>
                    <ul>
                        <li className='text-[14px] text-gray-600 mt-2 font-semibold'>
                            <p><span>Max Elevation:</span> <span>{resultData?.statistics?.elevation?.max}</span></p>
                        </li>
                        <li className='text-[14px] text-gray-600 font-semibold'>
                            <p><span>Min elevation:</span> <span>{resultData?.statistics?.elevation?.min}</span></p>
                        </li>
                        <li className='text-[14px] text-gray-600 font-semibold'>
                            <p><span>Mean elevation:</span> <span>{resultData?.statistics?.elevation?.mean}</span></p>
                        </li>
                    </ul>

                    <p className=' text-gray-600 mt-5 font-bold'>Terrain Slope</p>
                    <ul>
                        <li className='text-[14px] text-gray-600 mt-2 font-semibold'>
                            <p><span>Max slope:</span> <span>{resultData?.statistics?.slope?.max}</span></p>
                            <p><span>Min slope:</span> <span>{resultData?.statistics?.slope?.min}</span></p>
                            <p><span>Mean slope:</span> <span>{resultData?.statistics?.slope?.mean}</span></p>
                            <p><span>Steep Areas Percentage:</span> <span>{resultData?.statistics?.slope?.steep_areas_percentage}</span></p>
                        </li>
                    </ul>

                    <p className=' text-gray-600 mt-5 font-bold'>Terrain Curvature</p>
                    <ul>
                        <li className='text-[14px] text-gray-600 mt-2 font-semibold'>
                            <p><span>Curvature Max:</span> <span>{resultData?.statistics?.curvature?.max}</span></p>
                            <p><span>Curvature Min:</span> <span>{resultData?.statistics?.curvature?.min}</span></p>
                            <p><span>Curvature Mean:</span> <span>{resultData?.statistics?.curvature?.mean}</span></p>
                        </li>
                    </ul>
                    </div>
                    )}
                </div>
                    </div>

                    {/* <button className='text-white/80 bg-gray-800 mt-4 w-full rounded-md py-3 mt-10 cursor-pointer'>Export</button> */}
                 </div>
            </div>
        </div>
    </div>
  )
}

export default Aerial