'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Array of emoji styles available from Dicebear
const EMOJI_STYLES = [
  'adventurer',
  'adventurer-neutral',
  'avataaars',
  'big-ears',
  'big-ears-neutral',
  'bottts',
  'croodles',
  'croodles-neutral',
  'fun-emoji',
  'icons',
  'identicon',
  'initials',
  'lorelei',
  'lorelei-neutral',
  'micah',
  'miniavs',
  'notionists',
  'open-peeps',
  'personas',
  'pixel-art',
  'rings',
];

// Generate a seed between 1-100
const getRandomSeed = () => Math.floor(Math.random() * 100) + 1;

type EmojiPickerProps = {
  onSelect: (emoji: { url: string; style: string; seed: number }) => void;
  currentEmoji?: { url: string; style: string; seed: number } | null;
};

export const EmojiPicker = ({ onSelect, currentEmoji }: EmojiPickerProps) => {
  const [selectedStyle, setSelectedStyle] = useState<string>(currentEmoji?.style || 'fun-emoji');
  const [seed, setSeed] = useState<number>(currentEmoji?.seed || getRandomSeed());
  const [showPicker, setShowPicker] = useState(false);
  
  const generateEmojiUrl = (style: string, customSeed: number) => 
    `https://api.dicebear.com/7.x/${style}/svg?seed=${customSeed}`;
    
  const currentUrl = currentEmoji?.url || generateEmojiUrl(selectedStyle, seed);
  
  const handleStyleChange = (style: string) => {
    setSelectedStyle(style);
    const newSeed = getRandomSeed();
    setSeed(newSeed);
    const url = generateEmojiUrl(style, newSeed);
    onSelect({ url, style, seed: newSeed });
  };
  
  const handleRegenerate = () => {
    const newSeed = getRandomSeed();
    setSeed(newSeed);
    const url = generateEmojiUrl(selectedStyle, newSeed);
    onSelect({ url, style: selectedStyle, seed: newSeed });
  };
  
  // Auto-select when component mounts if no emoji is currently selected
  useEffect(() => {
    if (!currentEmoji) {
      const url = generateEmojiUrl(selectedStyle, seed);
      onSelect({ url, style: selectedStyle, seed });
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
          <div className="relative w-8 h-8 overflow-hidden rounded-md">
            <Image
              src={currentUrl}
              alt="Selected emoji"
              width={32}
              height={32}
              className="object-cover"
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
            <h4 className="text-sm font-medium">Select Emoji Style</h4>
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
          
          <div className="grid grid-cols-4 gap-2 mb-3">
            {EMOJI_STYLES.slice(0, 8).map((style) => (
              <button
                key={style}
                type="button"
                className={`p-1 rounded-md transition-colors ${
                  selectedStyle === style 
                    ? 'bg-primary/20 border-primary' 
                    : 'hover:bg-muted'
                } border`}
                onClick={() => handleStyleChange(style)}
              >
                <div className="relative w-full aspect-square overflow-hidden rounded-md">
                  <Image
                    src={generateEmojiUrl(style, getRandomSeed())}
                    alt={style}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
              </button>
            ))}
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">Current style: {selectedStyle}</span>
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