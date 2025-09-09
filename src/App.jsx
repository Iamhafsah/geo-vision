import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Aerial from './pages/Aerial'
import Satellite from './pages/Satellite'
import './App.css'
import Analysis from './pages/Analysis'
import Details from './pages/Details'
import Chart from './pages/Chart'
import ChangeDetection from './pages/ChangeDetection'


const App = () => {
  return (
    <Routes>
        <Route index element={<Home />} />
        <Route path='/aerial' element={<Aerial />} />
        <Route path='/satellite' element={<Satellite />} />
        <Route path='/change_detection' element={<ChangeDetection />} />
        
        <Route path="/analysis">
          <Route path="/analysis" element={<Analysis />} index/>
          <Route path=":id" element={<Details />}/>
          <Route path=":id/chart" element={<Chart />}/>
        </Route>
    </Routes>
  )
}

export default App