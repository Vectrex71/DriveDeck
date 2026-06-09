export interface UnsplashBanner {
  name: string;
  url: string;
  photographer: string;
  photographerUrl: string;
  tags: string[];
}

export const CURATED_BANNERS: UnsplashBanner[] = [
  // Abstract & Gradient
  {
    name: 'Sunset Aura Gradient',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    photographer: 'Simeon Muller',
    photographerUrl: 'https://unsplash.com/@simeonmuller',
    tags: ['gradient', 'orange', 'purple', 'sunset', 'aura', 'abstract', 'minimalist', 'bunt']
  },
  {
    name: 'Blue Liquid Silk',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200&auto=format&fit=crop&q=80',
    photographer: 'Europeana',
    photographerUrl: 'https://unsplash.com/@europeana',
    tags: ['blue', 'abstract', 'painting', 'liquid', 'silk', 'art', 'blau', 'farbe']
  },
  {
    name: 'Pastel Dreams',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&auto=format&fit=crop&q=80',
    photographer: 'Pawel Czerwinski',
    photographerUrl: 'https://unsplash.com/@pawel_czerwinski',
    tags: ['gradient', 'pastel', 'pink', 'purple', 'smooth', 'abstract', 'rosa', 'lila']
  },
  {
    name: 'Holographic Ripple',
    url: 'https://images.unsplash.com/photo-1618005198143-e5283b519a7f?w=1200&auto=format&fit=crop&q=80',
    photographer: 'Simeon Muller',
    photographerUrl: 'https://unsplash.com/@simeonmuller',
    tags: ['gradient', 'holo', 'holographic', 'ripple', 'wave', 'abstract', 'bunt']
  },

  // Space & Cosmic
  {
    name: 'Deep Cosmic Stars',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
    photographer: 'NASA',
    photographerUrl: 'https://unsplash.com/@nasa',
    tags: ['space', 'galaxy', 'cosmic', 'stars', 'nebula', 'weltall', 'sterne', 'weltraum', 'dark']
  },
  {
    name: 'Violet Nebula Spark',
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&auto=format&fit=crop&q=80',
    photographer: 'NASA',
    photographerUrl: 'https://unsplash.com/@nasa',
    tags: ['space', 'nebula', 'cosmic', 'violet', 'stars', 'deep space', 'lila', 'weltraum']
  },
  {
    name: 'Lunar Horizon',
    url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1200&auto=format&fit=crop&q=80',
    photographer: 'Vincentiu Solomon',
    photographerUrl: 'https://unsplash.com/@vincentiusolomon',
    tags: ['moon', 'space', 'horizon', 'stars', 'cosmic', 'mond', 'nacht', 'dark']
  },

  // Nature & Landscape
  {
    name: 'Solitary Rainforest Tree',
    url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&auto=format&fit=crop&q=80',
    photographer: 'Veeterzy',
    photographerUrl: 'https://unsplash.com/@veeterzy',
    tags: ['tree', 'forest', 'nature', 'green', 'rainforest', 'wald', 'natur', 'baum', 'grün']
  },
  {
    name: 'Dune Minimal Vista',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80',
    photographer: 'Kalen Emsley',
    photographerUrl: 'https://unsplash.com/@kalenemsley',
    tags: ['dune', 'desert', 'minimalist', 'nature', 'sand', 'sky', 'wüste', 'himmel', 'warm']
  },
  {
    name: 'Foggy Pine Woods',
    url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1200&auto=format&fit=crop&q=80',
    photographer: 'Lukasz Szmigiel',
    photographerUrl: 'https://unsplash.com/@szmigieldesign',
    tags: ['nature', 'forest', 'pine', 'fog', 'trees', 'wald', 'natur', 'nebel', 'grün']
  },
  {
    name: 'Ocean Waves Topdown',
    url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1200&auto=format&fit=crop&q=80',
    photographer: 'Ishak Kacel',
    photographerUrl: 'https://unsplash.com/@ishakkacel',
    tags: ['ocean', 'sea', 'water', 'beach', 'waves', 'blue', 'meer', 'strand', 'wasser', 'blau']
  },
  {
    name: 'Autumn Gold Woods',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    photographer: 'John Fowler',
    photographerUrl: 'https://unsplash.com/@johnfowler',
    tags: ['autumn', 'forest', 'gold', 'yellow', 'leaves', 'river', 'herbst', 'wald', 'natur', 'fluss']
  },
  {
    name: 'Mount Fuji Cherry Blossom',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80',
    photographer: 'Sora Sagano',
    photographerUrl: 'https://unsplash.com/@sorasagano',
    tags: ['japan', 'mountain', 'fuji', 'cherry blossom', 'flowers', 'pink', 'kirschblüte', 'berg']
  },

  // Tech & Workspace
  {
    name: 'Neotech Terminal Setup',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    photographer: 'Lorenzo Herrera',
    photographerUrl: 'https://unsplash.com/@lorenzoherrera',
    tags: ['tech', 'workspace', 'computer', 'setup', 'keyboard', 'retro', 'terminal', 'coding', 'entwicklung']
  },
  {
    name: 'Minimal Workspace Laptop',
    url: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1200&auto=format&fit=crop&q=80',
    photographer: 'Domenico Loia',
    photographerUrl: 'https://unsplash.com/@domenicoloia',
    tags: ['workspace', 'minimalist', 'office', 'laptop', 'coffee', 'schreibtisch', 'kaffee', 'arbeit']
  },
  {
    name: 'Neon Cyberpunk Street',
    url: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=1200&auto=format&fit=crop&q=80',
    photographer: 'Sohail Na',
    photographerUrl: 'https://unsplash.com/@sohail_7',
    tags: ['cyberpunk', 'neon', 'tokyo', 'street', 'night', 'retro', 'stadt', 'nacht', 'pink']
  },

  // Floral & Art
  {
    name: 'Midnight Floral Oil',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
    photographer: 'Europeana',
    photographerUrl: 'https://unsplash.com/@europeana',
    tags: ['blue abstract', 'flowers', 'oil painting', 'art', 'floral', 'dark', 'blumen', 'kunst']
  },
  {
    name: 'Eucalyptus Soft Leaves',
    url: 'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=1200&auto=format&fit=crop&q=80',
    photographer: 'Kari Shea',
    photographerUrl: 'https://unsplash.com/@karishea',
    tags: ['eucalyptus', 'leaves', 'minimalist', 'nature', 'aesthetic', 'plant', 'grün', 'pflanze']
  },

  // City & Architecture
  {
    name: 'Manhattan Blue Hour Skyline',
    url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&auto=format&fit=crop&q=80',
    photographer: 'Suneil Konda',
    photographerUrl: 'https://unsplash.com/@suneilkonda',
    tags: ['city', 'new york', 'manhattan', 'skyline', 'architecture', 'night', 'stadt', 'hochhaus']
  },
  {
    name: 'Spiraling Concrete Dome',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    photographer: 'Jared Rice',
    photographerUrl: 'https://unsplash.com/@jaredrice',
    tags: ['architecture', 'minimalist', 'concrete', 'staircase', 'line', 'design', 'modern']
  },
  {
    name: 'Scenic Swiss Alps Train',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    photographer: 'John Fowler',
    photographerUrl: 'https://unsplash.com/@johnfowler',
    tags: ['reisen', 'switzerland', 'berge', 'alpen', 'train', 'landscape', 'mountain']
  }
];
