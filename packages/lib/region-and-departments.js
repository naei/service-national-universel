const departmentLookUp = {
  "01": "Ain",
  "02": "Aisne",
  "03": "Allier",
  "04": "Alpes-de-Haute-Provence",
  "05": "Hautes-Alpes",
  "06": "Alpes-Maritimes",
  "07": "Ardèche",
  "08": "Ardennes",
  "09": "Ariège",
  10: "Aube",
  11: "Aude",
  12: "Aveyron",
  13: "Bouches-du-Rhône",
  14: "Calvados",
  15: "Cantal",
  16: "Charente",
  17: "Charente-Maritime",
  18: "Cher",
  19: "Corrèze",
  20: "Corse",
  21: "Côte-d'Or",
  22: "Côtes-d'Armor",
  23: "Creuse",
  24: "Dordogne",
  25: "Doubs",
  26: "Drôme",
  27: "Eure",
  28: "Eure-et-Loir",
  29: "Finistère",
  "2A": "Corse-du-Sud",
  "2B": "Haute-Corse",
  30: "Gard",
  31: "Haute-Garonne",
  32: "Gers",
  33: "Gironde",
  34: "Hérault",
  35: "Ille-et-Vilaine",
  36: "Indre",
  37: "Indre-et-Loire",
  38: "Isère",
  39: "Jura",
  40: "Landes",
  41: "Loir-et-Cher",
  42: "Loire",
  43: "Haute-Loire",
  44: "Loire-Atlantique",
  45: "Loiret",
  46: "Lot",
  47: "Lot-et-Garonne",
  48: "Lozère",
  49: "Maine-et-Loire",
  50: "Manche",
  51: "Marne",
  52: "Haute-Marne",
  53: "Mayenne",
  54: "Meurthe-et-Moselle",
  55: "Meuse",
  56: "Morbihan",
  57: "Moselle",
  58: "Nièvre",
  59: "Nord",
  60: "Oise",
  61: "Orne",
  62: "Pas-de-Calais",
  63: "Puy-de-Dôme",
  64: "Pyrénées-Atlantiques",
  65: "Hautes-Pyrénées",
  66: "Pyrénées-Orientales",
  67: "Bas-Rhin",
  68: "Haut-Rhin",
  69: "Rhône",
  70: "Haute-Saône",
  71: "Saône-et-Loire",
  72: "Sarthe",
  73: "Savoie",
  74: "Haute-Savoie",
  75: "Paris",
  76: "Seine-Maritime",
  77: "Seine-et-Marne",
  78: "Yvelines",
  79: "Deux-Sèvres",
  80: "Somme",
  81: "Tarn",
  82: "Tarn-et-Garonne",
  83: "Var",
  84: "Vaucluse",
  85: "Vendée",
  86: "Vienne",
  87: "Haute-Vienne",
  88: "Vosges",
  89: "Yonne",
  90: "Territoire de Belfort",
  91: "Essonne",
  92: "Hauts-de-Seine",
  93: "Seine-Saint-Denis",
  94: "Val-de-Marne",
  95: "Val-d'Oise",
  971: "Guadeloupe",
  "971b": "Saint-Barthélemy",
  972: "Martinique",
  973: "Guyane",
  974: "La Réunion",
  975: "Saint-Pierre-et-Miquelon",
  976: "Mayotte",
  978: "Saint-Martin",
  984: "Terres australes et antarctiques françaises",
  986: "Wallis-et-Futuna",
  987: "Polynésie française",
  988: "Nouvelle-Calédonie",
};

const departmentList = Object.values(departmentLookUp);

const getDepartmentNumber = (d) => Object.keys(departmentLookUp).find((key) => departmentLookUp[key] === d);

const getDepartmentByZip = (zip) => {
  if (!zip) return;
  if (zip.length !== 5) return;

  let departmentCode;
  if (parseInt(zip) >= 96000) {
    departmentCode = zip.substr(0, 3);
  } else {
    departmentCode = zip.substr(0, 2);
  }
  return departmentLookUp[departmentCode];
};

const getRegionByZip = (zip) => {
  if (!zip) return;
  if (zip.length !== 5) return;

  const department = getDepartmentByZip(zip);
  return department2region[department];
};

const regionList = [
  "Auvergne-Rhône-Alpes",
  "Bourgogne-Franche-Comté",
  "Bretagne",
  "Centre-Val de Loire",
  "Corse",
  "Grand Est",
  "Hauts-de-France",
  "Île-de-France",
  "Normandie",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Pays de la Loire",
  "Provence-Alpes-Côte d'Azur",
  "Guadeloupe",
  "Martinique",
  "Guyane",
  "La Réunion",
  "Saint-Pierre-et-Miquelon",
  "Mayotte",
  "Terres australes et antarctiques françaises",
  "Wallis-et-Futuna",
  "Polynésie française",
  "Nouvelle-Calédonie",
];

// Attention : Polynésie française et Nouvelle-Calédonie ne sont pas des DROMS mais des cas à part.
const regionsListDROMS = [
  "Guadeloupe",
  "Martinique",
  "Guyane",
  "La Réunion",
  "Saint-Pierre-et-Miquelon",
  "Mayotte",
  "Terres australes et antarctiques françaises",
  "Wallis-et-Futuna",
];


const department2region = {
  Ain: "Auvergne-Rhône-Alpes",
  Aisne: "Hauts-de-France",
  Allier: "Auvergne-Rhône-Alpes",
  "Alpes-de-Haute-Provence": "Provence-Alpes-Côte d'Azur",
  "Hautes-Alpes": "Provence-Alpes-Côte d'Azur",
  "Alpes-Maritimes": "Provence-Alpes-Côte d'Azur",
  Ardèche: "Auvergne-Rhône-Alpes",
  Ardennes: "Grand Est",
  Ariège: "Occitanie",
  Aube: "Grand Est",
  Aude: "Occitanie",
  Aveyron: "Occitanie",
  "Bouches-du-Rhône": "Provence-Alpes-Côte d'Azur",
  Calvados: "Normandie",
  Cantal: "Auvergne-Rhône-Alpes",
  Charente: "Nouvelle-Aquitaine",
  "Charente-Maritime": "Nouvelle-Aquitaine",
  Cher: "Centre-Val de Loire",
  Corrèze: "Nouvelle-Aquitaine",
  "Côte-d'Or": "Bourgogne-Franche-Comté",
  "Côtes-d'Armor": "Bretagne",
  Creuse: "Nouvelle-Aquitaine",
  Dordogne: "Nouvelle-Aquitaine",
  Doubs: "Bourgogne-Franche-Comté",
  Drôme: "Auvergne-Rhône-Alpes",
  Eure: "Normandie",
  "Eure-et-Loir": "Centre-Val de Loire",
  Finistère: "Bretagne",
  "Corse-du-Sud": "Corse",
  "Haute-Corse": "Corse",
  Corse: "Corse",
  Gard: "Occitanie",
  "Haute-Garonne": "Occitanie",
  Gers: "Occitanie",
  Gironde: "Nouvelle-Aquitaine",
  Hérault: "Occitanie",
  "Ille-et-Vilaine": "Bretagne",
  Indre: "Centre-Val de Loire",
  "Indre-et-Loire": "Centre-Val de Loire",
  Isère: "Auvergne-Rhône-Alpes",
  Jura: "Bourgogne-Franche-Comté",
  Landes: "Nouvelle-Aquitaine",
  "Loir-et-Cher": "Centre-Val de Loire",
  Loire: "Auvergne-Rhône-Alpes",
  "Haute-Loire": "Auvergne-Rhône-Alpes",
  "Loire-Atlantique": "Pays de la Loire",
  Loiret: "Centre-Val de Loire",
  Lot: "Occitanie",
  "Lot-et-Garonne": "Nouvelle-Aquitaine",
  Lozère: "Occitanie",
  "Maine-et-Loire": "Pays de la Loire",
  Manche: "Normandie",
  Marne: "Grand Est",
  "Haute-Marne": "Grand Est",
  Mayenne: "Pays de la Loire",
  "Meurthe-et-Moselle": "Grand Est",
  Meuse: "Grand Est",
  Morbihan: "Bretagne",
  Moselle: "Grand Est",
  Nièvre: "Bourgogne-Franche-Comté",
  Nord: "Hauts-de-France",
  Oise: "Hauts-de-France",
  Orne: "Normandie",
  "Pas-de-Calais": "Hauts-de-France",
  "Puy-de-Dôme": "Auvergne-Rhône-Alpes",
  "Pyrénées-Atlantiques": "Nouvelle-Aquitaine",
  "Hautes-Pyrénées": "Occitanie",
  "Pyrénées-Orientales": "Occitanie",
  "Bas-Rhin": "Grand Est",
  "Haut-Rhin": "Grand Est",
  Rhône: "Auvergne-Rhône-Alpes",
  "Haute-Saône": "Bourgogne-Franche-Comté",
  "Saône-et-Loire": "Bourgogne-Franche-Comté",
  Sarthe: "Pays de la Loire",
  Savoie: "Auvergne-Rhône-Alpes",
  "Haute-Savoie": "Auvergne-Rhône-Alpes",
  Paris: "Île-de-France",
  "Seine-Maritime": "Normandie",
  "Seine-et-Marne": "Île-de-France",
  Yvelines: "Île-de-France",
  "Deux-Sèvres": "Nouvelle-Aquitaine",
  Somme: "Hauts-de-France",
  Tarn: "Occitanie",
  "Tarn-et-Garonne": "Occitanie",
  Var: "Provence-Alpes-Côte d'Azur",
  Vaucluse: "Provence-Alpes-Côte d'Azur",
  Vendée: "Pays de la Loire",
  Vienne: "Nouvelle-Aquitaine",
  "Haute-Vienne": "Nouvelle-Aquitaine",
  Vosges: "Grand Est",
  Yonne: "Bourgogne-Franche-Comté",
  "Territoire de Belfort": "Bourgogne-Franche-Comté",
  Essonne: "Île-de-France",
  "Hauts-de-Seine": "Île-de-France",
  "Seine-Saint-Denis": "Île-de-France",
  "Val-de-Marne": "Île-de-France",
  "Val-d'Oise": "Île-de-France",
  Guadeloupe: "Guadeloupe",
  Martinique: "Martinique",
  Guyane: "Guyane",
  "La Réunion": "La Réunion",
  "Saint-Pierre-et-Miquelon": "Saint-Pierre-et-Miquelon",
  Mayotte: "Mayotte",
  "Saint-Barthélemy": "Guadeloupe",
  "Saint-Martin": "Guadeloupe",
  "Terres australes et antarctiques françaises": "Terres australes et antarctiques françaises",
  "Wallis-et-Futuna": "Wallis-et-Futuna",
  "Polynésie française": "Polynésie française",
  "Nouvelle-Calédonie": "Nouvelle-Calédonie",
};

const region2department = {
  "Auvergne-Rhône-Alpes": ["Ain", "Allier", "Ardèche", "Cantal", "Drôme", "Isère", "Loire", "Haute-Loire", "Puy-de-Dôme", "Rhône", "Savoie", "Haute-Savoie"],
  "Bourgogne-Franche-Comté": ["Côte-d'Or", "Doubs", "Jura", "Nièvre", "Haute-Saône", "Saône-et-Loire", "Yonne", "Territoire de Belfort"],
  Bretagne: ["Côtes-d'Armor", "Finistère", "Ille-et-Vilaine", "Morbihan"],
  "Centre-Val de Loire": ["Cher", "Eure-et-Loir", "Indre", "Indre-et-Loire", "Loir-et-Cher", "Loiret"],
  Corse: ["Corse", "Corse-du-Sud", "Haute-Corse"],
  "Grand Est": ["Ardennes", "Aube", "Marne", "Haute-Marne", "Meurthe-et-Moselle", "Meuse", "Moselle", "Bas-Rhin", "Haut-Rhin", "Vosges"],
  "Hauts-de-France": ["Aisne", "Nord", "Oise", "Pas-de-Calais", "Somme"],
  "Île-de-France": ["Paris", "Seine-et-Marne", "Yvelines", "Essonne", "Hauts-de-Seine", "Seine-Saint-Denis", "Val-de-Marne", "Val-d'Oise"],
  Normandie: ["Calvados", "Eure", "Manche", "Orne", "Seine-Maritime"],
  "Nouvelle-Aquitaine": [
    "Charente",
    "Charente-Maritime",
    "Corrèze",
    "Creuse",
    "Dordogne",
    "Gironde",
    "Landes",
    "Lot-et-Garonne",
    "Pyrénées-Atlantiques",
    "Deux-Sèvres",
    "Vienne",
    "Haute-Vienne",
  ],
  Occitanie: ["Ariège", "Aude", "Aveyron", "Gard", "Haute-Garonne", "Gers", "Hérault", "Lot", "Lozère", "Hautes-Pyrénées", "Pyrénées-Orientales", "Tarn", "Tarn-et-Garonne"],
  "Pays de la Loire": ["Loire-Atlantique", "Maine-et-Loire", "Mayenne", "Sarthe", "Vendée"],
  "Provence-Alpes-Côte d'Azur": ["Alpes-de-Haute-Provence", "Hautes-Alpes", "Alpes-Maritimes", "Bouches-du-Rhône", "Var", "Vaucluse"],
  Guadeloupe: ["Guadeloupe", "Saint-Martin", "Saint-Barthélemy"],
  Martinique: ["Martinique"],
  Guyane: ["Guyane"],
  "La Réunion": ["La Réunion"],
  "Saint-Pierre-et-Miquelon": ["Saint-Pierre-et-Miquelon"],
  Mayotte: ["Mayotte"],
  "Terres australes et antarctiques françaises": ["Terres australes et antarctiques françaises"],
  "Wallis-et-Futuna": ["Wallis-et-Futuna"],
  "Polynésie française": ["Polynésie française"],
  "Nouvelle-Calédonie": ["Nouvelle-Calédonie"],
};

const region2zone = {
  "Auvergne-Rhône-Alpes": "A",
  "Bourgogne-Franche-Comté": "A",
  Bretagne: "B",
  "Centre-Val de Loire": "B",
  Corse: "Corse",
  "Grand Est": "B",
  "Hauts-de-France": "B",
  "Île-de-France": "C",
  Normandie: "B",
  "Nouvelle-Aquitaine": "A",
  Occitanie: "C",
  "Pays de la Loire": "B",
  "Provence-Alpes-Côte d'Azur": "B",
  Guadeloupe: "DOM",
  Martinique: "DOM",
  Guyane: "DOM",
  "La Réunion": "DOM",
  "Saint-Pierre-et-Miquelon": "DOM",
  Mayotte: "DOM",
  "Terres australes et antarctiques françaises": "DOM",
  "Wallis-et-Futuna": "DOM",
  "Polynésie française": "PF",
  "Nouvelle-Calédonie": "NC",
  Etranger: "Etranger",
};

const getRegionForEligibility = (young) => {
  let region = young.schooled ? young.schoolRegion : young.region;
  if (!region) {
    let dep = young?.schoolDepartment || young?.department || getDepartmentByZip(young?.zip);
    if (dep && (!isNaN(dep) || ["2A", "2B", "02A", "02B"].includes(dep))) {
      if (dep.substring(0, 1) === "0" && dep.length === 3) dep = departmentLookUp[dep.substring(1)];
      else dep = departmentLookUp[dep];
    }
    region = department2region[dep] || getRegionByZip(young?.zip);
  }
  if (!region) region = "Etranger";
  return region;
};

const isFromMetropole = (young) => {
  const region = getRegionForEligibility(young);
  return region2zone[region] === "A" || region2zone[region] === "B" || region2zone[region] === "C";
};

const isFromDOMTOM = (young) => {
  const region = getRegionForEligibility(young);
  return region2zone[region] === "DOM";
};

const isFromFrenchPolynesia = (young) => {
  const region = getRegionForEligibility(young);
  return region2zone[region] === "PF";
};

const isFromNouvelleCaledonie = (young) => {
  const region = getRegionForEligibility(young);
  return region2zone[region] === "NC";
};

export {
  departmentLookUp,
  departmentList,
  getDepartmentNumber,
  regionList,
  regionsListDROMS,
  department2region,
  region2department,
  getDepartmentByZip,
  getRegionByZip,
  region2zone,
  getRegionForEligibility,
  isFromMetropole,
  isFromDOMTOM,
  isFromFrenchPolynesia,
  isFromNouvelleCaledonie,
};
export default {
  departmentLookUp,
  departmentList,
  getDepartmentNumber,
  regionList,
  regionsListDROMS,
  department2region,
  region2department,
  getDepartmentByZip,
  getRegionByZip,
  region2zone,
  getRegionForEligibility,
  isFromMetropole,
  isFromDOMTOM,
  isFromFrenchPolynesia,
  isFromNouvelleCaledonie,
};
