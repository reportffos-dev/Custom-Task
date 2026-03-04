
import React, { useState, useRef, useMemo } from 'react';
import { 
  ImageFile, 
  ModificationPreset, 
  GenerationSettings 
} from './types';
import { 
  fileToBase64, 
  generateModifiedImage 
} from './geminiService';

const App: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [settings, setSettings] = useState<GenerationSettings>({
    preset: ModificationPreset.ENHANCE,
    customPrompt: '',
    aspectRatio: '1:1'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparisonId, setShowComparisonId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const total = images.length;
    const completed = images.filter(img => img.status === 'completed').length;
    const processing = images.filter(img => img.status === 'processing').length;
    const error = images.filter(img => img.status === 'error').length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, processing, error, progress };
  }, [images]);

  const processFiles = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).map((file: File) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        status: 'pending' as const
      }));
      setImages(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) URL.revokeObjectURL(imageToRemove.preview);
      return prev.filter(img => img.id !== id);
    });
  };

  const startProcessing = async () => {
    if (images.length === 0) return;
    
    setIsProcessing(true);
    const finalPrompt = settings.customPrompt || settings.preset;

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.status === 'completed') continue;

      setImages(prev => prev.map(item => 
        item.id === img.id ? { ...item, status: 'processing' } : item
      ));

      try {
        const base64 = await fileToBase64(img.file);
        const resultUrl = await generateModifiedImage(
          base64, 
          img.file.type, 
          finalPrompt,
          settings.aspectRatio
        );
        
        setImages(prev => prev.map(item => 
          item.id === img.id ? { ...item, status: 'completed', resultUrl } : item
        ));
      } catch (error) {
        setImages(prev => prev.map(item => 
          item.id === img.id ? { ...item, status: 'error', error: (error as Error).message } : item
        ));
      }
    }
    setIsProcessing(false);
  };

  const downloadAll = () => {
    images.filter(img => img.status === 'completed' && img.resultUrl).forEach((img) => {
      const link = document.createElement('a');
      link.href = img.resultUrl!;
      link.download = `modified-${img.file.name.split('.')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 selection:bg-indigo-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bulk AI Modifier</h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Image Transformation</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            {images.length > 0 && (
              <button 
                onClick={clearAll}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                disabled={isProcessing}
              >
                Clear
              </button>
            )}
            <button 
              onClick={startProcessing}
              disabled={isProcessing || images.length === 0}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-xl transition-all active:scale-95 ${
                isProcessing || images.length === 0 
                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Batch...
                </span>
              ) : `Process ${images.length > 0 ? images.length : ''} Items`}
            </button>
          </div>
        </div>
        
        {isProcessing && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 xl:col-span-3 space-y-8">
            <section className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Config
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Modification Preset</label>
                  <select 
                    value={settings.preset}
                    onChange={(e) => setSettings(s => ({ ...s, preset: e.target.value }))}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  >
                    {Object.entries(ModificationPreset).map(([key, value]) => (
                      <option key={key} value={value}>{key.replace(/_/g, ' ')}</option>
                    ))}
                    <option value="CUSTOM">Custom modification...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Custom Instructions (Overrides Preset)</label>
                  <textarea 
                    placeholder="e.g. Change the background to a rainy street at night, add a red umbrella, and make the lighting moody..."
                    value={settings.customPrompt}
                    onChange={(e) => setSettings(s => ({ ...s, customPrompt: e.target.value }))}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none h-32 resize-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Aspect Ratio</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["1:1", "4:3", "3:4", "16:9", "9:16"].map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setSettings(s => ({ ...s, aspectRatio: ratio as any }))}
                        className={`py-3 text-xs font-bold border-2 rounded-xl transition-all ${
                          settings.aspectRatio === ratio 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                          : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {stats.completed > 0 && (
              <button 
                onClick={downloadAll}
                className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-3xl font-bold shadow-2xl shadow-slate-200 hover:bg-black transition-all group"
              >
                <svg className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download {stats.completed} Results
              </button>
            )}

            <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
               <h3 className="text-sm font-bold text-indigo-900 mb-2">Pro Tip</h3>
               <p className="text-xs text-indigo-700 leading-relaxed">
                 Describe exactly what you want to change. You can change styles, backgrounds, colors, or even add specific objects to your images in bulk.
               </p>
            </div>
          </div>

          <div className="lg:col-span-8 xl:col-span-9">
            {images.length === 0 ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group relative border-4 border-dashed rounded-[40px] p-20 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[500px] ${
                  isDragging 
                  ? 'border-indigo-600 bg-indigo-50 scale-[1.01]' 
                  : 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  multiple 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden" 
                />
                <div className={`bg-indigo-600 p-6 rounded-[2rem] text-white mb-8 shadow-2xl shadow-indigo-200 transition-transform ${isDragging ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4">{isDragging ? 'Drop to Upload' : 'Bulk AI Image Modifier'}</h3>
                <p className="text-slate-500 max-w-md mx-auto text-lg leading-relaxed">
                  {isDragging ? 'Release your images here to start processing.' : 'Drop any images here. Describe the changes you want, and our AI will apply them to all images in bulk.'}
                </p>
                <div className="mt-10 flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>PNG</span>
                  <span>JPG</span>
                  <span>WEBP</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {images.map(img => (
                  <div 
                    key={img.id} 
                    className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm group hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <div 
                      className="relative aspect-square bg-slate-50 flex items-center justify-center overflow-hidden cursor-crosshair"
                      onMouseEnter={() => setShowComparisonId(img.id)}
                      onMouseLeave={() => setShowComparisonId(null)}
                    >
                      <img 
                        src={img.preview} 
                        alt="Original" 
                        className={`absolute inset-0 w-full h-full object-contain p-8 transition-opacity duration-300 ${img.resultUrl && showComparisonId !== img.id ? 'opacity-0' : 'opacity-100'}`} 
                      />
                      
                      {img.resultUrl && (
                        <img 
                          src={img.resultUrl} 
                          alt="AI Result" 
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${showComparisonId === img.id ? 'opacity-0' : 'opacity-100'}`} 
                        />
                      )}

                      {img.resultUrl && !isProcessing && (
                        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold py-1.5 px-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          HOVER TO COMPARE
                        </div>
                      )}

                      {!isProcessing && img.status !== 'processing' && (
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                             className="bg-white/90 backdrop-blur-sm text-slate-600 p-2.5 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                           >
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                             </svg>
                           </button>
                        </div>
                      )}

                      {img.status === 'processing' && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-8">
                          <div className="relative mb-6">
                            <div className="w-20 h-20 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-indigo-600 font-bold text-xs">AI</div>
                          </div>
                          <p className="text-sm font-black text-slate-800 tracking-tight uppercase">Enhancing...</p>
                        </div>
                      )}

                      {img.status === 'error' && (
                        <div className="absolute inset-0 bg-rose-50 flex flex-col items-center justify-center p-8 text-center">
                          <div className="bg-rose-100 p-3 rounded-full mb-4">
                            <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h4 className="text-sm font-bold text-rose-900 mb-2 uppercase tracking-widest">Error</h4>
                          <p className="text-xs text-rose-600 line-clamp-3 mb-6">{img.error}</p>
                          <button 
                            onClick={() => removeImage(img.id)}
                            className="text-xs font-bold text-rose-700 bg-rose-100 px-4 py-2 rounded-xl hover:bg-rose-200 transition-all"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex flex-col min-w-0 pr-4">
                        <span className="text-xs font-black text-slate-800 truncate">{img.file.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          {(img.file.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {img.status === 'completed' && img.resultUrl && (
                          <a 
                            href={img.resultUrl} 
                            download={`modified-${img.file.name}`}
                            className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                            title="Download"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        )}
                        <div className={`w-3 h-3 rounded-full ${
                          img.status === 'completed' ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]' : 
                          img.status === 'processing' ? 'bg-indigo-500 animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.5)]' : 
                          img.status === 'error' ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]' : 'bg-slate-200'
                        }`} />
                      </div>
                    </div>
                  </div>
                ))}
                
                {!isProcessing && images.length > 0 && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`aspect-square rounded-[2rem] border-4 border-dashed flex flex-col items-center justify-center transition-all group ${
                      isDragging 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600 scale-[1.05]' 
                      : 'border-slate-100 text-slate-300 hover:border-indigo-300 hover:text-indigo-400 hover:bg-indigo-50'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      multiple 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                    <div className={`bg-slate-50 p-5 rounded-full mb-3 group-hover:bg-white group-hover:scale-110 transition-all ${isDragging ? 'bg-white scale-110 shadow-lg' : ''}`}>
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">{isDragging ? 'Drop Now' : 'Add Images'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
