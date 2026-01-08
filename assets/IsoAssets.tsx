
import React from 'react';

// === ISOMETRIC ASSETS ===
// Optimized for 120-degree isometric view (approx Width:Height = 1 : 0.58)

// 1. DEAD TREE (Based on the leafless, branching image)
const DeadTreeSVG = () => (
    <g>
        {/* Shadow */}
        <ellipse cx="50" cy="85" rx="25" ry="12" fill="#000" opacity="0.2" />
        
        {/* Trunk & Branches */}
        <path d="M50 90 
                 Q 55 70 52 50 
                 Q 48 40 50 30 
                 L 40 15 
                 M 50 30 L 60 15 
                 M 52 50 L 75 35 
                 L 85 25 
                 M 75 35 L 70 20 
                 M 52 50 Q 40 45 30 40 
                 L 20 25 
                 M 30 40 L 25 50" 
              fill="none" stroke="#5c4033" strokeWidth="4" strokeLinecap="round" />
        
        {/* Finer Branches */}
        <path d="M 40 15 L 35 5 M 40 15 L 45 5
                 M 60 15 L 55 5 M 60 15 L 65 5
                 M 85 25 L 90 20 M 85 25 L 90 30
                 M 20 25 L 15 20 M 20 25 L 15 30" 
              fill="none" stroke="#5c4033" strokeWidth="2" strokeLinecap="round" />
              
        {/* Root hints */}
        <path d="M 50 90 L 40 98 M 50 90 L 60 98" stroke="#5c4033" strokeWidth="3" />
    </g>
);

// 2. AMAZONIA TREE (Based on the tall green tree image)
const AmazoniaTreeSVG = () => (
    <g>
        {/* Shadow */}
        <ellipse cx="50" cy="85" rx="30" ry="15" fill="#000" opacity="0.2" />

        {/* Trunk */}
        <path d="M50 90 L 55 70 L 52 50 L 48 50 L 45 70 Z" fill="#4a3e36" />
        
        {/* Canopy Layers - Lush & Round */}
        {/* Bottom Layer */}
        <path d="M 20 60 Q 50 70 80 60 Q 90 50 80 40 Q 50 30 20 40 Q 10 50 20 60 Z" fill="#166534" />
        <path d="M 20 60 Q 50 70 80 60" fill="none" stroke="#14532d" strokeWidth="1" opacity="0.5"/>
        
        {/* Middle Layer */}
        <path d="M 25 45 Q 50 55 75 45 Q 85 35 75 25 Q 50 15 25 25 Q 15 35 25 45 Z" fill="#15803d" />
        
        {/* Top Layer */}
        <path d="M 35 30 Q 50 35 65 30 Q 70 20 65 10 Q 50 0 35 10 Q 30 20 35 30 Z" fill="#22c55e" />
    </g>
);

// 3. CERRADO TREE (Based on the slender/bushy tree image)
const CerradoTreeSVG = () => (
    <g>
         {/* Shadow */}
        <ellipse cx="50" cy="85" rx="25" ry="12" fill="#000" opacity="0.2" />

        {/* Trunk - More twisted */}
        <path d="M50 90 Q 60 70 50 50 Q 40 40 50 30" fill="none" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
        
        {/* Canopy - Scattered clumps */}
        <circle cx="50" cy="30" r="20" fill="#65a30d" />
        <circle cx="35" cy="40" r="15" fill="#4d7c0f" />
        <circle cx="65" cy="35" r="15" fill="#4d7c0f" />
        <circle cx="50" cy="15" r="12" fill="#84cc16" />
        
        {/* Highlights */}
        <path d="M 40 30 Q 50 20 60 30" fill="none" stroke="#ecfccb" strokeWidth="2" opacity="0.5" />
    </g>
);

// Map assets to arrays for random selection (as requested)
export const DEAD_TREES = [
  <DeadTreeSVG key="d1" />
];

export const AMAZONIA_TREES = [
  <AmazoniaTreeSVG key="a1" />
];

export const CERRADO_TREES = [
  <CerradoTreeSVG key="c1" />
];

export const PALMS = [
  <g key="p1">
      <ellipse cx="50" cy="85" rx="20" ry="10" fill="#000" opacity="0.2" />
      <path d="M48 90 L52 90 L50 40 L48 90" fill="#5c4033"/>
      <path d="M50 40 L20 30 M50 40 L80 30 M50 40 L20 50 M50 40 L80 50 M50 40 L50 10" stroke="#15803d" strokeWidth="3" strokeLinecap="round"/>
  </g>
];

export const TREE_NAMES: Record<string, string[]> = {
    P1: ["Sumaúma", "Açaí Palm", "Rubber Tree", "Brazil Nut", "Cacao Tree"],
    P2: ["Ipê Amarelo", "Pequi Tree", "Ipê Roxo", "Buriti Palm", "Cagaiteira"]
};

// Map Pin for Animals
export const AnimalPin = () => (
    <g transform="translate(50, 60)">
        {/* Pin Shape */}
        <path d="M-15 -30 C-15 -45 15 -45 15 -30 C15 -20 0 0 0 0 C0 0 -15 -20 -15 -30" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
        <circle cx="0" cy="-30" r="8" fill="white" />
        {/* Paw Print inside */}
        <g transform="translate(-4, -34) scale(0.3)">
            <path d="M12 25C12 25 25 25 25 25C25 25 25 12 25 12C25 12 12 12 12 12C12 12 12 25 12 25Z" fill="#dc2626"/> 
            <circle cx="10" cy="10" r="5" fill="#dc2626"/>
            <circle cx="20" cy="5" r="5" fill="#dc2626"/>
            <circle cx="30" cy="10" r="5" fill="#dc2626"/>
            <circle cx="20" cy="20" r="8" fill="#dc2626"/>
        </g>
    </g>
);

// 120-Degree Isometric Ground Tile
// Standard Isometric is 2:1 (26.5 deg). 120 deg means 30 deg inclination.
// Tan(30) = 0.577. 
// So for Width 100, Height should be ~58.
export const GroundTile = () => (
    <g>
        {/* Base Block (Dirt) */}
        <path d="M0 29 L50 0 L100 29 L50 58 Z" fill="#57534e" stroke="#44403c" strokeWidth="1" />
        
        {/* Side Walls (Thickness) */}
        <path d="M0 29 L50 58 L50 68 L0 39 Z" fill="#292524" />
        <path d="M50 58 L100 29 L100 39 L50 68 Z" fill="#1c1917" />
        
        {/* Top Highlight/Grass tint */}
        <path d="M5 29 L50 3 L95 29 L50 55 Z" fill="#a8a29e" opacity="0.1" />
    </g>
);
