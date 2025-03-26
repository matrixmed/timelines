import config from '../config';

let markets = ['Bariatrics', 'Dermatology', 'Neurology', 'NHR', 'Oncology', 'Ophthalmology', 'Other'];
let clients = [
  'AbbVie Skyrizi',
  'AbbVie/Rinvoq',
  'Amgen/Uplizna',
  'Arcutis/Zoryve',
  'AZ/Calquence',
  'AZ/Imfinzi',
  'AZ/One Lung',
  'AZ/Tagrisso',
  'AZ/Truqap',
  'Beiersdorf/Body',
  'Beiersdorf/Eczema',
  'BI/Spevigo',
  'BMS/Breyansi',
  'Castle',
  'Exelixis/Cabometyx',
  'Genentech/Vabysmo',
  'Incyte/Opzelura',
  'J&J/Carvykti',
  'LEO/Delgocitinib',
  'Lilly/Kisunla',
  'Lilly/Verzenio',
  'Medtronic/Signia',
  'None',
  'Ortho/Cabtreo',
  'Skinbetter',
  'Skinceuticals',
  'Sun/Winlevi'
];
let projects = [
  'Biorewind Video Project',
  'BT',
  'Conf Cov: AAD 2025',
  'Conf Cov: AAD 2025 Summer',
  'Conf Cov: MD NPPA Fall',
  'CU Breast Cancer',
  'CU GPP',
  'CU Unsponsored',
  'Custom Email',
  'EP AD',
  'EP CHE',
  'EP GPP',
  'EP Melanoma/SCC',
  'EP NET',
  'EP PIA',
  'EP RCC',
  'EP Therapeutic Skincare',
  'EP VIT',
  'Hot Topics- Derm',
  'Hot Topics- Neurology',
  'Hot Topics- Oncology',
  'ICNS',
  'JCAD Journal',
  'JCADTV Unsponsored',
  'NHR',
  'NPPA/PIA',
  'Patient Edition',
  'Triggered Email'
];

export const fetchDropdownOptions = async () => {
  try {
    const response = await fetch(`${config.apiUrl}/api/timelines`);
    if (response.ok) {
      const data = await response.json();
      
      const uniqueMarkets = [...new Set(data.map(item => item.market).filter(Boolean))];
      const uniqueClients = [...new Set(data.map(item => item.clientSponsor).filter(Boolean))];
      const uniqueProjects = [...new Set(data.map(item => item.project).filter(Boolean))];
      
      const defaultMarkets = ['Bariatrics', 'Dermatology', 'Neurology', 'NHR', 'Oncology', 'Ophthalmology', 'Other'];
      const defaultClients = ['AbbVie Skyrizi', 'AbbVie/Rinvoq', 'Amgen/Uplizna', 'Arcutis/Zoryve', 'AZ/Calquence', 
                             'AZ/Imfinzi', 'AZ/One Lung', 'AZ/Tagrisso', 'AZ/Truqap', 'Beiersdorf/Body', 
                             'Beiersdorf/Eczema', 'BI/Spevigo', 'BMS/Breyansi', 'Castle', 'Exelixis/Cabometyx', 
                             'Genentech/Vabysmo', 'Incyte/Opzelura', 'J&J/Carvykti', 'LEO/Delgocitinib', 'Lilly/Kisunla', 
                             'Lilly/Verzenio', 'Medtronic/Signia', 'None', 'Ortho/Cabtreo', 'Skinbetter', 'Skinceuticals', 'Sun/Winlevi'];
      const defaultProjects = ['Biorewind Video Project', 'BT', 'Conf Cov: AAD 2025', 'Conf Cov: AAD 2025 Summer', 
                              'Conf Cov: MD NPPA Fall', 'CU Breast Cancer', 'CU GPP', 'CU Unsponsored', 'Custom Email', 
                              'EP AD', 'EP CHE', 'EP GPP', 'EP Melanoma/SCC', 'EP NET', 'EP PIA', 'EP RCC', 
                              'EP Therapeutic Skincare', 'EP VIT', 'Hot Topics- Derm', 'Hot Topics- Neurology', 
                              'Hot Topics- Oncology', 'ICNS', 'JCAD Journal', 'JCADTV Unsponsored', 'NHR', 
                              'NPPA/PIA', 'Patient Edition', 'Triggered Email'];
      
      markets = [...new Set([...defaultMarkets, ...uniqueMarkets])].sort();
      clients = [...new Set([...defaultClients, ...uniqueClients])].sort();
      projects = [...new Set([...defaultProjects, ...uniqueProjects])].sort();
    }
  } catch (error) {
    console.error('Failed to fetch dropdown options:', error);
  }
};

export const addUniqueValue = (type, value) => {
  if (!value) return;
  let targetArray;
  switch (type) {
    case 'market':
      targetArray = markets;
      break;
    case 'clientSponsor':
      targetArray = clients;
      break;
    case 'project':
      targetArray = projects;
      break;
    default:
      return;
  }
  if (!targetArray.includes(value)) {
    targetArray.push(value);
    targetArray.sort();
  }
};

export { markets, clients, projects };