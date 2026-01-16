export async function extractDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve('#E50914'); // Fallback to Netflix red
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Sample pixels (every 10th pixel for performance)
        const colorCounts: Record<string, number> = {};
        const step = 10;

        for (let i = 0; i < data.length; i += step * 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Skip transparent pixels
          if (a < 128) continue;

          // Quantize colors to reduce variations
          const quantizedR = Math.floor(r / 32) * 32;
          const quantizedG = Math.floor(g / 32) * 32;
          const quantizedB = Math.floor(b / 32) * 32;

          const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
          colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
        }

        // Find most common color
        let maxCount = 0;
        let dominantColor = '#E50914'; // Fallback

        for (const [colorKey, count] of Object.entries(colorCounts)) {
          if (count > maxCount) {
            maxCount = count;
            const [r, g, b] = colorKey.split(',').map(Number);
            dominantColor = `rgb(${r}, ${g}, ${b})`;
          }
        }

        resolve(dominantColor);
      } catch (err) {
        resolve('#E50914'); // Fallback to Netflix red
      }
    };

    img.onerror = () => {
      resolve('#E50914'); // Fallback to Netflix red
    };

    img.src = imageUrl;
  });
}
