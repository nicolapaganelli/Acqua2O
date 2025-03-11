// App component for Displater - Image processor for Displate
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Container, Typography, Paper, CircularProgress, List, ListItem, ListItemIcon, ListItemText, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';

function App() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [originalFile, setOriginalFile] = useState(null);
  const [fixableIssues, setFixableIssues] = useState([]);
  const [showFixDialog, setShowFixDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState('image/jpeg');
  const [processedBlob, setProcessedBlob] = useState(null);

  const processImage = async (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Determine image orientation
        const isVertical = img.height > img.width;
        
        // Set target dimensions and ratio based on orientation
        const EXACT_RATIO = 1.4; // Exactly 1.4:1 ratio
        const targetDimensions = isVertical ? {
          width: 2989,
          height: Math.round(2989 * EXACT_RATIO),
          ratio: EXACT_RATIO
        } : {
          width: Math.round(2989 * EXACT_RATIO),
          height: 2989,
          ratio: EXACT_RATIO
        };

        // Initialize dimensions for cropping
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.width;
        let sourceHeight = img.height;

        // Always crop to exact 1.4 ratio
        if (isVertical) {
          // For vertical images, width is the base
          sourceWidth = img.width;
          sourceHeight = Math.round(sourceWidth * EXACT_RATIO);
          if (sourceHeight > img.height) {
            // If too tall, use height as base instead
            sourceHeight = img.height;
            sourceWidth = Math.round(sourceHeight / EXACT_RATIO);
            sourceX = Math.floor((img.width - sourceWidth) / 2);
          } else {
            sourceY = Math.floor((img.height - sourceHeight) / 2);
          }
        } else {
          // For horizontal images, height is the base
          sourceHeight = img.height;
          sourceWidth = Math.round(sourceHeight * EXACT_RATIO);
          if (sourceWidth > img.width) {
            // If too wide, use width as base instead
            sourceWidth = img.width;
            sourceHeight = Math.round(sourceWidth / EXACT_RATIO);
            sourceY = Math.floor((img.height - sourceHeight) / 2);
          } else {
            sourceX = Math.floor((img.width - sourceWidth) / 2);
          }
        }

        // Calculate scale to meet minimum dimensions
        const minWidth = isVertical ? 2989 : 4184;
        const minHeight = isVertical ? 4184 : 2989;
        const scaleX = minWidth / sourceWidth;
        const scaleY = minHeight / sourceHeight;
        const scale = Math.max(scaleX, scaleY);

        // Set final dimensions
        const finalWidth = Math.round(sourceWidth * scale);
        const finalHeight = Math.round(sourceHeight * scale);

        // Verify final ratio is exactly 1.4
        const finalRatio = isVertical ? 
          finalHeight / finalWidth : 
          finalWidth / finalHeight;
        console.log('Final ratio:', finalRatio);

        // Set canvas size
        canvas.width = finalWidth;
        canvas.height = finalHeight;

        // Configure canvas for high-quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw the image
        ctx.drawImage(
          img,
          sourceX, sourceY,
          sourceWidth, sourceHeight,
          0, 0,
          finalWidth, finalHeight
        );

        // Convert to blob with appropriate quality settings
        const quality = file.type === 'image/jpeg' ? 0.95 : undefined;
        canvas.toBlob((blob) => {
          resolve({
            blob,
            width: finalWidth,
            height: finalHeight,
            ratio: finalRatio.toFixed(2),
            orientation: isVertical ? 'vertical' : 'horizontal'
          });
        }, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const checkImageRequirements = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const errors = [];
      const fixable = [];
      
      // Check file format
      const validFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
      if (!validFormats.includes(file.type)) {
        errors.push('Invalid format. Please use JPG, PNG, WEBp, or AVIF format.');
      }

      img.onload = () => {
        const isVertical = img.height > img.width;
        const EXACT_RATIO = 1.4;
        const minWidth = isVertical ? 2989 : 4184;
        const minHeight = isVertical ? 4184 : 2989;

        // Check dimensions
        if (img.width < minWidth || img.height < minHeight) {
          errors.push(
            `Image is too small. Minimum size for ${isVertical ? 'vertical' : 'horizontal'} images is ` +
            `${minWidth}x${minHeight}px. Current size is ${img.width}x${img.height}px.`
          );
          fixable.push('dimensions');
        }

        // Check ratio
        const currentRatio = isVertical ? 
          img.height / img.width : 
          img.width / img.height;

        if (Math.abs(currentRatio - EXACT_RATIO) > 0.01) {
          errors.push(
            `Image ratio must be exactly ${isVertical ? '1.4:1' : '1:1.4'} ` +
            `(${minWidth}x${minHeight}px or equivalent) for ${isVertical ? 'vertical' : 'horizontal'} images.`
          );
          fixable.push('ratio');
        }

        resolve({
          width: img.width,
          height: img.height,
          ratio: currentRatio.toFixed(2),
          orientation: isVertical ? 'vertical' : 'horizontal',
          errors,
          fixable
        });
      };

      img.onerror = () => {
        errors.push('Failed to load image.');
        resolve({ errors, fixable: [] });
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFix = async () => {
    setProcessing(true);
    try {
      const processed = await processImage(originalFile);
      const processedFile = new File([processed.blob], originalFile.name, {
        type: originalFile.type
      });

      setProcessedBlob(processed.blob);

      const imageInfo = {
        name: processedFile.name,
        size: Math.round(processedFile.size / 1024) + ' KB',
        type: processedFile.type,
        width: Math.round(processed.width) + 'px',
        height: Math.round(processed.height) + 'px',
        ratio: processed.ratio,
        orientation: processed.orientation
      };

      setResult(imageInfo);
      setErrors([]);
      setPreviewUrl(URL.createObjectURL(processed.blob));
    } catch (error) {
      console.error('Error processing image:', error);
      setErrors(['Failed to process image.']);
    }
    setShowFixDialog(false);
    setProcessing(false);
  };

  const handleDownload = async () => {
    if (!processedBlob) return;

    try {
      // Convert to selected format if different from current
      const canvas = document.createElement('canvas');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // Configure canvas for high-quality output
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Clear any default background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the image
        ctx.drawImage(img, 0, 0);

        // Get file extension from format
        const formatToExt = {
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp'
        };

        // Use appropriate quality settings for each format
        const quality = downloadFormat === 'image/jpeg' ? 0.95 : undefined;
        
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `processed_image.${formatToExt[downloadFormat]}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, downloadFormat, quality);
      };

      img.src = previewUrl;
    } catch (error) {
      console.error('Error downloading image:', error);
      setErrors(['Failed to download image.']);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.avif']
    },
    onDrop: async (acceptedFiles) => {
      setProcessing(true);
      setErrors([]);
      setFixableIssues([]);
      setPreviewUrl(null);
      try {
        const file = acceptedFiles[0];
        setOriginalFile(file);
        const checkResult = await checkImageRequirements(file);
        
        const imageInfo = {
          name: file.name,
          size: Math.round(file.size / 1024) + ' KB',
          type: file.type,
          width: checkResult.width + 'px',
          height: checkResult.height + 'px',
          ratio: checkResult.ratio,
          orientation: checkResult.orientation
        };

        setResult(imageInfo);
        if (checkResult.errors.length > 0) {
          setErrors(checkResult.errors);
          if (checkResult.fixable.length > 0) {
            setFixableIssues(checkResult.fixable);
            setPreviewUrl(URL.createObjectURL(file));
            setShowFixDialog(true);
          }
        }
      } catch (error) {
        console.error('Error processing image:', error);
        setErrors(['Failed to process image.']);
      }
      setProcessing(false);
    }
  });

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h2" component="h1" gutterBottom align="center">
        The Displater v0.2
      </Typography>
      
      <Typography variant="h4" gutterBottom>
        Make your picture ready to print on Displate
      </Typography>

      <List>
        <ListItem>
          <ListItemIcon>
            <CheckCircleIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Upload only high-quality images in JPG, PNG, WEBp, or AVIF format."
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <CheckCircleIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="The file size should be at least 2900 x 4060 px in a 1.4:1 ratio."
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <CheckCircleIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Go for 300 DPI (or more) in RGB mode."
          />
        </ListItem>
      </List>

      <Paper
        {...getRootProps()}
        sx={{
          mt: 4,
          p: 4,
          textAlign: 'center',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          cursor: 'pointer'
        }}
      >
        <input {...getInputProps()} />
        {processing ? (
          <CircularProgress />
        ) : (
          <Typography>
            {isDragActive
              ? "Drop the image here..."
              : "Drag 'n' drop an image here, or click to select one"}
          </Typography>
        )}
      </Paper>

      {errors.length > 0 && (
        <Box mt={4}>
          {errors.map((error, index) => (
            <Alert 
              key={index} 
              severity="error" 
              icon={<CancelIcon />}
              sx={{ mb: 1 }}
            >
              {error}
            </Alert>
          ))}
        </Box>
      )}

      {result && errors.length === 0 && (
        <Box mt={4}>
          <Alert severity="success" icon={<CheckCircleIcon />}>
            Image meets all requirements!
          </Alert>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Image Details:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary={`Name: ${result.name}`} />
            </ListItem>
            <ListItem>
              <ListItemText primary={`Dimensions: ${result.width} × ${result.height}`} />
            </ListItem>
            <ListItem>
              <ListItemText primary={`Aspect Ratio: ${result.ratio}`} />
            </ListItem>
            <ListItem>
              <ListItemText primary={`Orientation: ${result.orientation}`} />
            </ListItem>
            <ListItem>
              <ListItemText primary={`Size: ${result.size}`} />
            </ListItem>
            <ListItem>
              <ListItemText primary={`Type: ${result.type}`} />
            </ListItem>
          </List>
          <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="format-label">Format</InputLabel>
              <Select
                labelId="format-label"
                value={downloadFormat}
                label="Format"
                onChange={(e) => setDownloadFormat(e.target.value)}
              >
                <MenuItem value="image/jpeg">JPG</MenuItem>
                <MenuItem value="image/png">PNG</MenuItem>
                <MenuItem value="image/webp">WEBP</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
            >
              Download
            </Button>
          </Box>
        </Box>
      )}

      {previewUrl && (
        <Box mt={4} sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Image Preview:
          </Typography>
          <Box
            component="img"
            src={previewUrl}
            alt="Preview"
            sx={{
              maxWidth: '100%',
              height: 'auto',
              maxHeight: '500px',
              objectFit: 'contain'
            }}
          />
        </Box>
      )}

      <Dialog open={showFixDialog} onClose={() => setShowFixDialog(false)}>
        <DialogTitle>Fix Image Issues</DialogTitle>
        <DialogContent>
          <Typography>
            I can automatically fix the following issues:
            <List>
              {fixableIssues.includes('dimensions') && (
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Upscale image to meet minimum dimensions" />
                </ListItem>
              )}
              {fixableIssues.includes('ratio') && (
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Crop image to achieve correct aspect ratio" />
                </ListItem>
              )}
            </List>
            Would you like me to fix these issues?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFixDialog(false)}>Cancel</Button>
          <Button onClick={handleFix} variant="contained" color="primary">
            Fix Issues
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default App; 