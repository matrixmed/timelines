export const platforms = ['LinkedIn', 'Twitter/X', 'Facebook', 'Instagram'];

export const socialStatuses = ['In Progress', 'Standby', 'Pending', 'Complete'];

export let socialBrands = [];

export const setSocialBrands = (brands) => {
  socialBrands = [...new Set(brands)].sort();
};
