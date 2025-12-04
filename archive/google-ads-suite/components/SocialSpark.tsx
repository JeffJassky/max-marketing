import React, { useState } from 'react';
import { SocialSparkInput } from './SocialSparkInput';
import { SocialSparkIdeas } from './SocialSparkIdeas';
import { SocialService } from '../services/SocialService';
import { SocialIdea, SocialSparkView, SocialDraft, SocialTone } from '../types';
import { Sparkles, RefreshCw, Check, Copy, Send, Image as ImageIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SocialSpark: React.FC = () => {
  const [view, setView] = useState<SocialSparkView>(SocialSparkView.INPUT);
  const [topic, setTopic] = useState('');
  const [ideas, setIdeas] = useState<SocialIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<SocialIdea | null>(null);

  // State for Caption Creator (retained from original logic)
  const [selectedTone, setSelectedTone] = useState<SocialTone>('Professional');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [hasGeneratedCaption, setHasGeneratedCaption] = useState(false);

  // Mock Images (preserved from original)
  const mockImages = [
      'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1543443374-b6fe10a62d43?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1524230659092-07f99a75c013?auto=format&fit=crop&q=80&w=800'
  ];

  const handleGenerateIdeas = async (inputTopic: string) => {
      setTopic(inputTopic);
      setLoading(true);
      try {
          const fetchedIdeas = await SocialService.getCoreIdeas(inputTopic);
          setIdeas(fetchedIdeas);
          setView(SocialSparkView.IDEAS);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handleUseIdea = (idea: SocialIdea) => {
      setSelectedIdea(idea);
      // Reset caption state
      setGeneratedContent('');
      setHasGeneratedCaption(false);
      setView(SocialSparkView.CAPTION);
  };

  const handleGenerateCaption = () => {
      setIsGeneratingCaption(true);
      setTimeout(() => {
          let content = `(Draft based on ${selectedIdea?.title})\n\n`;
          if (selectedTone === 'Professional') {
              content += `Here is a professional take on ${topic}. ${selectedIdea?.description} We ensure the highest quality standards. #Professional #${topic.replace(/\s/g, '')}`;
          } else if (selectedTone === 'Edgy') {
              content += `Forget the noise. ${topic} is the only thing that matters. ${selectedIdea?.description} Get real. #NoFilter #${topic.replace(/\s/g, '')}`;
          } else {
              content += `Why did the ${topic} cross the road? To prove a point! ${selectedIdea?.description} Seriously though, it's great. #Fun #${topic.replace(/\s/g, '')}`;
          }
          setGeneratedContent(content);
          setIsGeneratingCaption(false);
          setHasGeneratedCaption(true);
      }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Simplified Header for consistent branding */}
        <div className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-30 flex items-center justify-between">
             <div className="flex items-center">
                <Sparkles className="w-5 h-5 text-indigo-500 mr-2" />
                <span className="font-bold text-slate-900">Social Spark</span>
                {view !== SocialSparkView.INPUT && (
                    <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ml-3 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full border border-slate-200 hidden md:inline-block"
                    >
                        {topic}
                    </motion.span>
                )}
             </div>
             {view !== SocialSparkView.INPUT && (
                 <div className="text-xs font-medium text-slate-400">
                     Step {view === SocialSparkView.IDEAS ? '2' : '3'} of 3
                 </div>
             )}
        </div>

        <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
            {loading ? (
                <motion.div 
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full"
                >
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Consulting the experts...</p>
                </motion.div>
            ) : (
                <>
                    {view === SocialSparkView.INPUT && (
                        <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <SocialSparkInput onGenerate={handleGenerateIdeas} />
                        </motion.div>
                    )}

                    {view === SocialSparkView.IDEAS && (
                        <motion.div key="ideas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <SocialSparkIdeas 
                                topic={topic} 
                                ideas={ideas} 
                                onBack={() => setView(SocialSparkView.INPUT)} 
                                onUseIdea={handleUseIdea}
                            />
                        </motion.div>
                    )}

                    {view === SocialSparkView.CAPTION && (
                        <motion.div key="caption" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    <button onClick={() => setView(SocialSparkView.IDEAS)} className="flex items-center text-slate-500 hover:text-slate-800 font-medium transition-colors">
                                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Ideas
                                    </button>
                                    
                                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg mb-4">
                                        <h3 className="text-indigo-900 font-bold text-sm mb-1">Selected Angle: {selectedIdea?.title}</h3>
                                        <p className="text-indigo-700 text-xs">{selectedIdea?.description}</p>
                                    </div>

                                    <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">1. Choose Your Vibe</h2>
                                        <div className="flex space-x-2">
                                        {(['Professional', 'Edgy', 'Funny'] as SocialTone[]).map((tone) => (
                                            <button
                                            key={tone}
                                            onClick={() => { setSelectedTone(tone); setHasGeneratedCaption(false); }}
                                            className={`flex-1 py-3 px-2 rounded-lg text-sm font-semibold transition-all border-2 ${
                                                selectedTone === tone
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                                            }`}
                                            >
                                            {tone}
                                            </button>
                                        ))}
                                        </div>
                                    </section>

                                    <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">2. Select Creative</h2>
                                        <div className="grid grid-cols-3 gap-4">
                                            {mockImages.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedImageIndex(idx)}
                                                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                                selectedImageIndex === idx ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-transparent hover:opacity-80'
                                                }`}
                                            >
                                                <img src={img} alt="Product" className="w-full h-full object-cover" />
                                                {selectedImageIndex === idx && <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full"><Check className="w-3 h-3" /></div>}
                                            </button>
                                            ))}
                                        </div>
                                    </section>

                                    <button
                                        onClick={handleGenerateCaption}
                                        disabled={isGeneratingCaption}
                                        className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all flex items-center justify-center ${
                                        isGeneratingCaption ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:-translate-y-1'
                                        }`}
                                    >
                                        {isGeneratingCaption ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                        {isGeneratingCaption ? 'Writing...' : 'Generate Caption'}
                                    </button>
                                </div>

                                {/* Right Column (Preview) */}
                                <div className="space-y-6">
                                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide">Preview</h2>
                                    <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                                        <div className="p-4 border-b border-slate-100 flex items-center">
                                            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3">GM</div>
                                            <div><p className="text-sm font-bold text-slate-900">George's Music</p><p className="text-xs text-slate-500">Just now</p></div>
                                        </div>
                                        <div className="aspect-square bg-slate-100 w-full">
                                            <img src={mockImages[selectedImageIndex]} className="w-full h-full object-cover" alt="Preview" />
                                        </div>
                                        <div className="p-5 min-h-[120px] bg-white">
                                            {hasGeneratedCaption ? (
                                                <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{generatedContent}</p>
                                            ) : (
                                                <p className="text-slate-400 text-sm italic">Generative Output will appear here...</p>
                                            )}
                                        </div>
                                        <div className="p-4 border-t border-slate-100 flex justify-between">
                                            <div className="flex space-x-2"><div className="w-4 h-4 bg-slate-200 rounded-full"></div><div className="w-4 h-4 bg-slate-200 rounded-full"></div></div>
                                            {hasGeneratedCaption && <button className="text-xs font-bold text-indigo-600 flex items-center"><Copy className="w-3 h-3 mr-1" /> Copy</button>}
                                        </div>
                                    </div>
                                    <button disabled={!hasGeneratedCaption} className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center ${hasGeneratedCaption ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'}`}>
                                        <Send className="w-4 h-4 mr-2" /> Post Now
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </>
            )}
            </AnimatePresence>
        </div>
    </div>
  );
};