/**
 * CineAssist — Composition Analysis Engine
 * Ported from vanilla JS to ES module
 */

function getImageData(img, maxSize = 600) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function analyzeRuleOfThirds(imageData) {
  const { data, width, height } = imageData;
  const thirds = {
    x: [Math.round(width / 3), Math.round(2 * width / 3)],
    y: [Math.round(height / 3), Math.round(2 * height / 3)]
  };
  const lumMap = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    lumMap[i / 4] = luminance(data[i], data[i + 1], data[i + 2]);
  }
  const contrastMap = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx = lumMap[idx + 1] - lumMap[idx - 1];
      const gy = lumMap[idx + width] - lumMap[idx - width];
      contrastMap[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  const sorted = Array.from(contrastMap).sort((a, b) => b - a);
  const threshold = sorted[Math.floor(sorted.length * 0.2)] || 1;
  const intersections = [];
  for (const gy of thirds.y) {
    for (const gx of thirds.x) intersections.push({ x: gx, y: gy });
  }
  let totalInterest = 0, weightedNearIntersection = 0, weightedNearLine = 0;
  const lineRadius = Math.max(width, height) * 0.06;
  const intersectionRadius = Math.max(width, height) * 0.10;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const c = contrastMap[idx];
      if (c < threshold) continue;
      totalInterest += c;
      for (const pt of intersections) {
        const dist = Math.sqrt((x - pt.x) ** 2 + (y - pt.y) ** 2);
        if (dist < intersectionRadius) weightedNearIntersection += c * (1 - dist / intersectionRadius);
      }
      for (const lx of thirds.x) {
        if (Math.abs(x - lx) < lineRadius) weightedNearLine += c * (1 - Math.abs(x - lx) / lineRadius) * 0.5;
      }
      for (const ly of thirds.y) {
        if (Math.abs(y - ly) < lineRadius) weightedNearLine += c * (1 - Math.abs(y - ly) / lineRadius) * 0.5;
      }
    }
  }
  const intersectionScore = totalInterest > 0 ? Math.min(100, (weightedNearIntersection / totalInterest) * 250) : 50;
  const lineScore = totalInterest > 0 ? Math.min(100, (weightedNearLine / totalInterest) * 180) : 50;
  const score = Math.round(intersectionScore * 0.6 + lineScore * 0.4);
  let feedback, suggestion;
  if (score >= 75) {
    feedback = "Excellent rule of thirds placement! Key visual elements align well with the composition grid, creating a naturally balanced and engaging frame.";
    suggestion = "Maintain this strong compositional awareness. Consider subtle adjustments to place the absolute focus point precisely on an intersection.";
  } else if (score >= 50) {
    feedback = "Moderate rule of thirds adherence. Some elements align with the grid, but the primary subject could be positioned more deliberately.";
    suggestion = "Try repositioning your main subject to sit on one of the four power points (grid intersections) for a more dynamic composition.";
  } else {
    feedback = "The composition doesn't strongly follow the rule of thirds. The subject appears centered or positioned away from the compositional grid.";
    suggestion = "Shift your framing so the subject falls on a thirds line or intersection. Use your camera's grid overlay to guide placement while shooting.";
  }
  return {
    name: 'Rule of Thirds', score: Math.max(5, Math.min(100, score)), feedback, suggestion,
    data: { intersections, thirds, contrastMap, width, height, threshold }
  };
}

function analyzeBalance(imageData) {
  const { data, width, height } = imageData;
  const halfW = Math.floor(width / 2), halfH = Math.floor(height / 2);
  const quads = [0, 0, 0, 0], counts = [0, 0, 0, 0];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const lum = luminance(data[idx], data[idx + 1], data[idx + 2]);
      const qi = (y < halfH ? 0 : 2) + (x < halfW ? 0 : 1);
      quads[qi] += lum; counts[qi]++;
    }
  }
  const avgQuads = quads.map((q, i) => q / counts[i]);
  const overallAvg = avgQuads.reduce((a, b) => a + b) / 4;
  const variance = avgQuads.reduce((sum, q) => sum + (q - overallAvg) ** 2, 0) / 4;
  const balanceRatio = 1 - Math.min(1, variance / 6400);
  const leftAvg = (avgQuads[0] + avgQuads[2]) / 2, rightAvg = (avgQuads[1] + avgQuads[3]) / 2;
  const topAvg = (avgQuads[0] + avgQuads[1]) / 2, bottomAvg = (avgQuads[2] + avgQuads[3]) / 2;
  const lrBalance = 1 - Math.abs(leftAvg - rightAvg) / 128;
  const tbBalance = 1 - Math.abs(topAvg - bottomAvg) / 128;
  const score = Math.round((balanceRatio * 0.4 + lrBalance * 0.35 + tbBalance * 0.25) * 100);
  let feedback, suggestion;
  if (score >= 75) {
    feedback = "The image has well-distributed visual weight across the frame. Light and dark areas balance each other effectively.";
    suggestion = "Great balance! Experiment with slight intentional imbalance (e.g., heavier bottom) to create specific moods.";
  } else if (score >= 50) {
    feedback = "Moderate balance detected. One side of the frame carries noticeably more visual weight than the other.";
    suggestion = "Consider adding a secondary element on the lighter side of the frame, or cropping to redistribute visual weight.";
  } else {
    feedback = "The frame is significantly unbalanced, with visual weight concentrated heavily in one area.";
    suggestion = "Reframe to include balancing elements. A heavy foreground subject can be balanced by sky, texture, or a contrasting element.";
  }
  return {
    name: 'Visual Balance', score: Math.max(5, Math.min(100, score)), feedback, suggestion,
    data: { avgQuads, lrBalance, tbBalance, balanceRatio }
  };
}

function analyzeSymmetry(imageData) {
  const { data, width, height } = imageData;
  let hDiffSum = 0, hTotal = 0, vDiffSum = 0, vTotal = 0;
  const step = 2;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < Math.floor(width / 2); x += step) {
      const mirrorX = width - 1 - x;
      const idx1 = (y * width + x) * 4, idx2 = (y * width + mirrorX) * 4;
      hDiffSum += Math.abs(luminance(data[idx1], data[idx1 + 1], data[idx1 + 2]) - luminance(data[idx2], data[idx2 + 1], data[idx2 + 2]));
      hTotal++;
    }
  }
  for (let y = 0; y < Math.floor(height / 2); y += step) {
    const mirrorY = height - 1 - y;
    for (let x = 0; x < width; x += step) {
      const idx1 = (y * width + x) * 4, idx2 = (mirrorY * width + x) * 4;
      vDiffSum += Math.abs(luminance(data[idx1], data[idx1 + 1], data[idx1 + 2]) - luminance(data[idx2], data[idx2 + 1], data[idx2 + 2]));
      vTotal++;
    }
  }
  const hSymmetry = 1 - Math.min(1, (hDiffSum / hTotal) / 80);
  const vSymmetry = 1 - Math.min(1, (vDiffSum / vTotal) / 80);
  const score = Math.round(Math.max(hSymmetry, vSymmetry) * 100);
  let feedback, suggestion;
  if (score >= 75) {
    feedback = "Strong symmetry detected in the composition. The image exhibits a pleasing reflective quality that creates visual harmony.";
    suggestion = "Symmetry is powerful — try placing a small asymmetric element to add visual interest (e.g., a person slightly off-center).";
  } else if (score >= 50) {
    feedback = "Partial symmetry is present. The composition has some mirror-like qualities but isn't fully symmetrical.";
    suggestion = "If symmetry is your intent, adjust your framing to make the mirror axis more precise. Architectural subjects work great.";
  } else {
    feedback = "The composition is more asymmetric, with significant visual differences between mirrored halves.";
    suggestion = "Asymmetry can be powerful — embrace it with the rule of thirds. If symmetry is desired, look for reflections, architecture, or centered subjects.";
  }
  return {
    name: 'Symmetry', score: Math.max(5, Math.min(100, score)), feedback, suggestion,
    data: { hSymmetry, vSymmetry, bestAxis: hSymmetry > vSymmetry ? 'horizontal' : 'vertical' }
  };
}

function analyzeColorHarmony(imageData) {
  const { data, width, height } = imageData;
  const sampleSize = Math.min(10000, width * height);
  const step = Math.max(1, Math.floor((width * height) / sampleSize));
  const hues = [], saturations = [];
  let totalSaturation = 0, colorfulPixels = 0;
  for (let i = 0; i < data.length; i += step * 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    if (s > 10 && l > 10 && l < 90) {
      hues.push(h); saturations.push(s);
      totalSaturation += s; colorfulPixels++;
    }
  }
  if (colorfulPixels < 10) {
    return {
      name: 'Color Harmony', score: 60,
      feedback: "The image is predominantly monochromatic or very desaturated.",
      suggestion: "If this is a B&W image, focus on tonal contrast. For color images, try enhancing saturation or adding a color accent.",
      data: { dominantHues: [], avgSaturation: 0, harmony: 'monochromatic' }
    };
  }
  const avgSaturation = totalSaturation / colorfulPixels;
  const hueBins = new Array(12).fill(0);
  hues.forEach(h => hueBins[Math.floor(h / 30) % 12]++);
  const indexedBins = hueBins.map((v, i) => ({ bin: i, count: v })).sort((a, b) => b.count - a.count);
  const dominantHues = indexedBins.slice(0, 3).filter(h => h.count > colorfulPixels * 0.05);
  let harmonyScore = 50, harmonyType = 'mixed';
  if (dominantHues.length <= 1) { harmonyScore = 75; harmonyType = 'monochromatic'; }
  else if (dominantHues.length === 2) {
    const diff = Math.abs(dominantHues[0].bin - dominantHues[1].bin);
    const hueDiff = Math.min(diff, 12 - diff);
    if (hueDiff === 6) { harmonyScore = 85; harmonyType = 'complementary'; }
    else if (hueDiff <= 2) { harmonyScore = 80; harmonyType = 'analogous'; }
    else if (hueDiff === 4 || hueDiff === 8) { harmonyScore = 78; harmonyType = 'triadic'; }
    else { harmonyScore = 60; harmonyType = 'split'; }
  } else {
    const bins = dominantHues.map(d => d.bin).sort((a, b) => a - b);
    const d1 = bins[1] - bins[0], d2 = bins[2] - bins[1], d3 = 12 - bins[2] + bins[0];
    if (Math.abs(d1 - 4) <= 1 && Math.abs(d2 - 4) <= 1 && Math.abs(d3 - 4) <= 1) { harmonyScore = 82; harmonyType = 'triadic'; }
    else { harmonyScore = 55; harmonyType = 'diverse'; }
  }
  const satBonus = avgSaturation > 30 ? Math.min(10, (avgSaturation - 30) / 5) : 0;
  const score = Math.round(Math.min(100, harmonyScore + satBonus));
  let feedback, suggestion;
  if (score >= 75) {
    feedback = `The image exhibits ${harmonyType} color harmony with a cohesive palette. Colors work together to create a unified mood.`;
    suggestion = "Strong color work! Try emphasizing your dominant colors during editing to make the palette even more deliberate.";
  } else if (score >= 50) {
    feedback = `The color palette is ${harmonyType} with moderate harmony. Some colors compete for attention.`;
    suggestion = "Consider simplifying the color palette. Reduce competing hues by desaturating distracting colors or adjusting white balance.";
  } else {
    feedback = "The color palette is scattered with no clear harmony pattern.";
    suggestion = "Limit your palette to 2-3 harmonious colors. Use complementary or analogous schemes.";
  }
  return {
    name: 'Color Harmony', score: Math.max(5, Math.min(100, score)), feedback, suggestion,
    data: { dominantHues: dominantHues.map(d => d.bin * 30), avgSaturation, harmony: harmonyType }
  };
}

function analyzeBrightnessContrast(imageData) {
  const { data, width, height } = imageData;
  const histogram = new Array(256).fill(0);
  const totalPixels = width * height;
  for (let i = 0; i < data.length; i += 4) {
    histogram[Math.round(luminance(data[i], data[i + 1], data[i + 2]))]++;
  }
  let sumLum = 0;
  for (let i = 0; i < 256; i++) sumLum += i * histogram[i];
  const meanLum = sumLum / totalPixels;
  let variance = 0;
  for (let i = 0; i < 256; i++) variance += histogram[i] * (i - meanLum) ** 2;
  const stdDev = Math.sqrt(variance / totalPixels);
  const shadowClip = histogram.slice(0, 10).reduce((a, b) => a + b) / totalPixels;
  const highlightClip = histogram.slice(245).reduce((a, b) => a + b) / totalPixels;
  const lumScore = 1 - Math.min(1, Math.abs(meanLum - 128) / 100);
  const contrastScore = stdDev < 20 ? stdDev / 20 : stdDev > 90 ? 1 - (stdDev - 90) / 80 : 1;
  const clipPenalty = Math.min(0.3, (shadowClip > 0.1 ? 0.15 : 0) + (highlightClip > 0.1 ? 0.15 : 0));
  const score = Math.round((lumScore * 0.35 + contrastScore * 0.45 + (1 - clipPenalty) * 0.20) * 100);
  let feedback, suggestion;
  if (score >= 75) {
    feedback = "Good exposure with a well-distributed tonal range. The image preserves detail in both shadows and highlights.";
    suggestion = "Solid exposure! Fine-tune contrast with a subtle S-curve in post-processing for even more visual punch.";
  } else if (score >= 50) {
    feedback = `The exposure is ${meanLum > 160 ? 'slightly bright' : meanLum < 90 ? 'slightly dark' : 'somewhat flat'}. Dynamic range could be improved.`;
    suggestion = meanLum > 160 ? "Reduce exposure slightly or use a graduated filter to bring back highlight detail."
      : meanLum < 90 ? "Brighten the image in post-processing and consider using fill-light to lift shadows."
        : "Add contrast to expand the tonal range. Use curves adjustment for precise control.";
  } else {
    feedback = `The exposure has ${highlightClip > 0.1 ? 'blown highlights' : ''}${highlightClip > 0.1 && shadowClip > 0.1 ? ' and ' : ''}${shadowClip > 0.1 ? 'crushed shadows' : ''}${clipPenalty === 0 ? 'poor dynamic range' : ''}. Significant tonal data is lost.`;
    suggestion = "Reshoot with exposure compensation if possible. In post, use highlight/shadow recovery and shoot in RAW for maximum latitude.";
  }
  return {
    name: 'Brightness & Contrast', score: Math.max(5, Math.min(100, score)), feedback, suggestion,
    data: { meanLum, stdDev, shadowClip, highlightClip, histogram }
  };
}

function analyzeEdges(imageData) {
  const { data, width, height } = imageData;
  const gray = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) gray[i / 4] = luminance(data[i], data[i + 1], data[i + 2]);
  const edgeMag = new Float32Array(width * height);
  const edgeDir = new Float32Array(width * height);
  let maxMag = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx = -gray[(y - 1) * width + (x - 1)] + gray[(y - 1) * width + (x + 1)]
        - 2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)]
        - gray[(y + 1) * width + (x - 1)] + gray[(y + 1) * width + (x + 1)];
      const gy = -gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + (x + 1)]
        + gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + (x + 1)];
      const mag = Math.sqrt(gx * gx + gy * gy);
      edgeMag[idx] = mag; edgeDir[idx] = Math.atan2(gy, gx);
      if (mag > maxMag) maxMag = mag;
    }
  }
  if (maxMag > 0) for (let i = 0; i < edgeMag.length; i++) edgeMag[i] /= maxMag;
  const edgeThreshold = 0.15;
  let totalEdgePixels = 0;
  const dirBins = new Array(8).fill(0);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (edgeMag[idx] > edgeThreshold) {
        totalEdgePixels++;
        let angle = edgeDir[idx] * 180 / Math.PI;
        if (angle < 0) angle += 360;
        dirBins[Math.floor(angle / 45) % 8]++;
      }
    }
  }
  const edgeDensity = totalEdgePixels / (width * height);
  const cx = width / 2, cy = height / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);
  const ringCount = 5;
  const rings = new Array(ringCount).fill(0), ringPixels = new Array(ringCount).fill(0);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxR;
      const ring = Math.min(ringCount - 1, Math.floor(r * ringCount));
      ringPixels[ring]++;
      if (edgeMag[idx] > edgeThreshold) rings[ring]++;
    }
  }
  const ringDensity = rings.map((r, i) => ringPixels[i] > 0 ? r / ringPixels[i] : 0);
  const leadingStrength = ringDensity[0] > 0 ? (ringDensity[0] + ringDensity[1]) / (ringDensity[3] + ringDensity[4] + 0.001) : 0.5;
  const maxDir = Math.max(...dirBins);
  const dirScore = totalEdgePixels > 0 ? maxDir / totalEdgePixels : 0;
  const densityScore = Math.min(1, edgeDensity * 8);
  const lineScore = Math.min(1, leadingStrength * 0.5);
  const directionality = Math.min(1, dirScore * 3);
  const score = Math.round((densityScore * 0.3 + lineScore * 0.35 + directionality * 0.35) * 100);
  let feedback, suggestion;
  if (score >= 70) {
    feedback = "Strong leading lines and edges are present. These create visual pathways that guide the viewer's eye through the frame.";
    suggestion = "Excellent line work! Ensure lines lead toward your subject, not away from it. Diagonal lines are the most dynamic.";
  } else if (score >= 45) {
    feedback = "Some edges and structural lines are present, but they don't create a strong compositional flow.";
    suggestion = "Look for natural lines — roads, fences, shorelines — and position them to lead toward your subject.";
  } else {
    feedback = "Minimal leading lines detected. The composition lacks clear visual pathways to guide the viewer's eye.";
    suggestion = "Actively seek leading lines when composing. Even subtle elements like shadows, textures, or color gradients can guide the eye.";
  }
  return {
    name: 'Leading Lines', score: Math.max(5, Math.min(100, score)), feedback, suggestion,
    data: { edgeMag, edgeDir, width, height, edgeDensity, dirBins }
  };
}

function computeOverallScore(modules) {
  const weights = {
    'Rule of Thirds': 0.25, 'Visual Balance': 0.20, 'Symmetry': 0.10,
    'Color Harmony': 0.20, 'Brightness & Contrast': 0.15, 'Leading Lines': 0.10
  };
  let totalWeight = 0, weightedSum = 0;
  for (const mod of modules) {
    const w = weights[mod.name] || 0.1;
    weightedSum += mod.score * w;
    totalWeight += w;
  }
  return Math.round(weightedSum / totalWeight);
}

function getVerdict(score) {
  if (score >= 85) return 'Exceptional Composition';
  if (score >= 70) return 'Strong Composition';
  if (score >= 55) return 'Good Foundation';
  if (score >= 40) return 'Needs Improvement';
  return 'Weak Composition';
}

export async function analyze(img, onProgress = () => { }) {
  const imageData = getImageData(img);
  const { data } = imageData;

  let samePixels = 0;

for (let i = 4; i < data.length; i += 4) {
  const diff =
    Math.abs(data[i] - data[i - 4]) +
    Math.abs(data[i + 1] - data[i - 3]) +
    Math.abs(data[i + 2] - data[i - 2]);

  if (diff < 5) {
    samePixels++;
  }
}

const flatRatio = samePixels / (data.length / 4);

if (flatRatio > 0.85) {
  throw new Error(
    'Please upload a real photograph, not a blank image or screenshot'
  );
}

let brightnessSum = 0;

for (let i = 0; i < data.length; i += 4) {
  brightnessSum += (
    data[i] +
    data[i + 1] +
    data[i + 2]
  ) / 3;
}

const avgBrightness = brightnessSum / (data.length / 4);

console.log("Average brightness =", avgBrightness);

if (avgBrightness < 20) {
  throw new Error('This image is too dark to analyze');
}

if (avgBrightness > 235) {
  throw new Error('This image appears blank or overexposed');
}
  const steps = [
    { name: 'thirds', fn: () => analyzeRuleOfThirds(imageData) },
    { name: 'balance', fn: () => analyzeBalance(imageData) },
    { name: 'symmetry', fn: () => analyzeSymmetry(imageData) },
    { name: 'color', fn: () => analyzeColorHarmony(imageData) },
    { name: 'brightness', fn: () => analyzeBrightnessContrast(imageData) },
    { name: 'edges', fn: () => analyzeEdges(imageData) },
  ];
  const modules = [];
  for (const step of steps) {
    onProgress(step.name);
    await new Promise(r => setTimeout(r, 200));
    modules.push(step.fn());
  }
  const overall = computeOverallScore(modules);
  const verdict = getVerdict(overall);
  return { modules, overall, verdict, imageData };
}

export { getImageData };
