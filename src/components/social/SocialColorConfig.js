import { colorConfig } from '../ColorConfig';

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

export const brandColors = colorConfig.clients;

export const socialColorConfig = {
  platforms: platformColors,
  statuses: socialStatusColors,
  brands: brandColors,
  getContrastText: colorConfig.getContrastText,
  getColor: (type, key) => {
    switch (type) {
      case 'platform':
        return platformColors[key] || null;
      case 'status':
        return socialStatusColors[key] || null;
      case 'brand':
        return brandColors[key] || null;
      default:
        return null;
    }
  }
};
