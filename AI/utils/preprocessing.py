"""
Floor Plan Preprocessing Module

Preprocesses floor plan images for optimal detection:
- Grayscale conversion
- Contrast enhancement
- Binary thresholding
- Edge detection
- Noise removal
"""

import cv2
import numpy as np
from typing import Dict, Any


def remove_colored_annotations(image: np.ndarray) -> np.ndarray:
    """
    Remove colored annotations (like room highlights, markers) while keeping black lines.
    
    Args:
        image: BGR input image
        
    Returns:
        Image with colored annotations removed
    """
    # Convert to HSV
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    
    # Create mask for colored regions (high saturation)
    # This catches colored markers, highlights, etc.
    saturation = hsv[:, :, 1]
    colored_mask = saturation > 50
    
    # Replace colored regions with white
    result = image.copy()
    result[colored_mask] = [255, 255, 255]
    
    return result


def enhance_contrast(gray_image: np.ndarray, clip_limit: float = 2.0) -> np.ndarray:
    """
    Enhance contrast using CLAHE (Contrast Limited Adaptive Histogram Equalization).
    
    Args:
        gray_image: Grayscale input image
        clip_limit: CLAHE clip limit parameter
        
    Returns:
        Contrast-enhanced image
    """
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
    return clahe.apply(gray_image)


def thicken_walls(binary_image: np.ndarray, kernel_size: int = 2) -> np.ndarray:
    """
    Thicken wall lines using morphological dilation.
    
    Args:
        binary_image: Binary input image
        kernel_size: Dilation kernel size
        
    Returns:
        Image with thickened lines
    """
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, kernel_size))
    return cv2.dilate(binary_image, kernel, iterations=1)


def remove_noise(image: np.ndarray, kernel_size: int = 3) -> np.ndarray:
    """
    Remove small noise using median blur.
    
    Args:
        image: Input image
        kernel_size: Blur kernel size (must be odd)
        
    Returns:
        Denoised image
    """
    return cv2.medianBlur(image, kernel_size)


def normalize_lighting(gray_image: np.ndarray) -> np.ndarray:
    """
    Normalize uneven lighting using adaptive thresholding background subtraction.
    
    Args:
        gray_image: Grayscale input image
        
    Returns:
        Lighting-normalized image
    """
    # Estimate background using large blur
    background = cv2.GaussianBlur(gray_image, (99, 99), 0)
    
    # Subtract background
    normalized = cv2.subtract(background, gray_image)
    
    # Invert so lines are dark
    normalized = 255 - normalized
    
    return normalized


def preprocess_floor_plan(image: np.ndarray, options: Dict = None) -> Dict[str, Any]:
    """
    Main preprocessing pipeline for floor plan images.
    
    Args:
        image: BGR input image
        options: Preprocessing options dict with keys:
            - remove_colors: Remove colored annotations (default: True)
            - enhance: Apply contrast enhancement (default: True)
            - denoise: Apply noise removal (default: True)
            - thicken: Thicken wall lines (default: True)
            - normalize: Normalize lighting (default: True)
            
    Returns:
        Dict with:
            - original: Original image
            - gray: Grayscale image
            - binary: Binary thresholded image
            - edges: Edge-detected image
    """
    if options is None:
        options = {}
    
    # Get options with defaults
    remove_colors = options.get('remove_colors', True)
    enhance = options.get('enhance', True)
    denoise = options.get('denoise', True)
    thicken = options.get('thicken', True)
    normalize = options.get('normalize', True)
    
    result = {
        'original': image.copy()
    }
    
    # Step 1: Remove colored annotations
    if remove_colors:
        image = remove_colored_annotations(image)
    
    # Step 2: Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Step 3: Normalize lighting
    if normalize:
        gray = normalize_lighting(gray)
    
    # Step 4: Enhance contrast
    if enhance:
        gray = enhance_contrast(gray)
    
    # Step 5: Remove noise
    if denoise:
        gray = remove_noise(gray)
    
    result['gray'] = gray
    
    # Step 6: Binary thresholding
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Step 7: Thicken walls
    if thicken:
        binary = thicken_walls(binary, kernel_size=2)
    
    result['binary'] = binary
    
    # Step 8: Edge detection
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    result['edges'] = edges
    
    return result
