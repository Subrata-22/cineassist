import Hero from './Hero.jsx';
import AnalyzerSection from '../analyzer/AnalyzerSection.jsx';
import GuidanceSection from './GuidanceSection.jsx';
import LearnSection from './LearnSection.jsx';
import { useState } from 'react';

export default function HomePage({ onAuthClick, fileInputRef }) {
  const [analysisResults, setAnalysisResults] = useState(null);

  return (
    <>
      <Hero onUploadClick={() => {
        document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => fileInputRef?.current?.click(), 500);
      }}/>
      <AnalyzerSection
        fileInputRef={fileInputRef}
        onAnalysisComplete={setAnalysisResults}
        onAuthClick={onAuthClick}
      />
      <GuidanceSection analysisResults={analysisResults}/>
      <LearnSection/>
    </>
  );
}
