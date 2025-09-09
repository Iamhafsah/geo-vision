import { Upload, FileImage } from 'lucide-react';
import { useRef } from 'react';

// CustomInput component
const CustomInput = ({ selectedFiles, setSelectedFiles }) => {
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
        className="border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors duration-200 rounded-lg px-8 py-3 text-center cursor-pointer bg-slate-50 hover:bg-blue-50"
      >
        <Upload className="mx-auto scale-[1.2] text-slate-400 mb-4" />
        <p className="text-slate-600 font-medium">Click to upload</p>
        <p className="text-sm text-slate-500 mt-2">Supported formats: PNG, JPG, TIFF, GeoTIFF</p>
        {selectedFiles.length > 0 && (
          <div className=" text-left">
            <p className="text-sm font-medium text-slate-700 mb-2">Selected file:</p>
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center text-sm text-slate-600 bg-white rounded px-3 py-2 ">
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

export default CustomInput;