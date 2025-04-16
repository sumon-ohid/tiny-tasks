'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Array of emoji styles available from Dicebear - limited to only Adventurer Neutral and Avataaars
const EMOJI_STYLES = [
  'adventurer-neutral',
  'avataaars',
];

// Background colors to choose from
const BACKGROUND_COLORS = ['714033', 'c07f50', 'eaad80'];

// Generate a seed between 1-100
const getRandomSeed = () => Math.floor(Math.random() * 100) + 1;

// Get a random background color from our options
const getRandomBgColor = () => BACKGROUND_COLORS[Math.floor(Math.random() * BACKGROUND_COLORS.length)];

type EmojiPickerProps = {
  onSelect: (emoji: { url: string; style: string; seed: number; bgColor?: string }) => void;
  currentEmoji?: { url: string; style: string; seed: number; bgColor?: string } | null;
};

export const EmojiPicker = ({ onSelect, currentEmoji }: EmojiPickerProps) => {
  const [selectedStyle, setSelectedStyle] = useState<string>(currentEmoji?.style || 'adventurer-neutral');
  const [seed, setSeed] = useState<number>(currentEmoji?.seed || getRandomSeed());
  const [bgColor, setBgColor] = useState<string>(currentEmoji?.bgColor || getRandomBgColor());
  const [showPicker, setShowPicker] = useState(false);
  
  const generateEmojiUrl = (style: string, customSeed: number, backgroundColor: string) => 
    `https://api.dicebear.com/7.x/${style}/svg?seed=${customSeed}&backgroundColor=${backgroundColor}&radius=50`;
    
  const currentUrl = currentEmoji?.url || generateEmojiUrl(selectedStyle, seed, bgColor);
  
  const handleStyleChange = (style: string) => {
    setSelectedStyle(style);
    const newSeed = getRandomSeed();
    const newBgColor = getRandomBgColor();
    setSeed(newSeed);
    setBgColor(newBgColor);
    const url = generateEmojiUrl(style, newSeed, newBgColor);
    onSelect({ url, style, seed: newSeed, bgColor: newBgColor });
  };
  
  const handleRegenerate = () => {
    const newSeed = getRandomSeed();
    const newBgColor = getRandomBgColor();
    setSeed(newSeed);
    setBgColor(newBgColor);
    const url = generateEmojiUrl(selectedStyle, newSeed, newBgColor);
    onSelect({ url, style: selectedStyle, seed: newSeed, bgColor: newBgColor });
  };

  const handleColorChange = (color: string) => {
    setBgColor(color);
    const url = generateEmojiUrl(selectedStyle, seed, color);
    onSelect({ url, style: selectedStyle, seed, bgColor: color });
  };
  
  // Auto-select when component mounts if no emoji is currently selected
  useEffect(() => {
    if (!currentEmoji) {
      const initialBgColor = getRandomBgColor();
      const url = generateEmojiUrl(selectedStyle, seed, initialBgColor);
      onSelect({ url, style: selectedStyle, seed, bgColor: initialBgColor });
    }
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center justify-center w-10 h-10 rounded-md border bg-secondary hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label="Select emoji"
      >
        {currentUrl ? (
          <div className="relative w-8 h-8 overflow-hidden rounded-full">
            <Image
              src={currentUrl}
              alt="Selected emoji"
              width={32}
              height={32}
              className="object-cover rounded-full"
              unoptimized
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.includes('&format=png')) {
                  img.src = `${currentUrl.split('?')[0]}?seed=${seed}&backgroundColor=${bgColor}&radius=50&format=png`;
                } else {
                  // If PNG also fails, use a fallback emoji
                  img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23eaad80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>`;
                }
              }}
            />
          </div>
        ) : (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
        )}
      </button>
      
      {showPicker && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute left-0 top-12 z-50 w-72 p-3 bg-card rounded-lg border shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Select Avatar Style</h4>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="p-1 rounded-full hover:bg-muted"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            {EMOJI_STYLES.map((style) => (
              <button
                key={style}
                type="button"
                className={`p-3 rounded-md transition-colors ${
                  selectedStyle === style 
                    ? 'bg-primary/20 border-primary' 
                    : 'hover:bg-muted'
                } border`}
                onClick={() => handleStyleChange(style)}
              >
                <div className="relative w-full aspect-square overflow-hidden rounded-full">
                  <Image
                    src={generateEmojiUrl(style, getRandomSeed(), getRandomBgColor())}
                    alt={style}
                    width={80}
                    height={80}
                    className="object-cover rounded-full"
                    unoptimized
                    onError={(e) => {
                      const img = e.currentTarget;
                      const randomSeed = getRandomSeed();
                      const randomBgColor = getRandomBgColor();
                      const baseUrl = `https://api.dicebear.com/7.x/${style}`;
                      if (!img.src.includes('&format=png')) {
                        img.src = `${baseUrl}/svg?seed=${randomSeed}&backgroundColor=${randomBgColor}&radius=50&format=png`;
                      } else {
                        // If PNG also fails, use a fallback emoji
                        img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23eaad80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>`;
                      }
                    }}
                  />
                </div>
                <div className="text-xs text-center mt-2 font-medium">
                  {style === 'adventurer-neutral' ? 'Adventurer' : 'Avataaars'}
                </div>
              </button>
            ))}
          </div>
          
          <div className="mb-3">
            <div className="text-xs font-medium mb-2">Background Color</div>
            <div className="flex gap-2 justify-center">
              {BACKGROUND_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-transform ${
                    bgColor === color 
                      ? 'ring-2 ring-primary ring-offset-2 scale-110' 
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: `#${color}` }}
                  onClick={() => handleColorChange(color)}
                  title={`#${color}`}
                  aria-label={`Set background color to #${color}`}
                />
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Style: {selectedStyle === 'adventurer-neutral' ? 'Adventurer' : 'Avataaars'}</span>
            <button
              type="button"
              onClick={handleRegenerate}
              className="px-2 py-1 text-xs bg-muted rounded-md hover:bg-muted/80 transition-colors"
            >
              Regenerate
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}; 