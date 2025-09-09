from flask import Flask, request, jsonify, send_file, send_from_directory
from werkzeug.utils import secure_filename
import numpy as np
import rasterio
from rasterio.mask import mask
from shapely.geometry import box
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')
import os
import uuid
import base64
import io
from io import BytesIO 
import warnings
warnings.filterwarnings('ignore')
import json
import traceback
import sys
import threading
import time
from flask_cors import CORS
import re
from rasterio.windows import from_bounds
from rasterio.warp import reproject, calculate_default_transform, Resampling
from rasterio.crs import CRS
import glob
import tempfile
import shutil
from rasterio import plot

# --- Flask App Configuration ---
app = Flask(__name__)
CORS(app)

# Common configuration for both APIs
UPLOAD_FOLDER = os.path.join(tempfile.gettempdir(), 'uploads')
RESULTS_FOLDER = os.path.join(tempfile.gettempdir(), 'results')
OUTPUT_FOLDER = os.path.join(tempfile.gettempdir(), 'output')
ALLOWED_EXTENSIONS = {'tif', 'tiff', 'img', 'asc', 'png', 'jpg', 'jpeg', 'jp2'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['RESULTS_FOLDER'] = RESULTS_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024 * 1024  # 1GB max file size

# Global storage for analysis job status and results
analysis_jobs = {}

class TerrainAnalyzer:
    def __init__(self, dem_path, clip_bounds=None):
        self.dem_path = dem_path
        self.elevation = None
        self.metadata = None
        self.pixel_size = None
        self.clip_bounds = clip_bounds
        self.original_transform = None
        self.clipped_transform = None
        self.slope = None
        self.aspect = None
        self.hillshade = None
        self.curvature = None
    
    def load_dem(self):
        try:
            with rasterio.open(self.dem_path) as src:
                self.original_transform = src.transform
                max_pixels = 10000 * 10000
                total_pixels = src.width * src.height
                downsample_factor = 1
                if total_pixels > max_pixels:
                    downsample_factor = int(np.sqrt(total_pixels / max_pixels)) + 1
                if self.clip_bounds:
                    min_x, min_y, max_x, max_y = self.clip_bounds
                    bbox_geom = box(min_x, min_y, max_x, max_y)
                    clipped_data, clipped_transform = mask(src, [bbox_geom], crop=True)
                    if downsample_factor > 1:
                        clipped_data = clipped_data[0][::downsample_factor, ::downsample_factor]
                        new_transform = rasterio.transform.from_bounds(
                            min_x, min_y, max_x, max_y,
                            clipped_data.shape[1], clipped_data.shape[0]
                        )
                        self.clipped_transform = new_transform
                    else:
                        clipped_data = clipped_data[0]
                        self.clipped_transform = clipped_transform
                    self.elevation = clipped_data.astype(np.float64)
                    self.metadata = src.meta.copy()
                    self.metadata.update({
                        'height': self.elevation.shape[0],
                        'width': self.elevation.shape[1],
                        'transform': self.clipped_transform
                    })
                else:
                    if downsample_factor > 1:
                        self.elevation = src.read(
                            1, 
                            out_shape=(
                                src.height // downsample_factor,
                                src.width // downsample_factor
                            ),
                            resampling=rasterio.enums.Resampling.average
                        ).astype(np.float64)
                        self.clipped_transform = rasterio.transform.from_bounds(
                            *src.bounds,
                            self.elevation.shape[1],
                            self.elevation.shape[0]
                        )
                    else:
                        self.elevation = src.read(1).astype(np.float64)
                        self.clipped_transform = src.transform
                    self.metadata = src.meta.copy()
                    self.metadata.update({
                        'height': self.elevation.shape[0],
                        'width': self.elevation.shape[1],
                        'transform': self.clipped_transform
                    })
                transform = self.clipped_transform
                self.pixel_size = abs(transform[0])
                if src.nodata is not None:
                    self.elevation[self.elevation == src.nodata] = np.nan
                return True
        except Exception:
            return False

    def calculate_slope(self, units='degrees'):
        if self.elevation is None: return None
        dy, dx = np.gradient(self.elevation, self.pixel_size, self.pixel_size)
        slope_rad = np.arctan(np.sqrt(dx**2 + dy**2))
        if units == 'degrees': self.slope = np.degrees(slope_rad)
        elif units == 'percent': self.slope = np.tan(slope_rad) * 100
        else: self.slope = slope_rad
        return self.slope
    
    def calculate_aspect(self, units='degrees'):
        if self.elevation is None: return None
        dy, dx = np.gradient(self.elevation, self.pixel_size, self.pixel_size)
        aspect_rad = np.arctan2(-dy, dx)
        if units == 'degrees':
            self.aspect = np.degrees(aspect_rad)
            self.aspect = (self.aspect + 360) % 360
        else:
            self.aspect = aspect_rad
            self.aspect = (self.aspect + 2*np.pi) % (2*np.pi)
        return self.aspect
    
    def calculate_hillshade(self, azimuth=315, altitude=45):
        if self.slope is None or self.aspect is None:
            self.calculate_slope('radians')
            self.calculate_aspect('radians')
        azimuth_rad = np.radians(azimuth)
        altitude_rad = np.radians(altitude)
        self.hillshade = (np.sin(altitude_rad) * np.cos(self.slope) +
                          np.cos(altitude_rad) * np.sin(self.slope) *
                          np.cos(azimuth_rad - self.aspect))
        self.hillshade = np.clip(self.hillshade * 255, 0, 255).astype(np.uint8)
        return self.hillshade
    
    def calculate_curvature(self):
        if self.elevation is None: return None
        zy, zx = np.gradient(self.elevation, self.pixel_size, self.pixel_size)
        zyy, zyx = np.gradient(zy, self.pixel_size, self.pixel_size)
        zxy, zxx = np.gradient(zx, self.pixel_size, self.pixel_size)
        self.curvature = zxx + zyy
        return self.curvature
        
    def generate_visualization(self):        
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Terrain Analysis Results', fontsize=24, fontweight='bold')
        if self.clipped_transform:
            extent = rasterio.transform.array_bounds(
                self.elevation.shape[0], self.elevation.shape[1], self.clipped_transform
            )
        else:
            extent = None
        if self.elevation is not None:
            im1 = axes[0, 0].imshow(self.elevation, cmap='terrain', extent=extent)
            axes[0, 0].set_title('Digital Elevation Model', fontsize=20, fontweight='bold')
            axes[0, 0].set_xlabel('Longitude', fontsize=16, fontweight='bold')
            axes[0, 0].set_ylabel('Latitude', fontsize=16, fontweight='bold')
            axes[0, 0].tick_params(axis='both', which='major', labelsize=14)
            cbar1 = plt.colorbar(im1, ax=axes[0, 0])
            cbar1.set_label('Elevation (m)', fontsize=16, fontweight='bold')
            cbar1.ax.tick_params(labelsize=14)
        if self.slope is not None:
            im2 = axes[0, 1].imshow(self.slope, cmap='YlOrRd', extent=extent)
            axes[0, 1].set_title('Slope (degrees)', fontsize=20, fontweight='bold')
            axes[0, 1].set_xlabel('Longitude', fontsize=16, fontweight='bold')
            axes[0, 1].set_ylabel('Latitude', fontsize=16, fontweight='bold')
            axes[0, 1].tick_params(axis='both', which='major', labelsize=14)
            cbar2 = plt.colorbar(im2, ax=axes[0, 1])
            cbar2.set_label('Degrees', fontsize=16, fontweight='bold')
            cbar2.ax.tick_params(labelsize=14)
        if self.aspect is not None:
            im3 = axes[1, 0].imshow(self.aspect, cmap='hsv', extent=extent)
            axes[1, 0].set_title('Aspect (degrees)', fontsize=20, fontweight='bold')
            axes[1, 0].set_xlabel('Longitude', fontsize=16, fontweight='bold')
            axes[1, 0].set_ylabel('Latitude', fontsize=16, fontweight='bold')
            axes[1, 0].tick_params(axis='both', which='major', labelsize=14)
            cbar3 = plt.colorbar(im3, ax=axes[1, 0])
            cbar3.set_label('Degrees', fontsize=16, fontweight='bold')
            cbar3.ax.tick_params(labelsize=14)
        if self.hillshade is not None:
            axes[1, 1].imshow(self.hillshade, cmap='gray', extent=extent)
            axes[1, 1].set_title('Hillshade', fontsize=20, fontweight='bold')
            axes[1, 1].set_xlabel('Longitude', fontsize=16, fontweight='bold')
            axes[1, 1].set_ylabel('Latitude', fontsize=16, fontweight='bold')
            axes[1, 1].tick_params(axis='both', which='major', labelsize=14)
        plt.tight_layout()
        img_buffer = BytesIO()
        plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
        plt.close()
        
        return img_base64
    
    def get_statistics(self):
        stats = {}
        if self.elevation is not None:
            stats['elevation'] = {
                'min': float(np.nanmin(self.elevation)), 'max': float(np.nanmax(self.elevation)),
                'mean': float(np.nanmean(self.elevation)), 'std': float(np.nanstd(self.elevation)),
                'shape': self.elevation.shape, 'pixel_size': float(self.pixel_size)
            }
        if self.slope is not None:
            stats['slope'] = {
                'min': float(np.nanmin(self.slope)), 'max': float(np.nanmax(self.slope)),
                'mean': float(np.nanmean(self.slope)),
                'steep_areas_percentage': float(np.sum(self.slope > 30) / self.slope.size * 100)
            }
        if self.aspect is not None:
            stats['aspect'] = {'min': float(np.nanmin(self.aspect)), 'max': float(np.nanmax(self.aspect))}
        if self.curvature is not None:
            stats['curvature'] = {
                'min': float(np.nanmin(self.curvature)), 'max': float(np.nanmax(self.curvature)),
                'mean': float(np.nanmean(self.curvature))
            }
        return stats

def allowed_file(filename):
    """Check if file has an allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def perform_full_analysis(analysis_id, file_path, clip_bounds):
    """Encapsulates the entire analysis workflow"""
    try:
        analysis_jobs[analysis_id]['status'] = 'running'
        
        analyzer = TerrainAnalyzer(file_path, clip_bounds)
        if not analyzer.load_dem():
            raise Exception("Failed to load DEM file.")
            
        analyzer.calculate_slope()
        analyzer.calculate_aspect()
        analyzer.calculate_hillshade()
        analyzer.calculate_curvature()
        
        visualization = analyzer.generate_visualization()
        statistics = analyzer.get_statistics()
        
        os.remove(file_path)

        analysis_jobs[analysis_id]['results'] = {
            'statistics': statistics,
            'visualization': visualization
        }
        analysis_jobs[analysis_id]['status'] = 'completed'
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Analysis failed for {analysis_id}: {e}\n{error_trace}", file=sys.stderr)
        analysis_jobs[analysis_id]['status'] = 'failed'
        analysis_jobs[analysis_id]['error'] = str(e)

def perform_analysis_in_thread(analysis_id, file_path, clip_bounds):
    """Starts a new thread for the analysis"""
    analysis_thread = threading.Thread(target=perform_full_analysis, args=(analysis_id, file_path, clip_bounds))
    analysis_thread.daemon = True
    analysis_thread.start()

# --- NDBI Specific Functions 
TARGET_CRS = 'EPSG:4326'
lon_min, lat_min = 4.4, 7.7
lon_max, lat_max = 4.6, 7.9

def extract_year_from_jp2_filename(filename):
    try:
        date_match = re.search(r'(\d{8})', filename)
        if date_match:
            date_str = date_match.group(1)
            year = date_str[:4]
            return year
        
        year_match = re.search(r'(20\d{2})', filename)
        if year_match:
            return year_match.group(1)
        
        from datetime import datetime
        return str(datetime.now().year)
    except:
        from datetime import datetime
        return str(datetime.now().year)

def get_band_and_window_jp2(jp2_file_path, src_crs, lon_min, lat_min, lon_max, lat_max):
    try:
        with rasterio.open(jp2_file_path, driver='JP2OpenJPEG') as band:
            dst_crs = band.crs
            xs_proj, ys_proj = rasterio.warp.transform(src_crs, dst_crs, [lon_min, lon_max], [lat_min, lat_max])
            proj_minx = min(xs_proj)
            proj_miny = min(ys_proj)
            proj_maxx = max(xs_proj)
            proj_maxy = max(ys_proj)
            window = from_bounds(proj_minx, proj_miny, proj_maxx, proj_maxy, band.transform)
            return band, window
    except rasterio.errors.RasterioIOError as e:
        print(f"Error opening JP2 file {jp2_file_path}: {e}")
        return None, None

def get_paired_bands(upload_folder):
    b11_files = glob.glob(os.path.join(upload_folder, '*_B11_*.jp2'))
    b8a_files = glob.glob(os.path.join(upload_folder, '*_B8A_*.jp2'))
    
    pairs = []
    
    for b11_file in b11_files:
        b11_basename = os.path.basename(b11_file)
        scene_id = re.sub(r'_B11_.*\.jp2$', '', b11_basename)
        
        for b8a_file in b8a_files:
            b8a_basename = os.path.basename(b8a_file)
            if scene_id in b8a_basename:
                year = extract_year_from_jp2_filename(b11_basename)
                pairs.append({
                    'b11_file': b11_file,
                    'b8a_file': b8a_file,
                    'year': year,
                    'scene_id': scene_id
                })
                break
    return pairs

def calculate_ndbi(swir_data, nir_data):
    np.seterr(divide='ignore', invalid='ignore')
    ndbi = (swir_data.astype(float) - nir_data.astype(float)) / (swir_data.astype(float) + nir_data.astype(float))
    np.seterr(divide='warn', invalid='warn')
    return ndbi

def save_ndbi_raster(ndbi_data, output_path, year, transform, width, height, crs):
    output_filename = os.path.join(output_path, f'NDBI_{year}.tif')
    
    profile = {
        'driver': 'GTiff',
        'width': width,
        'height': height,
        'count': 1,
        'crs': crs,
        'transform': transform,
        'dtype': 'float32'
    }

    with rasterio.open(output_filename, 'w', **profile) as dst:
        dst.write(ndbi_data.astype('float32'), 1)
    
    return output_filename

def reproject_raster(source_path, dest_path, dest_crs):
    with rasterio.open(source_path) as src:
        transform, width, height = calculate_default_transform(
            src.crs, dest_crs, src.width, src.height, *src.bounds
        )
        kwargs = src.meta.copy()
        kwargs.update({
            'crs': dest_crs,
            'transform': transform,
            'width': width,
            'height': height,
            'driver': 'GTiff'
        })
        with rasterio.open(dest_path, 'w', **kwargs) as dst:
            reproject(
                source=rasterio.band(src, 1),
                destination=rasterio.band(dst, 1),
                src_transform=src.transform,
                src_crs=src.crs,
                dst_transform=transform,
                dst_crs=dest_crs,
                resampling=Resampling.bilinear
            )
    return dest_path

# --- API Endpoints ---
@app.route('/')
def index():
    return jsonify({
        'name': 'Combined Terrain & NDBI Analysis API', 'version': '1.0.0',
        'endpoints': {
            'POST /api/analysis/upload': 'Upload DEM and run terrain analysis',
            'GET /api/analysis/<id>/status': 'Get terrain analysis status',
            'GET /api/analysis/<id>/results': 'Get terrain analysis results',
            'POST /ndbi/upload': 'Upload Sentinel-2 bands and calculate NDBI',
            'GET /ndbi/<year>': 'Download NDBI GeoTIFF for a given year',
            'GET /ndbi/plot': 'Get a combined NDBI plot as a Base64 image',
            'POST /ndbi/upload-multiple': 'Alternative endpoint for NDBI upload'
        }
    })

# --- Terrain Analysis Endpoints ---
@app.route('/api/analysis/upload', methods=['POST'])
def upload_terrain():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file'}), 400
    
    clip_bounds = None
    if 'clip_bounds' in request.form:
        try:
            bounds_str = request.form['clip_bounds']
            clip_bounds = [float(x.strip()) for x in bounds_str.split(',')]
            if len(clip_bounds) != 4:
                raise ValueError
        except ValueError:
            return jsonify({'error': 'Invalid clip_bounds format. Use: min_x,min_y,max_x,max_y'}), 400
    
    analysis_id = str(uuid.uuid4())
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    try:
        file.save(file_path)
    except Exception as e:
        return jsonify({'error': f'Failed to save file: {str(e)}'}), 500

    analysis_jobs[analysis_id] = {'status': 'pending'}
    
    perform_analysis_in_thread(analysis_id, file_path, clip_bounds)
    
    return jsonify({
        'analysis_id': analysis_id,
        'status': 'accepted',
        'message': 'Analysis request accepted. Use the status endpoint to check progress.'
    }), 200

@app.route('/api/analysis/<analysis_id>/status', methods=['GET'])
def get_analysis_status(analysis_id):
    if analysis_id not in analysis_jobs:
        return jsonify({'error': 'Analysis not found'}), 404
        
    job_status = analysis_jobs[analysis_id]['status']
    response = {'analysis_id': analysis_id, 'status': job_status}
    
    if job_status == 'failed':
        response['error'] = analysis_jobs[analysis_id].get('error', 'Unknown error')
        
    return jsonify(response), 200

@app.route('/api/analysis/<analysis_id>/results', methods=['GET'])
def get_analysis_results(analysis_id):
    if analysis_id not in analysis_jobs:
        return jsonify({'error': 'Analysis not found'}), 404
        
    job = analysis_jobs[analysis_id]
    
    if job['status'] != 'completed':
        return jsonify({
            'analysis_id': analysis_id,
            'status': job['status'],
            'message': 'Analysis is not yet complete. Check the status endpoint.'
        }), 202
    
    results = job['results']
    return jsonify(results), 200

# --- NDBI Endpoints ---
@app.route('/ndbi/upload', methods=['POST'])
def process_data():
    if 'file' not in request.files and 'files' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    if 'files' in request.files:
        files = request.files.getlist('files')
    else:
        files = [request.files['file']]

    if not files or all(file.filename == '' for file in files):
        return jsonify({"error": "No selected files"}), 400

    try:
        uploaded_files = []
        for file in files:
            if file and file.filename.endswith('.jp2'):
                temp_file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
                file.save(temp_file_path)
                uploaded_files.append(temp_file_path)

        if not uploaded_files:
            return jsonify({"error": "No valid JP2 files uploaded"}), 400

        pairs = get_paired_bands(app.config['UPLOAD_FOLDER'])
        
        if not pairs:
            b11_files = [f for f in uploaded_files if '_B11_' in f]
            b8a_files = [f for f in uploaded_files if '_B8A_' in f]
            
            if not b11_files and not b8a_files:
                return jsonify({"error": "No B11 (SWIR) or B8A (NIR) bands found. NDBI requires these specific bands."}), 400
            
            if len(b11_files) == 1 and len(b8a_files) == 1:
                year = extract_year_from_jp2_filename(os.path.basename(b11_files[0]))
                pairs = [{
                    'b11_file': b11_files[0],
                    'b8a_file': b8a_files[0],
                    'year': year,
                    'scene_id': f'manual_{year}'
                }]
            else:
                return jsonify({"error": "Please upload matching B11 and B8A band files for NDBI calculation."}), 400

        processed_years = []
        src_crs = CRS.from_epsg(4326)

        for pair in pairs:
            b11_file = pair['b11_file']
            b8a_file = pair['b8a_file']
            year = pair['year']

            with rasterio.open(b11_file, driver='JP2OpenJPEG') as band11:
                with rasterio.open(b8a_file, driver='JP2OpenJPEG') as band8a:
                    dst_crs = band11.crs
                    xs_proj, ys_proj = rasterio.warp.transform(src_crs, dst_crs, [lon_min, lon_max], [lat_min, lat_max])
                    
                    proj_minx = min(xs_proj)
                    proj_miny = min(ys_proj)
                    proj_maxx = max(xs_proj)
                    proj_maxy = max(ys_proj)

                    window = from_bounds(proj_minx, proj_miny, proj_maxx, proj_maxy, band11.transform)

                    if window.width <= 0 or window.height <= 0:
                        continue

                    band11_data = band11.read(1, window=window)
                    band8a_data = band8a.read(1, window=window)
                    
                    ndbi_data = calculate_ndbi(band11_data, band8a_data)
                    
                    subset_transform = band11.window_transform(window)

                    ndbi_raster_path = save_ndbi_raster(
                        ndbi_data=ndbi_data,
                        output_path=app.config['OUTPUT_FOLDER'],
                        year=year,
                        transform=subset_transform,
                        width=window.width,
                        height=window.height,
                        crs=band11.crs
                    )

                    reprojected_ndbi_path = os.path.join(app.config['OUTPUT_FOLDER'], f'Reprojected_NDBI_{year}.tif')
                    reproject_raster(ndbi_raster_path, reprojected_ndbi_path, TARGET_CRS)
                    
                    processed_years.append(year)

        if processed_years:
            return jsonify({
                "message": f"Processing complete for years: {', '.join(processed_years)}.",
                "processed_years": processed_years,
                "download_urls": [f"{request.host_url}ndbi/{year}" for year in processed_years]
            }), 200
        else:
            return jsonify({"error": "No valid band pairs could be processed"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        for file_path in uploaded_files:
            if os.path.exists(file_path):
                os.remove(file_path)

@app.route('/ndbi/<year>', methods=['GET'])
def get_ndbi_file(year):
    filename = f'Reprojected_NDBI_{year}.tif'
    file_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    
    if os.path.exists(file_path):
        return send_from_directory(app.config['OUTPUT_FOLDER'], filename, as_attachment=True, mimetype='image/tiff')
    else:
        return jsonify({"error": "File not found."}), 404

@app.route('/ndbi/plot', methods=['GET'])
def plot_all_ndbi_data():
    ndbi_data_list = []
    
    file_paths = sorted(glob.glob(os.path.join(app.config['OUTPUT_FOLDER'], 'Reprojected_NDBI_*.tif')))
    
    if not file_paths:
        return jsonify({"error": "No NDBI files found to plot. Please upload and process data first."}), 404
        
    for file_path in file_paths:
        try:
            year_str = os.path.basename(file_path).split('_')[2].split('.')[0]
            ndbi_data_list.append({'year': year_str, 'reprojected_path': file_path})
        except IndexError:
            continue

    if not ndbi_data_list:
        return jsonify({"error": "No valid NDBI files found to plot."}), 404

    num_images = len(ndbi_data_list)
    cols = min(num_images, 3)
    rows = (num_images + cols - 1) // cols
    
    fig, axes = plt.subplots(rows, cols, figsize=(cols * 6, rows * 6), squeeze=False)
    axes = axes.flatten()

    for i, data in enumerate(ndbi_data_list):
        year = data['year']
        reprojected_path = data['reprojected_path']
        
        with rasterio.open(reprojected_path) as src:
            img_plot = plot.show(src, ax=axes[i], title=f'NDBI {year}', cmap='viridis')
            axes[i].set_xlabel("Longitude")
            axes[i].set_ylabel("Latitude")
            axes[i].tick_params(axis='x', rotation=45)
            if img_plot and hasattr(img_plot, 'get_images') and img_plot.get_images():
                cbar = fig.colorbar(img_plot.get_images()[0], ax=axes[i], orientation='vertical', shrink=0.75)
                cbar.set_label('NDBI Value')

    for i in range(num_images, len(axes)):
        axes[i].set_visible(False)

    plt.tight_layout(rect=[0, 0.03, 1, 0.95])
    fig.suptitle('Annual NDBI Composites', fontsize=16)

    img_bytes = io.BytesIO()
    plt.savefig(img_bytes, format='png', dpi=300)
    plt.close(fig)
    img_bytes.seek(0)
    
    base64_image = base64.b64encode(img_bytes.read()).decode('utf-8')

    return jsonify({"image": base64_image, "message": "Plot generated successfully."})

@app.route('/ndbi/upload-multiple', methods=['POST'])
def upload_multiple_files():
    if 'files' not in request.files:
        return jsonify({"error": "No files in the request"}), 400

    files = request.files.getlist('files')
    
    if not files or all(file.filename == '' for file in files):
        return jsonify({"error": "No files selected"}), 400

    return process_data()

if __name__ == '__main__':
    print("Starting Flask API")
    app.run(debug=True, host='0.0.0.0', port=5000)