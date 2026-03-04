
export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  resultUrl?: string;
  error?: string;
}

export enum ModificationPreset {
  ENHANCE = 'Enhance the overall quality, lighting, and colors of the image while keeping it natural.',
  CARTOON = 'Transform the image into a high-quality 3D Disney/Pixar style animation.',
  VINTAGE = 'Apply a classic 1970s film aesthetic with warm tones, grain, and slight light leaks.',
  CYBERPUNK = 'Convert the scene into a futuristic cyberpunk environment with neon lights and high-tech elements.',
  SKETCH = 'Turn the image into a detailed charcoal and pencil sketch on textured paper.',
  OIL_PAINTING = 'Recreate the image as a professional oil painting with visible brushstrokes and rich textures.',
  BLACK_WHITE = 'Convert to a dramatic, high-contrast black and white fine art photograph.',
  MINIMALIST = 'Simplify the image into a clean, minimalist aesthetic with a soft color palette.'
}

export interface GenerationSettings {
  preset: ModificationPreset | string;
  customPrompt: string;
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
}
