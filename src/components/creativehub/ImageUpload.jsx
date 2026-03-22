import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

export const ImageUpload = ({ 
  onUpload, 
  onRemove, 
  value, 
  label = "Klik atau seret foto ke sini",
  icon = <Upload size={40} style={{ color: 'var(--text-tertiary)' }} />,
  style = {}
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIMENSION = 1024;
        if (width > height && width > MAX_DIMENSION) {
          height *= MAX_DIMENSION / width;
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width *= MAX_DIMENSION / height;
          height = MAX_DIMENSION;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const parts = dataUrl.split(',');
        const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const base64 = parts[1];
        onUpload({ base64, mimeType, dataUrl });
      };
      img.src = e.target?.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        height: '200px',
        borderRadius: 'var(--radius-md)',
        border: '2px dashed',
        borderColor: isDragging ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
        background: isDragging ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s',
        ...style
      }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={inputRef}
        style={{ display: 'none' }} 
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      
      {value ? (
        <>
          <img src={value.dataUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.5rem' }} alt="Preview" />
          <button 
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'var(--danger)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X size={14} />
          </button>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>{icon}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>{label}</p>
        </div>
      )}
    </div>
  );
};
