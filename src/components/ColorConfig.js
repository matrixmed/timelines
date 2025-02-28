const getContrastText = (bgColor) => {
    if (!bgColor) return '#000000';

    try {
        const hex = bgColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    } catch (e) {
        return '#000000';
    }
};

// Market Colors - Using soft, distinguishable backgrounds
export const marketColors = {
    'Bariatrics': '#F3E5F5',     // Soft purple
    'Dermatology': '#E3F2FD',    // Soft blue
    'Neurology': '#E8F5E9',      // Soft green
    'NHR': '#FFF3E0',            // Soft orange
    'Oncology': '#FCE4EC',       // Soft pink
    'Ophthalmology': '#E0F7FA',  // Soft cyan
    'Other': '#ECEFF1'           // Soft gray-blue
};

// Client Colors - Using stronger, branded-looking colors
export const clientColors = {
    'AbbVie Skyrizi': '#4A90E2',      // Blue
    'AbbVie/Rinvoq': '#5B9BD5',       // Light blue
    'Amgen/Uplizna': '#70AD47',       // Green
    'Arcutis/Zoryve': '#FF9F40',      // Orange
    'AZ/Calquence': '#98FB98',        // Pale green
    'AZ/Imfinzi': '#87CEEB',          // Sky blue
    'AZ/One Lung': '#DDA0DD',         // Plum
    'AZ/Tagrisso': '#F08080',         // Light coral
    'AZ/Truqap': '#FFB6C1',           // Light pink
    'Beiersdorf/Body': '#B4A7D6',     // Light purple
    'Beiersdorf/Eczema': '#A4C2F4',   // Light blue-gray
    'BI/Spevigo': '#FFD700',          // Gold
    'BMS/Breyansi': '#9FC5E8',        // Pale blue
    'Castle': '#B6D7A8',              // Pale green
    'Exelixis/Cabometyx': '#EA9999',  // Light red
    'Genentech/Vabysmo': '#FFB366',   // Light orange
    'Incyte/Opzelura': '#A2C4C9',     // Gray-blue
    'J&J/Carvykti': '#D5A6BD',        // Dusty rose
    'Lilly/Kisunla': '#C27BA0',       // Mauve
    'Lilly/Verzenio': '#FF69B4',      // Hot pink
    'Medtronic/Signia': '#93C47D',    // Forest green
    'None': '#FFFFFF',                // White
    'Ortho/Cabtreo': '#F6B26B',       // Light orange
    'Skinbetter': '#87CEEB',          // Sky blue
    'Skinceuticals': '#76A5AF',       // Steel blue
    'Sun/Winlevi': '#FFA07A'          // Light salmon
};

// Project Colors - Using a mix of pastels and professional tones
export const projectColors = {
    'Biorewind Video Project': '#ADD8E6',    // Light blue
    'BT': '#98FB98',                         // Pale green
    'Conf Cov: AAD 2025': '#FFE4B5',         // Moccasin
    'Conf Cov: AAD 2025 Summer': '#F0E68C',  // Khaki
    'Conf Cov: MD NPPA Fall': '#DEB887',     // Burlywood
    'CU Breast Cancer': '#FFB6C1',           // Light pink
    'CU GPP': '#E6E6FA',                     // Lavender
    'CU Unsponsored': '#D3D3D3',             // Light gray
    'Custom Email': '#90EE90',               // Light green
    'EP AD': '#B8860B',                      // Dark goldenrod
    'EP GPP': '#87CEFA',                     // Light sky blue
    'EP Melanoma/SCC': '#F4A460',            // Sandy brown
    'EP NET': '#20B2AA',                     // Light sea green
    'EP PIA': '#778899',                     // Light slate gray
    'EP RCC': '#CD853F',                     // Peru
    'EP Therapeutic Skincare': '#DDA0DD',    // Plum
    'EP VIT': '#B0C4DE',                     // Light steel blue
    'Hot Topics- Derm': '#FFA07A',           // Light salmon
    'Hot Topics- Neurology': '#87CEEB',      // Sky blue
    'Hot Topics- Oncology': '#98FB98',       // Pale green
    'ICNS': '#DEB887',                       // Burlywood
    'JCAD Journal': '#DDA0DD',               // Plum
    'JCADTV Unsponsored': '#D3D3D3',         // Light gray
    'NHR': '#FF6B6B',                        // Light red
    'NPPA/PIA': '#778899',                   // Light slate gray
    'Patient Edition': '#FFB6C1',            // Light pink
    'Triggered Email': '#90EE90'             // Light green
};

// Status Colors
export const statusColors = {
    currentWeek: '#F0F9FF',      // Very light blue for current week
    upcoming: '#FFF9C4',         // Light yellow for upcoming deadlines
    overdue: '#FFEBEE',          // Light red for overdue items
    completed: '#F1F8F1'         // Light green for completed items
};

const getColor = (colorMap, key) => {
    return colorMap[key] || null;
};

export const colorConfig = {
    markets: marketColors,
    clients: clientColors,
    projects: projectColors,
    status: statusColors,
    getContrastText,
    getColor: (type, key) => {
        switch (type) {
            case 'market':
                return getColor(marketColors, key);
            case 'client':
                return getColor(clientColors, key);
            case 'project':
                return getColor(projectColors, key);
            case 'status':
                return getColor(statusColors, key);
            default:
                return null;
        }
    }
};