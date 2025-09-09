const downloadBase64Image = (base64String, filename = 'terrain-analysis') => {
  try {
    // Extract base64 data and mime type
    const [header, data] = base64String.includes(',') 
      ? base64String.split(',') 
      : ['data:image/png;base64', base64String];
    
    const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png';
    const extension = mimeType.split('/')[1] || 'png';
    
    // Convert to blob
    const byteChars = atob(data);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteArray[i] = byteChars.charCodeAt(i);
    }
    
    const blob = new Blob([byteArray], { type: mimeType });
    
    // Download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    return false;
  }
};

export default downloadBase64Image;