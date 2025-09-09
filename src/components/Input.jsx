import { useState, useRef } from 'react';
import { FaFileArrowUp } from 'react-icons/fa6';
import { MdClose } from 'react-icons/md';

export default function CustomFileInput({selectedFiles, setSelectedFiles}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
    // console.log(fileArray);
  };

  const handleFileSelect = (e) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-md mx-auto p-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        // multiple
        className="hidden"
        onChange={handleFileSelect}
        accept="*/*"
      />

      {/* Custom upload button */}
      {/* <button
        onClick={openFileDialog}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mb-4"
      >
        Upload
        Choose Files
      </button> */}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <p className="text-gray-600 font-medium mb-2">
          Click here to upload file
        </p>
        
      </div>

      {/* Selected files display */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-3">
            Selected File ({selectedFiles.length})
          </h3>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  {/* <File className="w-5 h-5 text-gray-500" /> */}
                  <FaFileArrowUp className='scale-[1.2]'/>
                  <div>
                    <p className="font-medium text-gray-900 text-sm truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                >
                  <MdClose className='cursor-pointer'/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}