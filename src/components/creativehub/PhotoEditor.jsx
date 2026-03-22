import React, { useState, useRef } from 'react';
import { Edit2, Eraser, Undo2, Redo2, Trash2, Download, Send, UploadCloud, AlertCircle } from 'lucide-react';
import { geminiService } from '../../services/gemini';
import { BrandBanner } from './BrandBanner';
import { useUsage } from '../../hooks/useUsage';

export const PhotoEditor = () => {
  const [image, setImage] = useState(null);
  const [brushSize, setBrushSize] = useState(40);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const canvasRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const { isLimitReached } = useUsage();

  const saveState = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      setUndoStack(prev => [...prev.slice(-19), dataUrl]);
      setRedoStack([]);
    }
  };

  const handleUndo = () => {
    if (undoStack.length > 0 && canvasRef.current) {
      const currentState = canvasRef.current.toDataURL();
      setRedoStack(prev => [...prev, currentState]);
      
      const prevState = undoStack[undoStack.length - 1];
      setUndoStack(prev => prev.slice(0, -1));
      
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = prevState;
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        const img = new Image();
        img.onload = () => {
          if (canvasRef.current && drawCanvasRef.current) {
            const canvas = canvasRef.current;
            const drawCanvas = drawCanvasRef.current;
            canvas.width = img.width;
            canvas.height = img.height;
            drawCanvas.width = img.width;
            drawCanvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const dataUrl = re.target.result;
            const parts = dataUrl.split(',');
            setImage({
              base64: parts[1],
              mimeType: parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg',
              dataUrl
            });
            saveState();
          }
        };
        img.src = re.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e) => {
    if (!isDrawing || !drawCanvasRef.current) return;
    
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = drawCanvasRef.current?.getContext('2d');
    ctx?.beginPath();
  };

  const handleGenerate = async () => {
    if (!image || !prompt.trim()) return;
    setLoading(true);
    try {
      const currentImageBase64 = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      const resultUrl = await geminiService.generateImage(
        `Edit this image according to the prompt: ${prompt}. Maintain consistency.`,
        [{ data: currentImageBase64, mimeType: 'image/jpeg' }]
      );

      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
        
        const drawCtx = drawCanvasRef.current.getContext('2d');
        drawCtx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);
        
        saveState();
      };
      img.src = resultUrl;
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }} className="gradient-text">
          <Edit2 size={32} /> Edit & Perbaiki Foto
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Gunakan kuas untuk menandai area, lalu tulis instruksinya.</p>
      </div>

      <BrandBanner />

      <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
        {image && (
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '700px' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={handleUndo} disabled={undoStack.length === 0} className="icon-btn" style={{ opacity: undoStack.length === 0 ? 0.3 : 1 }}><Undo2 size={18} /></button>
              <button onClick={() => setImage(null)} className="icon-btn" style={{ color: 'var(--warning)' }}><Trash2 size={18} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Size: {brushSize}px</span>
              <input type="range" min="10" max="100" value={brushSize} onChange={(e) => setBrushSize(e.target.value)} />
            </div>
          </div>
        )}

        <div 
          style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: '700px', 
            aspectRatio: '1/1', 
            background: 'rgba(255,255,255,0.02)', 
            border: '2px dashed rgba(255,255,255,0.1)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            cursor: image ? 'crosshair' : 'pointer'
          }}
          onClick={() => !image && document.getElementById('photo-upload').click()}
        >
          {!image ? (
            <div style={{ textAlign: 'center' }}>
              <UploadCloud size={64} style={{ opacity: 0.1, marginBottom: '1rem' }} />
              <p style={{ opacity: 0.5 }}>Klik buat upload foto</p>
              <input type="file" id="photo-upload" style={{ display: 'none' }} onChange={handleImageUpload} />
            </div>
          ) : (
            <>
              <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%' }} />
              <canvas 
                ref={drawCanvasRef} 
                className="pointer-events-auto"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.5 }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </>
          )}

          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <div className="loader" style={{ marginBottom: '1rem' }} />
              <span style={{ fontWeight: 700 }}>AI is editing...</span>
            </div>
          )}
        </div>

        {image && (
          <div style={{ width: '100%', maxWidth: '700px', display: 'flex', gap: '1rem' }}>
            <input 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
              className="glass-input" 
              style={{ flex: 1 }}
              placeholder="Hapus objek ini, ubah bajunya, dll..."
            />
            <button 
              onClick={handleGenerate} 
              className="btn-primary" 
              disabled={loading || !prompt.trim() || isLimitReached}
              style={{ width: '60px' }}
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
