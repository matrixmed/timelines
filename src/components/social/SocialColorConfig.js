export const platformColors = {
  'LinkedIn': '#0077B5',
  'Twitter/X': '#000000',
  'Facebook': '#1877F2',
  'Instagram': '#E4405F'
};

export const socialStatusColors = {
  'In Progress': '#3b82f6',
  'Standby': '#f59e0b',
  'Pending': '#8b5cf6',
  'Complete': '#22c55e'
};

export const brandColors = {
  'JCAD': '#00857a',
  'ICNS': '#4A75BA',
  'ONCOLOGY': '#2a5fa3',
  'NHR': '#4d64a4',
  'NPPA': '#543378'
};

export const contentTypeColors = {
  'Graphic': '#6366f1',
  'Reel': '#ec4899',
  'Visual': '#14b8a6',
  'Video': '#f97316'
};

const getContrastText = (hex) => {
  if (!hex) return '#000';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000' : '#fff';
};

export const socialColorConfig = {
  platforms: platformColors,
  statuses: socialStatusColors,
  brands: brandColors,
  contentTypes: contentTypeColors,
  getContrastText,
  getColor: (type, key) => {
    switch (type) {
      case 'platform':
        return platformColors[key] || null;
      case 'status':
        return socialStatusColors[key] || null;
      case 'brand':
        return brandColors[key] || null;
      case 'content':
        return contentTypeColors[key] || null;
      default:
        return null;
    }
  }
};