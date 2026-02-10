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

export const marketColors = {
    'Bariatrics': '#F3E5F5', 
    'Dermatology': '#E3F2FD', 
    'Neurology': '#E8F5E9',
    'NHR': '#FFF3E0', 
    'Oncology': '#FCE4EC', 
    'Ophthalmology': '#E0F7FA',
    'Other': '#ECEFF1'  
};

export const clientColors = {
    'AbbVie/Skyrizi': '#00a3df', 
    'AbbVie/Rinvoq': '#ffd100',   
    'AbbVie/Allergan': '#ccbd7cff',
    'AbbVie/Lo Loestrin': '#d1b435',
    'AbbVie/Vyalev': '#e2ca5eff',
    'Amgen/Uplizna': '#823f98',   
    'Arcutis/Zoryve': '#408babe6',  
    'AZ/Calquence': '#dc4405', 
    'AZ/Camizestrant': '#e4980b', 
    'AZ/Imfinzi': '#A12830',     
    'AZ/One Lung': '#7e2c47',  
    'AZ/Tagrisso': '#5b305d',   
    'AZ/Truqap': '#250e62', 
    'American Regent/Gvoke VialDx': '#3cb371', 
    'Bayer/Claritin': '#8192abff', 
    'Beiersdorf/Body': '#92a9cc',   
    'Beiersdorf/Eczema': '#a70531',  
    'LEO/Spevigo': '#403a60',   
    'BMS/Breyansi': '#1d428a', 
    'Genetix/Lyfgenia': '#0f44d3dc',
    'Canfield Scientific': '#3b63d1dc',
    'Castle': '#0b4d89',  
    'Exelixis/Cabometyx': '#005689',
    'Galderma/Nemluvio': '#475ef2',  
    'Genentech/Vabysmo': '#a48aff',  
    'Genentech/Vabsymo': '#a48aff',
    'Genentech/Itovebi': '#9982e9ff',
    'Genentech/Susvimo': '#6f51dbff',
    'Genentech/Venclexta': "rgb(102, 128, 214)",
    'Genentech/Tecentriq': '#6448c9ff',
    'Genentech/Phesgo': '#D884F0',
    'Incyte/Opzelura': '#2c2851',  
    'J&J/Carvykti': '#d13b4c',
    'La Roche Posay / MelaB3': '#cca01d',
    'LEO/Delgocitinib': '#204131', 
    'Lilly/Kisunla': '#ffc000',
    'Lilly/Verzenio': '#0078a3', 
    'Lilly/EBC': '#00a1a3', 
    'Lilly/Inluriyo': '#d52b1e', 
    'Lilly/Med Affairs': '#0067a3ff', 
    'Medtronic/Signia': '#1010eb', 
    'None': '#FFFFFF',
    'Ortho/Cabtreo': '#164e89',  
    'Skinbetter': '#faede1',   
    'Skinceuticals': '#da8585', 
    'Sun/Absorica': '#00b5d1e6',
    'Sun/Winlevi': '#00b5d1e6',
    'Sun/Leqselvi': '#003763',
    'LEO/Adbry': '#284032',
    'LEO/Anzupgo': '#75a07f',
    'BMS/Breyanzi': '#be2bbb',
    'Neutrogena': '#8dcddb'
};

export const projectColors = {
    "2H Nurse EP": '#91a5d0',
    "2H Nurse Conference Coverage": '#91a5d0',
    '2H Patient Podcast': '#91a5d0',
    '2H Patient Video': '#91a5d0',
    'Biorewind Video Project': '#4CB7E4', 
    'BT': '#00984a',   
    'Conf Cov: AAD 2025': '#3D9285',    
    'Conf Cov: AAD 2025 Summer': '#EEF687', 
    'Conf Cov: MD NPPA Fall': '#F4A64E',
    'Conf Cov: ASCO GI 2026': '#e9810bff',     
    'Conf Cov: DEF 2026': '#d48a36ff', 
    'Conf Cov: AAD 2026 Summer': '#d1934bff', 
    'CU Breast Cancer': '#E232B3',       
    'CU GPP': '#c1ad7d',  
    'CU Oncology': '#c1ad7d',   
    'CU Acne': '#7d91c1',        
    'CU Adv and MBCs': '#526fb3',          
    'CU Unsponsored': '#D3D3D3', 
    'Custom Email': '#4ED4C9',
    'Data Release eNLs': '#2a968dff',
    'EP Parkinsons': '#9CD481',              
    'EP AD': '#9CD481',       
    'EP Acne': '#9CD481',              
    'EP CHE': '#9CD481',                   
    'EP GPP': '#9CD481',
    'EP Bladder Cancers': '#9CD481',
    'EP Gastrointestinal Cancers': '#9CD481',             
    'EP Melanoma/SCC': '#9CD481',   
    'EP Melanoma': '#9CD481',     
    'EP SCC': '#9CD481',    
    'EP NET': '#9CD481',   
    'EP in PN': '#9CD481',                 
    'EP PIA': '#9CD481',                   
    'EP RCC': '#9CD481',
    'EP Alopecia': '#9CD481',
    'EP Skincare Science': '#9CD481',             
    'EP Therapeutic Skincare': '#9CD481',  
    'EP VIT': '#9CD481',   
    'FAQ Brochure': '#7ee44c',                
    'Hot Topics- Derm': '#EE8585',          
    'Hot Topics- Neurology': '#EE8585',
    'Hot Topics- Other': '#EE8585',     
    'Hot Topics- Oncology': '#EE8585',      
    'ICNS': '#4A75BA',      
    'Insights in Pediatric Derm Video Series': '#c895f2',           
    'JCAD Journal': '#028378',     
    'JCADTV Unsponsored': '#438496',  
    'JCAD Online Leaderboard Ad': '#438496',  
    'Manuscript Supplement': '#4d64a4',      
    'NHR': '#4d64a4',
    'NPPA': '#58327f',                   
    'Patient Edition': '#AF52DE',  
    'Patient Podcast': '#9b5eb9',    
    'Patient / KOL Series': '#7d419b',     
    'Podcast': '#045f1c', 
    'Treatment Perspectives Video': '#52dec0',       
    'Triggered Email': '#E695F0',
    'JCADTV Journal Review': '#006A61',
    'Show Dailies': '#C3D6EC',
    'Roundtable Video Series': '#75b1f5ff',
    'Webinar- Gastrointestinal Cancers': '#8ef3a4ff',
    'Webinar- Metastatic Breast Cancer': '#8eecf3',
    'Webinar- Early Breast Cancer': '#85eeee'             
};

export const statusColors = {
    currentWeek: '#F0F9FF',    
    upcoming: '#FFF9C4',        
    overdue: '#FFEBEE',   
    completed: '#F1F8F1'   
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