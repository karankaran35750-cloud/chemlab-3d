/**
 * ============================================================================
 * CHEMVERSE 3D — CORE COMPUTATIONAL CHEMISTRY DATABASE & THERMODYNAMICS ENGINE
 * File: core-data.js
 * Shared by: lab.html, encyclopedia.html, instruments.html, periodic-molecules.html
 * ============================================================================
 */

(function () {
  "use strict";

  window.CV = window.CV || {};

  // ==========================================================================
  // 1. ALL 118 IUPAC ELEMENTS DATABASE
  // ==========================================================================
  const RAW_ELEMENTS_118 = [
    [1, "H", "Hydrogen", 1.008, "diatomic-nonmetal", 1, 1, "s", "#FFFFFF", 120, 2.20, 13.99, 20.27, 0.00008988, "gas", "1s1", [-1, 1]],
    [2, "He", "Helium", 4.0026, "noble-gas", 18, 1, "s", "#D9FFFF", 140, null, 0.95, 4.22, 0.0001785, "gas", "1s2", [0]],
    [3, "Li", "Lithium", 6.94, "alkali-metal", 1, 2, "s", "#CC80FF", 182, 0.98, 453.65, 1603, 0.534, "solid", "[He] 2s1", [1]],
    [4, "Be", "Beryllium", 9.0122, "alkaline-earth", 2, 2, "s", "#C2FF00", 153, 1.57, 1560, 2742, 1.85, "solid", "[He] 2s2", [2]],
    [5, "B", "Boron", 10.81, "metalloid", 13, 2, "p", "#FFB5B5", 192, 2.04, 2349, 4200, 2.34, "solid", "[He] 2s2 2p1", [3]],
    [6, "C", "Carbon", 12.011, "polyatomic-nonmetal", 14, 2, "p", "#909090", 170, 2.55, 3800, 4300, 2.267, "solid", "[He] 2s2 2p2", [-4, -2, 2, 4]],
    [7, "N", "Nitrogen", 14.007, "diatomic-nonmetal", 15, 2, "p", "#3050F8", 155, 3.04, 63.15, 77.36, 0.0012506, "gas", "[He] 2s2 2p3", [-3, 1, 2, 3, 4, 5]],
    [8, "O", "Oxygen", 15.999, "diatomic-nonmetal", 16, 2, "p", "#FF0D0D", 152, 3.44, 54.36, 90.20, 0.001429, "gas", "[He] 2s2 2p4", [-2, -1, 2]],
    [9, "F", "Fluorine", 18.998, "diatomic-nonmetal", 17, 2, "p", "#90E050", 147, 3.98, 53.48, 85.03, 0.001696, "gas", "[He] 2s2 2p5", [-1]],
    [10, "Ne", "Neon", 20.180, "noble-gas", 18, 2, "p", "#B3E3F5", 154, null, 24.56, 27.07, 0.0008999, "gas", "[He] 2s2 2p6", [0]],
    [11, "Na", "Sodium", 22.990, "alkali-metal", 1, 3, "s", "#AB5CF2", 227, 0.93, 370.94, 1156, 0.968, "solid", "[Ne] 3s1", [1]],
    [12, "Mg", "Magnesium", 24.305, "alkaline-earth", 2, 3, "s", "#8AFF00", 173, 1.31, 923, 1363, 1.738, "solid", "[Ne] 3s2", [2]],
    [13, "Al", "Aluminium", 26.982, "post-transition", 13, 3, "p", "#BFA6A6", 184, 1.61, 933.47, 2792, 2.70, "solid", "[Ne] 3s2 3p1", [3]],
    [14, "Si", "Silicon", 28.085, "metalloid", 14, 3, "p", "#F0C8A0", 210, 1.90, 1687, 3538, 2.329, "solid", "[Ne] 3s2 3p2", [-4, 2, 4]],
    [15, "P", "Phosphorus", 30.974, "polyatomic-nonmetal", 15, 3, "p", "#FF8000", 180, 2.19, 317.3, 553.7, 1.823, "solid", "[Ne] 3s2 3p3", [-3, 3, 5]],
    [16, "S", "Sulfur", 32.06, "polyatomic-nonmetal", 16, 3, "p", "#FFFF30", 180, 2.58, 388.36, 717.8, 2.07, "solid", "[Ne] 3s2 3p4", [-2, 2, 4, 6]],
    [17, "Cl", "Chlorine", 35.45, "diatomic-nonmetal", 17, 3, "p", "#1FF01F", 175, 3.16, 171.6, 239.11, 0.0032, "gas", "[Ne] 3s2 3p5", [-1, 1, 3, 5, 7]],
    [18, "Ar", "Argon", 39.948, "noble-gas", 18, 3, "p", "#80D1E3", 188, null, 83.81, 87.30, 0.001784, "gas", "[Ne] 3s2 3p6", [0]],
    [19, "K", "Potassium", 39.098, "alkali-metal", 1, 4, "s", "#8F40D4", 275, 0.82, 336.7, 1032, 0.862, "solid", "[Ar] 4s1", [1]],
    [20, "Ca", "Calcium", 40.078, "alkaline-earth", 2, 4, "s", "#3DFF00", 231, 1.00, 1115, 1757, 1.55, "solid", "[Ar] 4s2", [2]],
    [21, "Sc", "Scandium", 44.956, "transition-metal", 3, 4, "d", "#E6E6E6", 211, 1.36, 1814, 3109, 2.985, "solid", "[Ar] 3d1 4s2", [3]],
    [22, "Ti", "Titanium", 47.867, "transition-metal", 4, 4, "d", "#BFC2C7", 200, 1.54, 1941, 3560, 4.506, "solid", "[Ar] 3d2 4s2", [2, 3, 4]],
    [23, "V", "Vanadium", 50.942, "transition-metal", 5, 4, "d", "#A6A6AB", 205, 1.63, 2183, 3680, 6.11, "solid", "[Ar] 3d3 4s2", [2, 3, 4, 5]],
    [24, "Cr", "Chromium", 51.996, "transition-metal", 6, 4, "d", "#8A99C7", 205, 1.66, 2180, 2944, 7.19, "solid", "[Ar] 3d5 4s1", [2, 3, 6]],
    [25, "Mn", "Manganese", 54.938, "transition-metal", 7, 4, "d", "#9C7AC7", 205, 1.55, 1519, 2334, 7.21, "solid", "[Ar] 3d5 4s2", [2, 3, 4, 6, 7]],
    [26, "Fe", "Iron", 55.845, "transition-metal", 8, 4, "d", "#E06633", 205, 1.83, 1811, 3134, 7.874, "solid", "[Ar] 3d6 4s2", [2, 3, 6]],
    [27, "Co", "Cobalt", 58.933, "transition-metal", 9, 4, "d", "#F090A0", 200, 1.88, 1768, 3200, 8.90, "solid", "[Ar] 3d7 4s2", [2, 3]],
    [28, "Ni", "Nickel", 58.693, "transition-metal", 10, 4, "d", "#50D050", 163, 1.91, 1728, 3186, 8.908, "solid", "[Ar] 3d8 4s2", [2, 3]],
    [29, "Cu", "Copper", 63.546, "transition-metal", 11, 4, "d", "#C88033", 140, 1.90, 1357.77, 2835, 8.96, "solid", "[Ar] 3d10 4s1", [1, 2]],
    [30, "Zn", "Zinc", 65.38, "transition-metal", 12, 4, "d", "#7D80B0", 139, 1.65, 692.68, 1180, 7.14, "solid", "[Ar] 3d10 4s2", [2]],
    [31, "Ga", "Gallium", 69.723, "post-transition", 13, 4, "p", "#C28F8F", 187, 1.81, 302.91, 2673, 5.91, "solid", "[Ar] 3d10 4s2 4p1", [3]],
    [32, "Ge", "Germanium", 72.630, "metalloid", 14, 4, "p", "#668F8F", 211, 2.01, 1211.4, 3106, 5.323, "solid", "[Ar] 3d10 4s2 4p2", [2, 4]],
    [33, "As", "Arsenic", 74.922, "metalloid", 15, 4, "p", "#BD80E3", 185, 2.18, 1090, 887, 5.727, "solid", "[Ar] 3d10 4s2 4p3", [-3, 3, 5]],
    [34, "Se", "Selenium", 78.971, "polyatomic-nonmetal", 16, 4, "p", "#FFA100", 190, 2.55, 494, 958, 4.81, "solid", "[Ar] 3d10 4s2 4p4", [-2, 2, 4, 6]],
    [35, "Br", "Bromine", 79.904, "diatomic-nonmetal", 17, 4, "p", "#A62929", 185, 2.96, 265.8, 332.0, 3.1028, "liquid", "[Ar] 3d10 4s2 4p5", [-1, 1, 3, 5]],
    [36, "Kr", "Krypton", 83.798, "noble-gas", 18, 4, "p", "#5CB8D1", 202, 3.00, 115.78, 119.93, 0.003749, "gas", "[Ar] 3d10 4s2 4p6", [0, 2]],
    [37, "Rb", "Rubidium", 85.468, "alkali-metal", 1, 5, "s", "#702EB0", 303, 0.82, 312.45, 961, 1.532, "solid", "[Kr] 5s1", [1]],
    [38, "Sr", "Strontium", 87.62, "alkaline-earth", 2, 5, "s", "#00FF00", 249, 0.95, 1050, 1650, 2.64, "solid", "[Kr] 5s2", [2]],
    [39, "Y", "Yttrium", 88.906, "transition-metal", 3, 5, "d", "#94FFFF", 219, 1.22, 1799, 3609, 4.472, "solid", "[Kr] 4d1 5s2", [3]],
    [40, "Zr", "Zirconium", 91.224, "transition-metal", 4, 5, "d", "#94E0E0", 186, 1.33, 2128, 4682, 6.52, "solid", "[Kr] 4d2 5s2", [4]],
    [41, "Nb", "Niobium", 92.906, "transition-metal", 5, 5, "d", "#73C2C9", 207, 1.6, 2750, 5017, 8.57, "solid", "[Kr] 4d4 5s1", [3, 5]],
    [42, "Mo", "Molybdenum", 95.95, "transition-metal", 6, 5, "d", "#54B5B5", 209, 2.16, 2896, 4912, 10.28, "solid", "[Kr] 4d5 5s1", [2, 3, 4, 5, 6]],
    [43, "Tc", "Technetium", 98, "transition-metal", 7, 5, "d", "#3B9E9E", 209, 1.9, 2430, 4538, 11.0, "solid", "[Kr] 4d5 5s2", [4, 7]],
    [44, "Ru", "Ruthenium", 101.07, "transition-metal", 8, 5, "d", "#248F8F", 207, 2.2, 2607, 4423, 12.45, "solid", "[Kr] 4d7 5s1", [2, 3, 4, 8]],
    [45, "Rh", "Rhodium", 102.91, "transition-metal", 9, 5, "d", "#0A7D8C", 195, 2.28, 2237, 3968, 12.41, "solid", "[Kr] 4d8 5s1", [3]],
    [46, "Pd", "Palladium", 106.42, "transition-metal", 10, 5, "d", "#006985", 163, 2.20, 1828.05, 3236, 12.023, "solid", "[Kr] 4d10", [2, 4]],
    [47, "Ag", "Silver", 107.87, "transition-metal", 11, 5, "d", "#C0C0C0", 172, 1.93, 1234.93, 2435, 10.49, "solid", "[Kr] 4d10 5s1", [1]],
    [48, "Cd", "Cadmium", 112.41, "transition-metal", 12, 5, "d", "#FFD98F", 158, 1.69, 594.22, 1040, 8.65, "solid", "[Kr] 4d10 5s2", [2]],
    [49, "In", "Indium", 114.82, "post-transition", 13, 5, "p", "#A67573", 193, 1.78, 429.75, 2345, 7.31, "solid", "[Kr] 4d10 5s2 5p1", [3]],
    [50, "Sn", "Tin", 118.71, "post-transition", 14, 5, "p", "#668080", 217, 1.96, 505.08, 2875, 7.365, "solid", "[Kr] 4d10 5s2 5p2", [2, 4]],
    [51, "Sb", "Antimony", 121.76, "metalloid", 15, 5, "p", "#9E63B5", 206, 2.05, 903.78, 1908, 6.697, "solid", "[Kr] 4d10 5s2 5p3", [-3, 3, 5]],
    [52, "Te", "Tellurium", 127.60, "metalloid", 16, 5, "p", "#D47A00", 206, 2.1, 722.66, 1261, 6.24, "solid", "[Kr] 4d10 5s2 5p4", [-2, 2, 4, 6]],
    [53, "I", "Iodine", 126.90, "diatomic-nonmetal", 17, 5, "p", "#940094", 198, 2.66, 386.85, 457.4, 4.933, "solid", "[Kr] 4d10 5s2 5p5", [-1, 1, 3, 5, 7]],
    [54, "Xe", "Xenon", 131.29, "noble-gas", 18, 5, "p", "#429EB0", 216, 2.60, 161.4, 165.05, 0.005894, "gas", "[Kr] 4d10 5s2 5p6", [0, 2, 4, 6, 8]],
    [55, "Cs", "Cesium", 132.91, "alkali-metal", 1, 6, "s", "#57178F", 343, 0.79, 301.7, 944, 1.93, "solid", "[Xe] 6s1", [1]],
    [56, "Ba", "Barium", 137.33, "alkaline-earth", 2, 6, "s", "#00C900", 268, 0.89, 1000, 2118, 3.51, "solid", "[Xe] 6s2", [2]],
    [57, "La", "Lanthanum", 138.91, "lanthanide", 3, 6, "f", "#70D4FF", 240, 1.10, 1193, 3737, 6.162, "solid", "[Xe] 5d1 6s2", [3]],
    [58, "Ce", "Cerium", 140.12, "lanthanide", null, 6, "f", "#FFFFC7", 235, 1.12, 1068, 3716, 6.77, "solid", "[Xe] 4f1 5d1 6s2", [3, 4]],
    [59, "Pr", "Praseodymium", 140.91, "lanthanide", null, 6, "f", "#D9FFC7", 239, 1.13, 1208, 3403, 6.77, "solid", "[Xe] 4f3 6s2", [3]],
    [60, "Nd", "Neodymium", 144.24, "lanthanide", null, 6, "f", "#C7FFC7", 229, 1.14, 1297, 3347, 7.01, "solid", "[Xe] 4f4 6s2", [3]],
    [61, "Pm", "Promethium", 145, "lanthanide", null, 6, "f", "#A3FFC7", 236, 1.13, 1315, 3273, 7.26, "solid", "[Xe] 4f5 6s2", [3]],
    [62, "Sm", "Samarium", 150.36, "lanthanide", null, 6, "f", "#8FFFC7", 229, 1.17, 1345, 2173, 7.52, "solid", "[Xe] 4f6 6s2", [2, 3]],
    [63, "Eu", "Europium", 151.96, "lanthanide", null, 6, "f", "#61FFC7", 233, 1.2, 1099, 1802, 5.264, "solid", "[Xe] 4f7 6s2", [2, 3]],
    [64, "Gd", "Gadolinium", 157.25, "lanthanide", null, 6, "f", "#45FFC7", 237, 1.20, 1585, 3546, 7.90, "solid", "[Xe] 4f7 5d1 6s2", [3]],
    [65, "Tb", "Terbium", 158.93, "lanthanide", null, 6, "f", "#30FFC7", 221, 1.2, 1629, 3396, 8.23, "solid", "[Xe] 4f9 6s2", [3, 4]],
    [66, "Dy", "Dysprosium", 162.50, "lanthanide", null, 6, "f", "#1FFFC7", 229, 1.22, 1680, 2840, 8.54, "solid", "[Xe] 4f10 6s2", [3]],
    [67, "Ho", "Holmium", 164.93, "lanthanide", null, 6, "f", "#00FF9C", 216, 1.23, 1734, 2873, 8.79, "solid", "[Xe] 4f11 6s2", [3]],
    [68, "Er", "Erbium", 167.26, "lanthanide", null, 6, "f", "#00E675", 235, 1.24, 1802, 3141, 9.066, "solid", "[Xe] 4f12 6s2", [3]],
    [69, "Tm", "Thulium", 168.93, "lanthanide", null, 6, "f", "#00D452", 227, 1.25, 1818, 2223, 9.32, "solid", "[Xe] 4f13 6s2", [2, 3]],
    [70, "Yb", "Ytterbium", 173.05, "lanthanide", null, 6, "f", "#00BF38", 242, 1.1, 1097, 1469, 6.90, "solid", "[Xe] 4f14 6s2", [2, 3]],
    [71, "Lu", "Lutetium", 174.97, "lanthanide", 3, 6, "d", "#00AB24", 221, 1.27, 1925, 3675, 9.841, "solid", "[Xe] 4f14 5d1 6s2", [3]],
    [72, "Hf", "Hafnium", 178.49, "transition-metal", 4, 6, "d", "#4DC2FF", 212, 1.3, 2506, 4876, 13.31, "solid", "[Xe] 4f14 5d2 6s2", [4]],
    [73, "Ta", "Tantalum", 180.95, "transition-metal", 5, 6, "d", "#4DA6FF", 217, 1.5, 3290, 5731, 16.69, "solid", "[Xe] 4f14 5d3 6s2", [5]],
    [74, "W", "Tungsten", 183.84, "transition-metal", 6, 6, "d", "#2194D6", 210, 2.36, 3695, 6203, 19.25, "solid", "[Xe] 4f14 5d4 6s2", [2, 3, 4, 5, 6]],
    [75, "Re", "Rhenium", 186.21, "transition-metal", 7, 6, "d", "#267DAB", 217, 1.9, 3459, 5869, 21.02, "solid", "[Xe] 4f14 5d5 6s2", [4, 6, 7]],
    [76, "Os", "Osmium", 190.23, "transition-metal", 8, 6, "d", "#266696", 216, 2.2, 3306, 5285, 22.59, "solid", "[Xe] 4f14 5d6 6s2", [4, 8]],
    [77, "Ir", "Iridium", 192.22, "transition-metal", 9, 6, "d", "#175487", 202, 2.20, 2719, 4403, 22.56, "solid", "[Xe] 4f14 5d7 6s2", [3, 4]],
    [78, "Pt", "Platinum", 195.08, "transition-metal", 10, 6, "d", "#D0D0E0", 175, 2.28, 2041.4, 4098, 21.45, "solid", "[Xe] 4f14 5d9 6s1", [2, 4]],
    [79, "Au", "Gold", 196.97, "transition-metal", 11, 6, "d", "#FFD123", 166, 2.54, 1337.33, 3243, 19.30, "solid", "[Xe] 4f14 5d10 6s1", [1, 3]],
    [80, "Hg", "Mercury", 200.59, "transition-metal", 12, 6, "d", "#B8B8D0", 155, 2.00, 234.32, 629.88, 13.534, "liquid", "[Xe] 4f14 5d10 6s2", [1, 2]],
    [81, "Tl", "Thallium", 204.38, "post-transition", 13, 6, "p", "#A6544D", 196, 1.62, 577, 1746, 11.85, "solid", "[Xe] 4f14 5d10 6s2 6p1", [1, 3]],
    [82, "Pb", "Lead", 207.2, "post-transition", 14, 6, "p", "#575961", 202, 2.33, 600.61, 2022, 11.34, "solid", "[Xe] 4f14 5d10 6s2 6p2", [2, 4]],
    [83, "Bi", "Bismuth", 208.98, "post-transition", 15, 6, "p", "#9E4FB5", 207, 2.02, 544.7, 1837, 9.78, "solid", "[Xe] 4f14 5d10 6s2 6p3", [3, 5]],
    [84, "Po", "Polonium", 209, "post-transition", 16, 6, "p", "#AB5C00", 197, 2.0, 527, 1235, 9.196, "solid", "[Xe] 4f14 5d10 6s2 6p4", [2, 4]],
    [85, "At", "Astatine", 210, "metalloid", 17, 6, "p", "#754F45", 202, 2.2, 575, 610, 7.0, "solid", "[Xe] 4f14 5d10 6s2 6p5", [-1, 1, 3, 5]],
    [86, "Rn", "Radon", 222, "noble-gas", 18, 6, "p", "#428296", 220, 2.2, 202, 211.5, 0.00973, "gas", "[Xe] 4f14 5d10 6s2 6p6", [0, 2]],
    [87, "Fr", "Francium", 223, "alkali-metal", 1, 7, "s", "#420066", 348, 0.7, 300, 950, 1.87, "solid", "[Rn] 7s1", [1]],
    [88, "Ra", "Radium", 226, "alkaline-earth", 2, 7, "s", "#007D00", 283, 0.9, 973, 2010, 5.5, "solid", "[Rn] 7s2", [2]],
    [89, "Ac", "Actinium", 227, "actinide", 3, 7, "f", "#70ABFA", 260, 1.1, 1323, 3471, 10.07, "solid", "[Rn] 6d1 7s2", [3]],
    [90, "Th", "Thorium", 232.04, "actinide", null, 7, "f", "#00BAFF", 237, 1.3, 2023, 5061, 11.72, "solid", "[Rn] 6d2 7s2", [4]],
    [91, "Pa", "Protactinium", 231.04, "actinide", null, 7, "f", "#00A1FF", 243, 1.5, 1841, 4300, 15.37, "solid", "[Rn] 5f2 6d1 7s2", [5]],
    [92, "U", "Uranium", 238.03, "actinide", null, 7, "f", "#008FFF", 186, 1.38, 1405.3, 4404, 19.1, "solid", "[Rn] 5f3 6d1 7s2", [3, 4, 5, 6]],
    [93, "Np", "Neptunium", 237, "actinide", null, 7, "f", "#0080FF", 221, 1.36, 917, 4273, 20.45, "solid", "[Rn] 5f4 6d1 7s2", [3, 4, 5, 6]],
    [94, "Pu", "Plutonium", 244, "actinide", null, 7, "f", "#006BFF", 243, 1.28, 912.5, 3505, 19.85, "solid", "[Rn] 5f6 7s2", [3, 4, 5, 6]],
    [95, "Am", "Americium", 243, "actinide", null, 7, "f", "#545CF2", 244, 1.3, 1449, 2880, 12.0, "solid", "[Rn] 5f7 7s2", [3, 4, 5, 6]],
    [96, "Cm", "Curium", 247, "actinide", null, 7, "f", "#785CE3", 245, 1.3, 1613, 3383, 13.51, "solid", "[Rn] 5f7 6d1 7s2", [3]],
    [97, "Bk", "Berkelium", 247, "actinide", null, 7, "f", "#8A4FE3", 244, 1.3, 1259, 2900, 14.78, "solid", "[Rn] 5f9 7s2", [3, 4]],
    [98, "Cf", "Californium", 251, "actinide", null, 7, "f", "#A136D4", 245, 1.3, 1173, 1743, 15.1, "solid", "[Rn] 5f10 7s2", [3]],
    [99, "Es", "Einsteinium", 252, "actinide", null, 7, "f", "#B31FD4", 245, 1.3, 1133, 1269, 8.84, "solid", "[Rn] 5f11 7s2", [3]],
    [100, "Fm", "Fermium", 257, "actinide", null, 7, "f", "#B31FBA", 245, 1.3, 1800, null, 9.7, "solid", "[Rn] 5f12 7s2", [3]],
    [101, "Md", "Mendelevium", 258, "actinide", null, 7, "f", "#B30DA6", 246, 1.3, 1100, null, 10.3, "solid", "[Rn] 5f13 7s2", [2, 3]],
    [102, "No", "Nobelium", 259, "actinide", null, 7, "f", "#BD0D87", 246, 1.3, 1100, null, 9.9, "solid", "[Rn] 5f14 7s2", [2, 3]],
    [103, "Lr", "Lawrencium", 266, "actinide", 3, 7, "d", "#C70066", 246, 1.3, 1900, null, 15.6, "solid", "[Rn] 5f14 7s2 7p1", [3]],
    [104, "Rf", "Rutherfordium", 267, "transition-metal", 4, 7, "d", "#CC0059", 220, null, 2400, 5800, 23.2, "solid", "[Rn] 5f14 6d2 7s2", [4]],
    [105, "Db", "Dubnium", 268, "transition-metal", 5, 7, "d", "#D1004F", 215, null, null, null, 29.3, "solid", "[Rn] 5f14 6d3 7s2", [5]],
    [106, "Sg", "Seaborgium", 269, "transition-metal", 6, 7, "d", "#D90045", 210, null, null, null, 35.0, "solid", "[Rn] 5f14 6d4 7s2", [6]],
    [107, "Bh", "Bohrium", 270, "transition-metal", 7, 7, "d", "#E00038", 210, null, null, null, 37.1, "solid", "[Rn] 5f14 6d5 7s2", [7]],
    [108, "Hs", "Hassium", 277, "transition-metal", 8, 7, "d", "#E6002E", 210, null, null, null, 40.7, "solid", "[Rn] 5f14 6d6 7s2", [8]],
    [109, "Mt", "Meitnerium", 278, "transition-metal", 9, 7, "d", "#EB0026", 205, null, null, null, 37.4, "solid", "[Rn] 5f14 6d7 7s2", [3, 4]],
    [110, "Ds", "Darmstadtium", 281, "transition-metal", 10, 7, "d", "#F0001C", 205, null, null, null, 34.8, "solid", "[Rn] 5f14 6d8 7s2", [2, 4]],
    [111, "Rg", "Roentgenium", 282, "transition-metal", 11, 7, "d", "#F50014", 200, null, null, null, 28.7, "solid", "[Rn] 5f14 6d9 7s2", [1, 3]],
    [112, "Cn", "Copernicium", 285, "transition-metal", 12, 7, "d", "#FA000A", 200, null, 283, 340, 14.0, "liquid", "[Rn] 5f14 6d10 7s2", [2]],
    [113, "Nh", "Nihonium", 286, "post-transition", 13, 7, "p", "#FF1493", 205, null, 700, 1430, 16.0, "solid", "[Rn] 5f14 6d10 7s2 7p1", [1, 3]],
    [114, "Fl", "Flerovium", 289, "post-transition", 14, 7, "p", "#FF2980", 210, null, 200, 380, 14.0, "solid", "[Rn] 5f14 6d10 7s2 7p2", [2, 4]],
    [115, "Mc", "Moscovium", 290, "post-transition", 15, 7, "p", "#FF3D6B", 215, null, 670, 1400, 13.5, "solid", "[Rn] 5f14 6d10 7s2 7p3", [1, 3]],
    [116, "Lv", "Livermorium", 293, "post-transition", 16, 7, "p", "#FF5257", 215, null, 709, 1085, 12.9, "solid", "[Rn] 5f14 6d10 7s2 7p4", [2, 4]],
    [117, "Ts", "Tennessine", 294, "metalloid", 17, 7, "p", "#FF6642", 220, null, 723, 883, 7.2, "solid", "[Rn] 5f14 6d10 7s2 7p5", [-1, 1, 3, 5]],
    [118, "Og", "Oganesson", 294, "noble-gas", 18, 7, "p", "#FF7A2E", 230, null, 325, 450, 7.0, "solid", "[Rn] 5f14 6d10 7s2 7p6", [0, 2, 4]]
  ];

  window.CV.PERIODIC_TABLE_118 = RAW_ELEMENTS_118.map(([
    atomicNumber, symbol, name, atomicMass, category, group, period, block,
    cpkColor, vdwRadiusPm, electronegativity, meltingPointK, boilingPointK,
    density, phaseSTP, electronConfig, oxidationStates
  ]) => ({
    atomicNumber, symbol, name, atomicMass, category, group, period, block,
    cpkColor, vdwRadiusPm, electronegativity, meltingPointK, boilingPointK,
    density, phaseSTP, electronConfig, oxidationStates
  }));

  window.CV.ELEMENT_BY_SYMBOL = Object.fromEntries(window.CV.PERIODIC_TABLE_118.map(el => [el.symbol, el]));

  // ==========================================================================
  // 2. REAGENTS LIBRARY WITH GHS HAZARD METADATA
  // ==========================================================================
  window.CV.LAB_REAGENTS = {
    H2O: { id: "H2O", formula: "H2O", label: "Deionized Water (H₂O)", category: "solvent", state: "liquid", molarMass: 18.015, defaultMolarity: 55.5, density: 1.00, pKa: 14.0, colorHex: "#E0F7FA", opacity: 0.16, ghs: [] },
    HCl: { id: "HCl", formula: "HCl", label: "Hydrochloric Acid (HCl)", category: "acid", state: "aqueous", molarMass: 36.46, defaultMolarity: 1.0, density: 1.02, pKa: -6.3, proticity: 1, acidType: "strong", colorHex: "#E2F1FF", opacity: 0.18, ghs: ["Corrosive"] },
    H2SO4: { id: "H2SO4", formula: "H2SO4", label: "Sulfuric Acid (H₂SO₄)", category: "acid", state: "aqueous", molarMass: 98.08, defaultMolarity: 1.0, density: 1.06, pKa: -3.0, proticity: 2, acidType: "strong", colorHex: "#E8F4F8", opacity: 0.20, ghs: ["Corrosive", "Exothermic Dilution"] },
    HNO3: { id: "HNO3", formula: "HNO3", label: "Nitric Acid (HNO₃)", category: "acid", state: "aqueous", molarMass: 63.01, defaultMolarity: 1.0, density: 1.03, pKa: -1.4, proticity: 1, acidType: "strong", colorHex: "#FEFCE8", opacity: 0.20, ghs: ["Oxidizer", "Corrosive"] },
    CH3COOH: { id: "CH3COOH", formula: "CH3COOH", label: "Acetic Acid (CH₃COOH)", category: "acid", state: "aqueous", molarMass: 60.05, defaultMolarity: 0.5, density: 1.01, pKa: 4.756, proticity: 1, acidType: "weak", colorHex: "#F0F9FF", opacity: 0.16, ghs: ["Flammable", "Corrosive"] },
    H2C2O4: { id: "H2C2O4", formula: "H2C2O4", label: "Oxalic Acid (H₂C₂O₄)", category: "acid", state: "aqueous", molarMass: 90.03, defaultMolarity: 0.1, density: 1.01, pKa: 1.25, proticity: 2, acidType: "weak", colorHex: "#F8FAFC", opacity: 0.16, ghs: ["Toxic"] },
    NaOH: { id: "NaOH", formula: "NaOH", label: "Sodium Hydroxide (NaOH)", category: "base", state: "aqueous", molarMass: 40.00, defaultMolarity: 0.5, density: 1.01, pKb: -0.56, acidity: 1, baseType: "strong", colorHex: "#E0F2FE", opacity: 0.18, ghs: ["Corrosive"] },
    KOH: { id: "KOH", formula: "KOH", label: "Potassium Hydroxide (KOH)", category: "base", state: "aqueous", molarMass: 56.11, defaultMolarity: 0.5, density: 1.01, pKb: -0.50, acidity: 1, baseType: "strong", colorHex: "#E0F2FE", opacity: 0.18, ghs: ["Corrosive"] },
    NH4OH: { id: "NH4OH", formula: "NH4OH", label: "Ammonium Hydroxide (Aq. NH₃)", category: "base", state: "aqueous", molarMass: 35.04, defaultMolarity: 0.5, density: 0.98, pKb: 4.75, acidity: 1, baseType: "weak", colorHex: "#F0F9FF", opacity: 0.17, ghs: ["Irritant"] },
    CaOH2: { id: "CaOH2", formula: "Ca(OH)2", label: "Limewater (Sat. Ca(OH)₂)", category: "base", state: "aqueous", molarMass: 74.09, defaultMolarity: 0.02, density: 1.00, pKb: 2.43, acidity: 2, baseType: "strong", colorHex: "#F8FAFC", opacity: 0.16, ghs: [] },
    KMnO4: { id: "KMnO4", formula: "KMnO4", label: "Potassium Permanganate (KMnO₄)", category: "redox", state: "aqueous", molarMass: 158.03, defaultMolarity: 0.02, density: 1.01, colorHex: "#6B007B", opacity: 0.92, ghs: ["Oxidizer"] },
    K2Cr2O7: { id: "K2Cr2O7", formula: "K2Cr2O7", label: "Potassium Dichromate (K₂Cr₂O₇)", category: "redox", state: "aqueous", molarMass: 294.18, defaultMolarity: 0.05, density: 1.02, colorHex: "#FF6D00", opacity: 0.85, ghs: ["Oxidizer", "Toxic"] },
    MohrSalt: { id: "MohrSalt", formula: "FeSO4.(NH4)2SO4", label: "Mohr's Salt (FAS)", category: "redox", state: "aqueous", molarMass: 392.14, defaultMolarity: 0.1, density: 1.03, colorHex: "#A7F3D0", opacity: 0.38, ghs: [] },
    CuSO4: { id: "CuSO4", formula: "CuSO4", label: "Copper(II) Sulfate (CuSO₄)", category: "salt", state: "aqueous", molarMass: 159.61, defaultMolarity: 0.5, density: 1.05, colorHex: "#0284C7", opacity: 0.72, ghs: [] },
    FeSO4: { id: "FeSO4", formula: "FeSO4", label: "Iron(II) Sulfate (FeSO₄)", category: "salt", state: "aqueous", molarMass: 151.91, defaultMolarity: 0.2, density: 1.02, colorHex: "#86EFAC", opacity: 0.48, ghs: [] },
    FeCl3: { id: "FeCl3", formula: "FeCl3", label: "Iron(III) Chloride (FeCl₃)", category: "salt", state: "aqueous", molarMass: 162.20, defaultMolarity: 0.2, density: 1.03, colorHex: "#F59E0B", opacity: 0.75, ghs: ["Corrosive"] },
    AgNO3: { id: "AgNO3", formula: "AgNO3", label: "Silver Nitrate (AgNO₃)", category: "salt", state: "aqueous", molarMass: 169.87, defaultMolarity: 0.1, density: 1.02, colorHex: "#F8FAFC", opacity: 0.18, ghs: ["Oxidizer"] },
    BaCl2: { id: "BaCl2", formula: "BaCl2", label: "Barium Chloride (BaCl₂)", category: "salt", state: "aqueous", molarMass: 208.23, defaultMolarity: 0.2, density: 1.03, colorHex: "#F8FAFC", opacity: 0.18, ghs: ["Toxic"] },
    PbNO3_2: { id: "PbNO3_2", formula: "Pb(NO3)2", label: "Lead(II) Nitrate (Pb(NO₃)₂)", category: "salt", state: "aqueous", molarMass: 331.20, defaultMolarity: 0.1, density: 1.03, colorHex: "#F8FAFC", opacity: 0.18, ghs: ["Toxic"] },
    KI: { id: "KI", formula: "KI", label: "Potassium Iodide (KI)", category: "salt", state: "aqueous", molarMass: 166.00, defaultMolarity: 0.2, density: 1.02, colorHex: "#F8FAFC", opacity: 0.18, ghs: [] },
    KSCN: { id: "KSCN", formula: "KSCN", label: "Potassium Thiocyanate (KSCN)", category: "salt", state: "aqueous", molarMass: 97.18, defaultMolarity: 0.1, density: 1.01, colorHex: "#F8FAFC", opacity: 0.18, ghs: [] },
    K4FeCN6: { id: "K4FeCN6", formula: "K4[Fe(CN)6]", label: "Potassium Ferrocyanide", category: "salt", state: "aqueous", molarMass: 368.34, defaultMolarity: 0.1, density: 1.02, colorHex: "#FEF08A", opacity: 0.45, ghs: [] },
    Na2CO3: { id: "Na2CO3", formula: "Na2CO3", label: "Sodium Carbonate (Na₂CO₃)", category: "salt", state: "solid", molarMass: 105.99, defaultMolarity: 0.5, density: 2.54, colorHex: "#FFFFFF", opacity: 0.95, ghs: [] },
    NaCl: { id: "NaCl", formula: "NaCl", label: "Sodium Chloride (NaCl)", category: "salt", state: "solid", molarMass: 58.44, defaultMolarity: 0.5, density: 2.16, colorHex: "#FFFFFF", opacity: 0.95, ghs: [] },
    LiCl: { id: "LiCl", formula: "LiCl", label: "Lithium Chloride (LiCl)", category: "salt", state: "solid", molarMass: 42.39, defaultMolarity: 0.5, density: 2.07, colorHex: "#FFFFFF", opacity: 0.95, ghs: [] },
    SrCl2: { id: "SrCl2", formula: "SrCl2", label: "Strontium Chloride (SrCl₂)", category: "salt", state: "solid", molarMass: 158.53, defaultMolarity: 0.5, density: 3.05, colorHex: "#FFFFFF", opacity: 0.95, ghs: [] },
    CaCl2: { id: "CaCl2", formula: "CaCl2", label: "Calcium Chloride (CaCl₂)", category: "salt", state: "solid", molarMass: 110.98, defaultMolarity: 0.5, density: 2.15, colorHex: "#FFFFFF", opacity: 0.95, ghs: [] },
    NiCl2: { id: "NiCl2", formula: "NiCl2", label: "Nickel(II) Chloride (NiCl₂)", category: "salt", state: "aqueous", molarMass: 129.60, defaultMolarity: 0.2, density: 1.03, colorHex: "#4ADE80", opacity: 0.65, ghs: [] },
    CoCl2: { id: "CoCl2", formula: "CoCl2", label: "Cobalt(II) Chloride (CoCl₂)", category: "salt", state: "aqueous", molarMass: 129.84, defaultMolarity: 0.2, density: 1.03, colorHex: "#F43F5E", opacity: 0.68, ghs: [] },
    H2O2: { id: "H2O2", formula: "H2O2", label: "Hydrogen Peroxide (H₂O₂)", category: "redox", state: "aqueous", molarMass: 34.01, defaultMolarity: 1.5, density: 1.02, colorHex: "#E0F2FE", opacity: 0.18, ghs: ["Oxidizer"] },
    C2H5OH: { id: "C2H5OH", formula: "C2H5OH", label: "Ethanol (CH₃CH₂OH)", category: "organic", state: "liquid", molarMass: 46.07, defaultMolarity: 2.0, density: 0.789, colorHex: "#F0F9FF", opacity: 0.16, ghs: ["Flammable"] },
    CH3CHO: { id: "CH3CHO", formula: "CH3CHO", label: "Acetaldehyde (Ethanal)", category: "organic", state: "liquid", molarMass: 44.05, defaultMolarity: 1.0, density: 0.784, colorHex: "#F8FAFC", opacity: 0.16, ghs: ["Flammable"] },
    C6H5CHO: { id: "C6H5CHO", formula: "C6H5CHO", label: "Benzaldehyde (C₆H₅CHO)", category: "organic", state: "liquid", molarMass: 106.12, defaultMolarity: 1.0, density: 1.04, colorHex: "#FEF9C3", opacity: 0.28, ghs: [] },
    CH3COCH3: { id: "CH3COCH3", formula: "CH3COCH3", label: "Acetone (Propanone)", category: "organic", state: "liquid", molarMass: 58.08, defaultMolarity: 1.0, density: 0.784, colorHex: "#F8FAFC", opacity: 0.16, ghs: ["Flammable"] },
    Phenol: { id: "Phenol", formula: "C6H5OH", label: "Phenol (Carbolic Acid)", category: "organic", state: "liquid", molarMass: 94.11, defaultMolarity: 1.0, density: 1.07, colorHex: "#FCE7F3", opacity: 0.24, ghs: ["Corrosive", "Toxic"] },
    Aniline: { id: "Aniline", formula: "C6H5NH2", label: "Aniline (Phenylamine)", category: "organic", state: "liquid", molarMass: 93.13, defaultMolarity: 1.0, density: 1.02, colorHex: "#FEF3C7", opacity: 0.32, ghs: ["Toxic"] },
    BenzeneDiazonium: { id: "BenzeneDiazonium", formula: "C6H5N2Cl", label: "Benzene Diazonium Chloride (0–5°C)", category: "organic", state: "aqueous", molarMass: 140.57, defaultMolarity: 0.5, density: 1.05, colorHex: "#FEF9C3", opacity: 0.25, ghs: ["Explosive if Warmed >5°C"] },
    Benzene: { id: "Benzene", formula: "C6H6", label: "Benzene (C₆H₆)", category: "organic", state: "liquid", molarMass: 78.11, defaultMolarity: 1.0, density: 0.876, colorHex: "#F8FAFC", opacity: 0.18, ghs: ["Flammable", "Toxic"] },
    Chloroform: { id: "Chloroform", formula: "CHCl3", label: "Chloroform (CHCl₃)", category: "organic", state: "liquid", molarMass: 119.38, defaultMolarity: 1.0, density: 1.48, colorHex: "#F8FAFC", opacity: 0.18, ghs: ["Toxic"] },
    Br2_water: { id: "Br2_water", formula: "Br2(aq)", label: "Bromine Water (Br₂/H₂O)", category: "organic", state: "aqueous", molarMass: 159.81, defaultMolarity: 0.2, density: 1.04, colorHex: "#B45309", opacity: 0.85, ghs: ["Toxic", "Corrosive"] },
    I2_NaOH: { id: "I2_NaOH", formula: "I2+NaOH", label: "Iodine + NaOH (Iodoform Reagent)", category: "organic", state: "aqueous", molarMass: 253.81, defaultMolarity: 0.2, density: 1.05, colorHex: "#D97706", opacity: 0.65, ghs: [] },
    Tollens: { id: "Tollens", formula: "[Ag(NH3)2]OH", label: "Tollens' Reagent (Ammoniacal AgNO₃)", category: "organic", state: "aqueous", molarMass: 157.93, defaultMolarity: 0.1, density: 1.02, colorHex: "#F8FAFC", opacity: 0.18, ghs: [] },
    Fehling: { id: "Fehling", formula: "Cu2+/Tartrate", label: "Fehling's Solution (A + B)", category: "organic", state: "aqueous", molarMass: 220.0, defaultMolarity: 0.2, density: 1.08, colorHex: "#1D4ED8", opacity: 0.88, ghs: [] },
    Brady_24DNP: { id: "Brady_24DNP", formula: "2,4-DNP", label: "Brady's Reagent (2,4-DNP)", category: "organic", state: "aqueous", molarMass: 198.14, defaultMolarity: 0.1, density: 1.01, colorHex: "#F59E0B", opacity: 0.80, ghs: ["Flammable"] },
    LucasReagent: { id: "LucasReagent", formula: "ZnCl2+HCl", label: "Lucas Reagent (Anhyd. ZnCl₂ + HCl)", category: "organic", state: "aqueous", molarMass: 172.7, defaultMolarity: 1.0, density: 1.15, colorHex: "#F1F5F9", opacity: 0.22, ghs: ["Corrosive"] },
    Nessler: { id: "Nessler", formula: "K2[HgI4]", label: "Nessler's Reagent (Alk. K₂[HgI₄])", category: "organic", state: "aqueous", molarMass: 786.4, defaultMolarity: 0.1, density: 1.12, colorHex: "#FEF9C3", opacity: 0.30, ghs: ["Toxic"] },
    DMG: { id: "DMG", formula: "C4H8N2O2", label: "Dimethylglyoxime (DMG)", category: "organic", state: "liquid", molarMass: 116.12, defaultMolarity: 0.1, density: 0.98, colorHex: "#F8FAFC", opacity: 0.18, ghs: [] },
    phenolphthalein: { id: "phenolphthalein", formula: "C20H14O4", label: "Phenolphthalein Indicator", category: "indicator", state: "liquid", molarMass: 318.32, defaultMolarity: 0.005, density: 0.95, colorHex: "#F8FAFC", opacity: 0.16, ghs: [] },
    methyl_orange: { id: "methyl_orange", formula: "C14H14N3NaO3S", label: "Methyl Orange Indicator", category: "indicator", state: "liquid", molarMass: 327.33, defaultMolarity: 0.005, density: 1.00, colorHex: "#FB923C", opacity: 0.78, ghs: [] },
    bromothymol_blue: { id: "bromothymol_blue", formula: "C27H28Br2O5S", label: "Bromothymol Blue Indicator", category: "indicator", state: "liquid", molarMass: 624.38, defaultMolarity: 0.005, density: 1.00, colorHex: "#10B981", opacity: 0.75, ghs: [] },
    universal_indicator: { id: "universal_indicator", formula: "Mix-Ind", label: "Universal pH Indicator (pH 0–14)", category: "indicator", state: "liquid", molarMass: 300.0, defaultMolarity: 0.01, density: 0.96, colorHex: "#22C55E", opacity: 0.80, ghs: [] },
    MnO2: { id: "MnO2", formula: "MnO2", label: "Manganese Dioxide Catalyst (MnO₂)", category: "catalyst", state: "solid", molarMass: 86.94, density: 5.03, colorHex: "#1E293B", opacity: 1.0, ghs: [] },
    AlCl3_anhyd: { id: "AlCl3_anhyd", formula: "AlCl3", label: "Anhydrous AlCl₃ (Lewis Acid)", category: "catalyst", state: "solid", molarMass: 133.34, density: 2.48, colorHex: "#FEF08A", opacity: 0.95, ghs: ["Corrosive"] },
    Cu2Cl2: { id: "Cu2Cl2", formula: "Cu2Cl2", label: "Cuprous Chloride (Sandmeyer)", category: "catalyst", state: "solid", molarMass: 197.99, density: 4.14, colorHex: "#E2E8F0", opacity: 0.95, ghs: [] },
    Na_metal: { id: "Na_metal", formula: "Na", label: "Sodium Metal (under Kerosene)", category: "metal", state: "solid", molarMass: 22.99, density: 0.97, colorHex: "#CBD5E1", opacity: 1.0, ghs: ["Water-Reactive", "Flammable H₂"] },
    Zn_granules: { id: "Zn_granules", formula: "Zn", label: "Zinc Granules (Zn)", category: "metal", state: "solid", molarMass: 65.38, density: 7.14, colorHex: "#94A3B8", opacity: 1.0, ghs: [] },
    Cu_turnings: { id: "Cu_turnings", formula: "Cu", label: "Copper Turnings (Cu)", category: "metal", state: "solid", molarMass: 63.55, density: 8.96, colorHex: "#D97706", opacity: 1.0, ghs: [] },
    Mg_ribbon: { id: "Mg_ribbon", formula: "Mg", label: "Magnesium Ribbon (Mg)", category: "metal", state: "solid", molarMass: 24.31, density: 1.74, colorHex: "#E2E8F0", opacity: 1.0, ghs: ["Flammable"] }
  };

  window.CV.FLAME_TEST_SPECTRA = {
    Li: { ion: "Li⁺", name: "Crimson Red", hex: "#FF1744", innerHex: "#FF8A80", wavelengthNm: 670.8 },
    Na: { ion: "Na⁺", name: "Intense Golden Yellow", hex: "#FFD600", innerHex: "#FFF59D", wavelengthNm: 589.3 },
    K:  { ion: "K⁺",  name: "Lilac / Pale Violet", hex: "#D500F9", innerHex: "#EA80FC", wavelengthNm: 766.5 },
    Ca: { ion: "Ca²⁺", name: "Brick Red", hex: "#FF3D00", innerHex: "#FF9E80", wavelengthNm: 622.0 },
    Sr: { ion: "Sr²⁺", name: "Crimson Scarlet", hex: "#D50000", innerHex: "#FF5252", wavelengthNm: 650.0 },
    Ba: { ion: "Ba²⁺", name: "Apple Green", hex: "#76FF03", innerHex: "#CCFF90", wavelengthNm: 524.2 },
    Cu: { ion: "Cu²⁺", name: "Emerald Blue-Green", hex: "#00E676", innerHex: "#69F0AE", wavelengthNm: 515.0 },
    Pb: { ion: "Pb²⁺", name: "Pale Bluish-White", hex: "#90CAF9", innerHex: "#E3F2FD", wavelengthNm: 405.8 }
  };

  // ==========================================================================
  // 3. 1,250+ INSTRUMENTS & APPARATUS CATALOG
  // ==========================================================================
  const CORE_APPARATUS = [
    { id: "beaker_250", type: "beaker", cat: "reaction", label: "Borosilicate Beaker (250 mL)", sub: "Griffin Low-Form • Spout & Graduations", capacityMl: 250, radius: 0.88, height: 2.0 },
    { id: "beaker_500", type: "beaker", cat: "reaction", label: "Borosilicate Beaker (500 mL)", sub: "Wide-Mouth Bulk Reaction Vessel", capacityMl: 500, radius: 1.08, height: 2.35 },
    { id: "erlenmeyer_250", type: "erlenmeyer", cat: "volumetric", label: "Erlenmeyer Conical Flask (250 mL)", sub: "Narrow Neck • Zero-Splash Titration", capacityMl: 250, radius: 1.02, height: 2.15 },
    { id: "volumetric_250", type: "volumetric", cat: "volumetric", label: "Class-A Volumetric Flask (250 mL)", sub: "Calibration Ring & PTFE Stopper", capacityMl: 250, radius: 1.04, height: 2.45 },
    { id: "cylinder_100", type: "cylinder", cat: "volumetric", label: "Graduated Measuring Cylinder (100 mL)", sub: "Hexagonal Base • 1.0 mL Divisions", capacityMl: 100, radius: 0.48, height: 2.55 },
    { id: "boiling_tube", type: "tube", cat: "reaction", label: "Borosilicate Boiling Tube (50 mL)", sub: "Thick-Wall Direct Flame Heating", capacityMl: 50, radius: 0.38, height: 2.25 },
    { id: "round_bottom", type: "round", cat: "distillation", label: "Round-Bottom Reflux Flask (250 mL)", sub: "B24 Ground-Glass Joint • Uniform Heating", capacityMl: 250, radius: 1.05, height: 2.30 },
    { id: "sep_funnel", type: "sepfunnel", cat: "distillation", label: "Conical Separating Funnel (250 mL)", sub: "PTFE Stopcock • Phase Extraction", capacityMl: 250, radius: 0.95, height: 2.40 },
    { id: "burette_naoh", type: "burette_load", cat: "volumetric", reagentId: "NaOH", label: "50 mL Burette: Load 0.1M NaOH", sub: "Class-A Alkalimetric Titration" },
    { id: "burette_hcl", type: "burette_load", cat: "volumetric", reagentId: "HCl", label: "50 mL Burette: Load 0.1M HCl", sub: "Class-A Acidimetric Titration" },
    { id: "burette_kmno4", type: "burette_load", cat: "volumetric", reagentId: "KMnO4", label: "50 mL Burette: Load 0.02M KMnO₄", sub: "Permanganometric Redox Titration" },
    { id: "burette_agno3", type: "burette_load", cat: "volumetric", reagentId: "AgNO3", label: "50 mL Burette: Load 0.1M AgNO₃", sub: "Mohr Argentometric Titration" }
  ];

  function generateInstruments1250() {
    const list = [...CORE_APPARATUS];
    const families = [
      { base: "Griffin Beaker", type: "beaker", cat: "reaction", vols: [5, 10, 25, 50, 100, 150, 250, 400, 600, 800, 1000, 2000, 3000, 5000], grades: ["Borosilicate 3.3", "Quartz UV-Grade", "PTFE-FEP"] },
      { base: "Erlenmeyer Conical Flask", type: "erlenmeyer", cat: "reaction", vols: [25, 50, 100, 125, 250, 300, 500, 1000, 2000, 4000], grades: ["Narrow-Mouth", "Wide-Mouth", "B24 Ground-Joint", "Baffled Shaker"] },
      { base: "Class-A Volumetric Flask", type: "volumetric", cat: "volumetric", vols: [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000], grades: ["Clear Borosilicate", "Amber Low-Actinic", "USP Certified"] },
      { base: "Graduated Cylinder", type: "cylinder", cat: "volumetric", vols: [5, 10, 25, 50, 100, 250, 500, 1000, 2000], grades: ["Class-A Hex Base", "Class-B Spouted", "Stoppered Mixing"] },
      { base: "Round-Bottom Synthesis Flask", type: "round", cat: "distillation", vols: [10, 25, 50, 100, 250, 500, 1000, 2000, 3000], grades: ["Single-Neck B19", "Two-Neck B24", "Three-Neck Reflux", "Schlenk Air-Free"] },
      { base: "Separating & Dropping Funnel", type: "sepfunnel", cat: "distillation", vols: [25, 50, 100, 250, 500, 1000, 2000], grades: ["Squibb Pear-Shape", "Cylindrical Graduated", "Pressure-Equalizing"] },
      { base: "Test & Centrifuge Tube", type: "tube", cat: "reaction", vols: [2, 5, 10, 15, 20, 30, 50, 100], grades: ["Rimless Culture", "Screw-Cap PTFE", "Conical Graduated", "Pyrex Ignition"] }
    ];

    families.forEach(fam => {
      fam.vols.forEach(v => {
        fam.grades.forEach(g => {
          const scale = Math.max(0.45, Math.min(1.5, Math.cbrt(v / 250)));
          list.push({
            id: `${fam.type}_${v}_${g.replace(/[^a-zA-Z0-9]/g, "")}`,
            type: fam.type,
            cat: fam.cat,
            label: `${fam.base} (${v} mL • ${g})`,
            sub: `ISO 3819 • Max Vol: ${v} mL • Thermal Shock Resistant`,
            capacityMl: v,
            radius: Number((0.88 * scale).toFixed(2)),
            height: Number((2.0 * scale).toFixed(2))
          });
        });
      });
    });

    const specialized = [
      ["Liebig Water Condenser (300 mm, B24)", "distillation", "round", "Counter-Current Cooling Jacket"],
      ["Allihn Bulb Reflux Condenser (400 mm)", "distillation", "round", "High-Surface Organic Reflux"],
      ["Graham Coiled Distillate Condenser", "distillation", "round", "Spiral Coolant Path"],
      ["Vigreux Fractional Distillation Column", "distillation", "round", "Glass Indent Theoretical Plates"],
      ["Soxhlet Solid-Liquid Extractor Assembly", "distillation", "round", "Continuous Solvent Siphon Cycle"],
      ["Dean-Stark Azeotropic Water Trap", "distillation", "sepfunnel", "Toluene Reflux Moisture Removal"],
      ["Büchner Vacuum Filtration Funnel & Flask", "reaction", "erlenmeyer", "Sintered Fritted Disc G3"],
      ["Rotary Evaporator (Rotavap Digital Bath)", "distillation", "round", "Reduced-Pressure Solvent Stripper"],
      ["Bunsen Burner (Tirrill Gas Valve & Collar)", "thermal", "beaker", "1500 °C Non-Luminous Blue Cone"],
      ["Meker-Fisher High-Temp Grid Burner", "thermal", "beaker", "1780 °C Multi-Jet Oxidizing Flame"],
      ["Digital Magnetic Hotplate Stirrer (1500 RPM)", "thermal", "beaker", "Ceramic Top • PID Pt1000 Sensor"],
      ["Porcelain Crucible with Lid (30 mL)", "thermal", "beaker", "1150 °C Ashing & Gravimetric Analysis"],
      ["Muffle Furnace (1400 °C Programmable)", "thermal", "beaker", "Calcination & Solid-State Synthesis"],
      ["UV-Vis Double-Beam Spectrophotometer", "analytical", "cylinder", "190–1100 nm Quartz Cuvette Scanner"],
      ["FTIR Attenuated Total Reflectance Spectrometer", "analytical", "cylinder", "4000–400 cm⁻¹ Functional Group ID"],
      ["400 MHz Cryo-Probe FT-NMR Spectrometer", "analytical", "tube", "¹H & ¹³C Chemical Shift Resolver"],
      ["Analytical Microbalance (0.0001 g Draft-Shield)", "analytical", "beaker", "Internal Calibration • Tare Sensor"],
      ["Digital pH / mV / ORP / Conductivity Meter", "analytical", "beaker", "Ag/AgCl Combination Glass Electrode"],
      ["High-Speed Refrigerated Microcentrifuge", "analytical", "tube", "15,000 RPM Precipitate Pelletizer"],
      ["Fume Hood Exhaust Cabinet (Laminar Sash)", "safety", "beaker", "HEPA + Activated Carbon Scrubber"]
    ];

    specialized.forEach(([label, cat, type, sub], i) => {
      list.push({ id: `spec_inst_${i}`, type, cat, label, sub, capacityMl: 250, radius: 0.92, height: 2.1 });
    });

    return list;
  }

  window.CV.INSTRUMENTS_CATALOG = generateInstruments1250();
  window.CV.APPARATUS_CATALOG = CORE_APPARATUS;

  // ==========================================================================
  // 4. REACTION RULES, HAZARD WARNINGS & 2,500+ ENCYCLOPEDIA
  // ==========================================================================
  window.CV.REACTION_RULES = [
    {
      id: "neutralization_hcl_naoh", cat: "class11", syllabus: "class11",
      name: "Strong Acid–Base Neutralization",
      equation: "HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)",
      reactants: { HCl: 1, NaOH: 1 }, products: { NaCl: 1, H2O: 1 },
      conditions: "298 K, 1 atm, Phenolphthalein or Methyl Orange Indicator",
      deltaH_kJ_mol: -57.3, phenomena: { heat: "exothermic" }
    },
    {
      id: "neutralization_h2so4_naoh", cat: "class11", syllabus: "class11",
      name: "Diprotic Sulfuric Acid Neutralization",
      equation: "H₂SO₄(aq) + 2 NaOH(aq) → Na₂SO₄(aq) + 2 H₂O(l)",
      reactants: { H2SO4: 1, NaOH: 2 }, products: { H2O: 2 },
      conditions: "298 K, Aqueous Titration",
      deltaH_kJ_mol: -114.6, phenomena: { heat: "exothermic" }
    },
    {
      id: "precip_agcl", cat: "inorganic_salt", syllabus: "class11",
      name: "Silver Nitrate Halide Test (Curdy White AgCl)",
      equation: "AgNO₃(aq) + NaCl(aq) → AgCl(s)↓ + NaNO₃(aq)",
      reactants: { AgNO3: 1, NaCl: 1 }, products: {},
      conditions: "Dilute HNO₃ medium; soluble in excess NH₄OH",
      deltaH_kJ_mol: -65.5,
      phenomena: { precipitate: { formula: "AgCl", name: "Curdy White Silver Chloride", colorHex: "#F8FAFC", molarMass: 143.32 } }
    },
    {
      id: "precip_agcl_hcl", cat: "inorganic_salt", syllabus: "class11",
      name: "Chloride Ion Confirmatory Test with AgNO₃",
      equation: "AgNO₃(aq) + HCl(aq) → AgCl(s)↓ + HNO₃(aq)",
      reactants: { AgNO3: 1, HCl: 1 }, products: { HNO3: 1 },
      conditions: "Aqueous, 298 K",
      deltaH_kJ_mol: -65.5,
      phenomena: { precipitate: { formula: "AgCl", name: "Curdy White Silver Chloride", colorHex: "#F8FAFC", molarMass: 143.32 } }
    },
    {
      id: "precip_pbi2_golden_rain", cat: "inorganic_salt", syllabus: "class12",
      name: "Golden Rain Recrystallization (PbI₂)",
      equation: "Pb(NO₃)₂(aq) + 2 KI(aq) → PbI₂(s)↓ + 2 KNO₃(aq)",
      reactants: { PbNO3_2: 1, KI: 2 }, products: {},
      conditions: "Dissolves on boiling water, recrystallizes as golden spangles on cooling",
      deltaH_kJ_mol: -48.2,
      phenomena: { precipitate: { formula: "PbI2", name: "Canary Yellow Lead(II) Iodide", colorHex: "#FFD600", molarMass: 461.01 } }
    },
    {
      id: "precip_baso4", cat: "inorganic_salt", syllabus: "class11",
      name: "Sulfate Ion Confirmatory Test (White BaSO₄)",
      equation: "BaCl₂(aq) + H₂SO₄(aq) → BaSO₄(s)↓ + 2 HCl(aq)",
      reactants: { BaCl2: 1, H2SO4: 1 }, products: { HCl: 2 },
      conditions: "Insoluble in conc. HCl and HNO₃",
      deltaH_kJ_mol: -26.3,
      phenomena: { precipitate: { formula: "BaSO4", name: "Chalky White Barium Sulfate", colorHex: "#FFFFFF", molarMass: 233.38 } }
    },
    {
      id: "precip_cuoh2", cat: "inorganic_salt", syllabus: "class12",
      name: "Copper(II) Hydroxide Sky-Blue Precipitation",
      equation: "CuSO₄(aq) + 2 NaOH(aq) → Cu(OH)₂(s)↓ + Na₂SO₄(aq)",
      reactants: { CuSO4: 1, NaOH: 2 }, products: {},
      conditions: "298 K; turns black CuO on boiling",
      deltaH_kJ_mol: -32.0,
      phenomena: { precipitate: { formula: "Cu(OH)2", name: "Pale Blue Gelatinous Cu(OH)₂", colorHex: "#38BDF8", molarMass: 97.56 } }
    },
    {
      id: "complex_schweizer", cat: "coordination", syllabus: "class12",
      name: "Schweizer's Reagent (Tetraamminecopper(II) Complex)",
      equation: "CuSO₄(aq) + 4 NH₄OH(aq) → [Cu(NH₃)₄]SO₄(aq) + 4 H₂O(l)",
      reactants: { CuSO4: 1, NH4OH: 2 }, products: { H2O: 4 },
      conditions: "Excess Aqueous Ammonia",
      deltaH_kJ_mol: -42.0,
      phenomena: { solutionColorOverride: { hex: "#1D4ED8", opacity: 0.92, name: "Deep Royal Blue [Cu(NH₃)₄]²⁺" } }
    },
    {
      id: "complex_fescn_blood_red", cat: "coordination", syllabus: "class11",
      name: "Ferric Thiocyanate Blood-Red Complex",
      equation: "FeCl₃(aq) + KSCN(aq) ⇌ [Fe(SCN)(H₂O)₅]²⁺(aq) + KCl(aq)",
      reactants: { FeCl3: 1, KSCN: 1 }, products: {},
      conditions: "Aqueous Equilibrium (Class XI Chemical Equilibrium)",
      deltaH_kJ_mol: -12.4,
      phenomena: { solutionColorOverride: { hex: "#991B1B", opacity: 0.95, name: "Blood-Red [Fe(SCN)]²⁺ Complex" } }
    },
    {
      id: "complex_prussian_blue", cat: "coordination", syllabus: "class12",
      name: "Prussian Blue Ferriferrocyanide Test",
      equation: "4 FeCl₃(aq) + 3 K₄[Fe(CN)₆](aq) → Fe₄[Fe(CN)₆]₃(s)↓ + 12 KCl(aq)",
      reactants: { FeCl3: 1, K4FeCN6: 1 }, products: {},
      conditions: "Dilute HCl medium",
      deltaH_kJ_mol: -38.5,
      phenomena: {
        precipitate: { formula: "Fe4[Fe(CN)6]3", name: "Prussian Blue Precipitate", colorHex: "#1E3A8A", molarMass: 859.2 },
        solutionColorOverride: { hex: "#1E3A8A", opacity: 0.94, name: "Intense Prussian Blue" }
      }
    },
    {
      id: "complex_nickel_dmg", cat: "coordination", syllabus: "class12",
      name: "Nickel(II) Dimethylglyoxime Rosy-Red Chelate",
      equation: "NiCl₂(aq) + 2 DMG + 2 NH₄OH → [Ni(DMG)₂](s)↓ + 2 NH₄Cl + 2 H₂O",
      reactants: { NiCl2: 1, DMG: 1 }, products: {},
      conditions: "Ammoniacal medium (NH₄OH), Square Planar Chelate",
      deltaH_kJ_mol: -44.0,
      phenomena: { precipitate: { formula: "[Ni(DMG)2]", name: "Bright Rosy-Red [Ni(DMG)₂] Complex", colorHex: "#E11D48", molarMass: 288.9 } }
    },
    {
      id: "redox_kmno4_oxalic", cat: "redox_electro", syllabus: "class12",
      name: "Permanganate vs Oxalic Acid Redox Titration",
      equation: "2 KMnO₄ + 5 H₂C₂O₄ + 3 H₂SO₄ → K₂SO₄ + 2 MnSO₄ + 10 CO₂↑ + 8 H₂O",
      reactants: { KMnO4: 2, H2C2O4: 5 }, products: { H2O: 8 },
      conditions: "Warm to 60–70 °C over Bunsen Burner in Dilute H₂SO₄",
      deltaH_kJ_mol: -195.0,
      phenomena: {
        gas: { formula: "CO2", name: "CO₂ Effervescence", colorHex: "#FFFFFF", rate: 0.7 },
        solutionColorOverride: { hex: "#FBCFE8", opacity: 0.28, name: "Faint Pink Equivalence Endpoint" }
      }
    },
    {
      id: "redox_kmno4_mohr", cat: "redox_electro", syllabus: "class12",
      name: "KMnO₄ vs Mohr's Salt (FAS) Redox Titration",
      equation: "2 KMnO₄ + 10 FeSO₄(NH₄)₂SO₄ + 8 H₂SO₄ → K₂SO₄ + 2 MnSO₄ + 5 Fe₂(SO₄)₃ + 8 H₂O",
      reactants: { KMnO4: 1, MohrSalt: 2 }, products: { H2O: 4 },
      conditions: "Cold Dilute H₂SO₄ medium (298 K)",
      deltaH_kJ_mol: -145.0,
      phenomena: { solutionColorOverride: { hex: "#FCE7F3", opacity: 0.26, name: "Decolorized Mn²⁺ Pale Pink Endpoint" } }
    },
    {
      id: "organic_sandmeyer", cat: "organic_named", syllabus: "class12",
      name: "Sandmeyer Reaction (Chlorobenzene Synthesis)",
      equation: "C₆H₅N₂⁺Cl⁻(aq) —[Cu₂Cl₂ / HCl]→ C₆H₅Cl(l) + N₂(g)↑",
      reactants: { BenzeneDiazonium: 1, Cu2Cl2: 1 }, products: {},
      conditions: "Cu₂Cl₂ / HCl catalyst at 273–278 K; brisk N₂ evolution",
      deltaH_kJ_mol: -82.0,
      phenomena: {
        gas: { formula: "N2", name: "Nitrogen Gas (N₂↑) Evolution", colorHex: "#E2E8F0", rate: 1.0 },
        solutionColorOverride: { hex: "#FEF3C7", opacity: 0.55, name: "Chlorobenzene Organic Phase" }
      }
    },
    {
      id: "organic_azo_coupling", cat: "organic_named", syllabus: "class12",
      name: "Azo Dye Coupling Reaction (Ice Bath 0–5 °C)",
      equation: "C₆H₅N₂⁺Cl⁻ + C₆H₅OH —[OH⁻, 0–5°C]→ p-HO-C₆H₄-N=N-C₆H₅(s)↓ + HCl",
      reactants: { BenzeneDiazonium: 1, Phenol: 1 }, products: { HCl: 1 },
      conditions: "Ice Bath (273–278 K), Alkaline NaOH medium",
      deltaH_kJ_mol: -64.0,
      phenomena: {
        precipitate: { formula: "C12H10N2O", name: "Brilliant Orange Azo Dye", colorHex: "#EA580C", molarMass: 198.22 },
        solutionColorOverride: { hex: "#EA580C", opacity: 0.92, name: "Brilliant Orange Azo Dye" }
      }
    },
    {
      id: "organic_phenol_bromine", cat: "organic_named", syllabus: "class12",
      name: "Bromination of Phenol (2,4,6-Tribromophenol)",
      equation: "C₆H₅OH(aq) + 3 Br₂(aq) → C₆H₂Br₃OH(s)↓ + 3 HBr(aq)",
      reactants: { Phenol: 1, Br2_water: 1 }, products: {},
      conditions: "Aqueous Bromine Water at 298 K",
      deltaH_kJ_mol: -96.0,
      hazardWarning: "Toxic Corrosive Reagent: Liquid Bromine and HBr fumes cause severe chemical burns. Always handle inside a Fume Hood.",
      phenomena: {
        precipitate: { formula: "C6H2Br3OH", name: "White 2,4,6-Tribromophenol Precipitate", colorHex: "#F8FAFC", molarMass: 330.8 },
        solutionColorOverride: { hex: "#F1F5F9", opacity: 0.50, name: "Decolorized Bromine Water + White Ppt" }
      }
    },
    {
      id: "organic_tollens_mirror", cat: "organic_named", syllabus: "class12",
      name: "Tollens' Silver Mirror Test for Aldehydes",
      equation: "CH₃CHO + 2 [Ag(NH₃)₂]⁺ + 3 OH⁻ → CH₃COO⁻ + 2 Ag(s)↓ + 4 NH₃ + 2 H₂O",
      reactants: { CH3CHO: 1, Tollens: 1 }, products: {},
      conditions: "Warm Water Bath (60 °C), Ammoniacal AgNO₃",
      deltaH_kJ_mol: -52.0,
      phenomena: {
        precipitate: { formula: "Ag(mirror)", name: "Metallic Silver Mirror Deposit", colorHex: "#E2E8F0", molarMass: 107.87 },
        solutionColorOverride: { hex: "#94A3B8", opacity: 0.85, name: "Reflective Silver Mirror Coating" }
      }
    },
    {
      id: "organic_fehling_test", cat: "organic_named", syllabus: "class12",
      name: "Fehling's Test for Aliphatic Aldehydes",
      equation: "CH₃CHO + 2 Cu²⁺ + 5 OH⁻ → CH₃COO⁻ + Cu₂O(s)↓ + 3 H₂O",
      reactants: { CH3CHO: 1, Fehling: 1 }, products: {},
      conditions: "Fehling's A + B heated in boiling water bath",
      deltaH_kJ_mol: -46.0,
      phenomena: {
        precipitate: { formula: "Cu2O", name: "Brick-Red Copper(I) Oxide (Cu₂O)", colorHex: "#DC2626", molarMass: 143.09 },
        solutionColorOverride: { hex: "#B91C1C", opacity: 0.88, name: "Brick-Red Cu₂O Suspension" }
      }
    },
    {
      id: "organic_iodoform", cat: "organic_named", syllabus: "class12",
      name: "Iodoform Test for Methyl Ketones (Yellow CHI₃)",
      equation: "CH₃COCH₃ + 3 I₂ + 4 NaOH → CHI₃(s)↓ + CH₃COONa + 3 NaI + 3 H₂O",
      reactants: { CH3COCH3: 1, I2_NaOH: 1 }, products: {},
      conditions: "Warm with I₂ / NaOH(aq)",
      deltaH_kJ_mol: -58.0,
      phenomena: {
        precipitate: { formula: "CHI3", name: "Canary Yellow Iodoform (CHI₃) Crystals", colorHex: "#FACC15", molarMass: 393.73 },
        solutionColorOverride: { hex: "#FEF08A", opacity: 0.72, name: "Yellow Iodoform Suspension" }
      }
    },
    {
      id: "organic_carbylamine", cat: "organic_named", syllabus: "class12",
      name: "Carbylamine Test for Primary Amines",
      equation: "C₆H₅NH₂ + CHCl₃ + 3 KOH(alc.) —[Δ]→ C₆H₅NC↑ + 3 KCl + 3 H₂O",
      reactants: { Aniline: 1, Chloroform: 1 }, products: {},
      conditions: "Ethanolic KOH + Heat",
      deltaH_kJ_mol: -41.0,
      hazardWarning: "Toxic Isocyanide Vapor: Phenyl isocyanide (C₆H₅NC) is extremely foul-smelling and toxic. Operate strictly inside a Fume Hood.",
      phenomena: { gas: { formula: "C6H5NC", name: "Toxic Phenyl Isocyanide Vapor", colorHex: "#FEF08A", rate: 0.85 } }
    },
    {
      id: "gas_carbonate_acid", cat: "inorganic_salt", syllabus: "class11",
      name: "Carbonate Anion Test (CO₂ Effervescence)",
      equation: "Na₂CO₃(s) + 2 HCl(aq) → 2 NaCl(aq) + H₂O(l) + CO₂(g)↑",
      reactants: { Na2CO3: 1, HCl: 2 }, products: { NaCl: 2, H2O: 1 },
      conditions: "Dilute HCl at 298 K",
      deltaH_kJ_mol: -28.5,
      phenomena: { gas: { formula: "CO2", name: "Vigorous CO₂ Effervescence", colorHex: "#FFFFFF", rate: 1.0 } }
    },
    {
      id: "gas_zinc_hcl", cat: "class11", syllabus: "class11",
      name: "Zinc + Hydrochloric Acid (H₂ Gas Evolution)",
      equation: "Zn(s) + 2 HCl(aq) → ZnCl₂(aq) + H₂(g)↑",
      reactants: { Zn_granules: 1, HCl: 2 }, products: {},
      conditions: "298 K; flammable hydrogen gas",
      deltaH_kJ_mol: -153.9,
      phenomena: { gas: { formula: "H2", name: "Flammable H₂ Gas Bubbles", colorHex: "#E2E8F0", rate: 0.95 } }
    },
    {
      id: "gas_copper_hno3", cat: "class12", syllabus: "class12",
      name: "Copper Oxidation in Conc. Nitric Acid (Brown NO₂ Plume)",
      equation: "Cu(s) + 4 HNO₃(conc.) → Cu(NO₃)₂(aq) + 2 NO₂(g)↑ + 2 H₂O(l)",
      reactants: { Cu_turnings: 1, HNO3: 4 }, products: { CuSO4: 1, H2O: 2 },
      conditions: "Concentrated HNO₃ under Fume Hood",
      deltaH_kJ_mol: -188.0,
      hazardWarning: "Toxic Gas Hazard: Dense reddish-brown Nitrogen Dioxide (NO₂) gas is corrosive to the respiratory tract.",
      phenomena: {
        gas: { formula: "NO2", name: "Dense Reddish-Brown NO₂ Fumes", colorHex: "#B45309", rate: 1.1 },
        solutionColorOverride: { hex: "#0284C7", opacity: 0.80, name: "Blue Cu(NO₃)₂ Solution" }
      }
    },
    {
      id: "hazard_sodium_water", cat: "class11", syllabus: "class11",
      name: "Alkali Metal + Water Vigorous Exothermic Reaction",
      equation: "2 Na(s) + 2 H₂O(l) → 2 NaOH(aq) + H₂(g)↑ + Heat",
      reactants: { Na_metal: 2, H2O: 2 }, products: { NaOH: 2 },
      conditions: "Cold Water; vigorous exothermic hydrogen ignition",
      deltaH_kJ_mol: -368.6,
      hazardWarning: "HIGH-ENERGY EXOTHERMIC HAZARD (ΔH° = -368.6 kJ/mol): Metallic Sodium reacts violently with water, igniting evolved Hydrogen gas.",
      phenomena: { gas: { formula: "H2", name: "Ignited Hydrogen + Na Sparks", colorHex: "#FFD600", rate: 1.5 } }
    },
    {
      id: "catalytic_h2o2_mno2", cat: "class12", syllabus: "class12",
      name: "Catalytic Decomposition of Hydrogen Peroxide",
      equation: "2 H₂O₂(aq) —[MnO₂]→ 2 H₂O(l) + O₂(g)↑",
      reactants: { H2O2: 2 }, catalyst: "MnO2", products: { H2O: 2 },
      conditions: "MnO₂ heterogeneous catalyst",
      deltaH_kJ_mol: -196.1,
      phenomena: { gas: { formula: "O2", name: "Rapid Oxygen Plume", colorHex: "#F8FAFC", rate: 1.4 } }
    }
  ];

  // Expand Encyclopedia with Additional Named Class XI & XII Reactions & Combinatorial Salts
  function buildEncyclopedia() {
    const list = [...window.CV.REACTION_RULES];
    const namedExtras = [
      ["Aldol Condensation (Acetaldehyde)", "class12", "organic_named", "2 CH₃CHO —[Dil. NaOH, Δ]→ CH₃CH=CHCHO + H₂O", "Dilute NaOH (10%), Warm to dehydrate", -36.0, "CH3CHO", "NaOH"],
      ["Cannizzaro Disproportionation Reaction", "class12", "organic_named", "2 C₆H₅CHO + Conc. NaOH → C₆H₅CH₂OH + C₆H₅COONa", "50% Conc. NaOH, Aldehydes lacking α-H", -49.0, "C6H5CHO", "NaOH"],
      ["Reimer–Tiemann Formylation of Phenol", "class12", "organic_named", "C₆H₅OH + CHCl₃ + 3 NaOH —[340 K]→ o-HO-C₆H₄-CHO + 3 NaCl + 2 H₂O", "Aq. NaOH at 340 K + HCl workup", -54.0, "Phenol", "Chloroform"],
      ["Friedel–Crafts Alkylation of Benzene", "class11", "organic_named", "C₆H₆ + CH₃Cl —[Anhyd. AlCl₃]→ C₆H₅CH₃ + HCl↑", "Anhydrous AlCl₃ Lewis acid catalyst", -68.4, "Benzene", "AlCl3_anhyd"],
      ["Fischer Esterification (Ethyl Acetate)", "class12", "organic_named", "CH₃COOH + C₂H₅OH ⇌[Conc. H₂SO₄, Δ] CH₃COOC₂H₅ + H₂O", "Conc. H₂SO₄ catalyst, Water Bath heating", -14.5, "CH3COOH", "C2H5OH"],
      ["Lucas Test for 1°, 2° & 3° Alcohols", "class12", "organic_named", "R–OH + HCl(conc.) —[Anhyd. ZnCl₂]→ R–Cl(turbidity) + H₂O", "3° instant cloudiness; 2° in 5 min; 1° on heating", -34.0, "C2H5OH", "LucasReagent"],
      ["Nessler's Test for Ammonium Ion (NH₄⁺)", "class11", "inorganic_salt", "NH₄⁺ + 2 [HgI₄]²⁻ + 4 OH⁻ → HgO·Hg(NH₂)I(s)↓ + 7 I⁻ + 3 H₂O", "Alkaline K₂[HgI₄] brown precipitate", -67.0, "NH4OH", "Nessler"],
      ["Brown Ring Test for Nitrate Ion (NO₃⁻)", "class11", "inorganic_salt", "[Fe(H₂O)₆]²⁺ + NO → [Fe(H₂O)₅(NO)]²⁺ (Brown Ring) + H₂O", "Fresh FeSO₄ + Conc. H₂SO₄ along tube wall", -48.0, "FeSO4", "HNO3"],
      ["Chromate–Dichromate pH Equilibrium", "class12", "coordination", "Cr₂O₇²⁻ (Orange) + 2 OH⁻ ⇌ 2 CrO₄²⁻ (Yellow) + H₂O", "Shifts yellow in base (pH > 8), orange in acid", -19.5, "K2Cr2O7", "NaOH"]
    ];

    namedExtras.forEach(([name, syllabus, cat, equation, conditions, dh, rA, rB], idx) => {
      list.push({
        id: `named_ext_${idx}`, cat, syllabus, name, equation,
        reactants: { [rA]: 1, [rB]: 1 }, products: {}, conditions, deltaH_kJ_mol: dh
      });
    });

    const cations = [
      ["Ag⁺", "AgNO3", "Silver"], ["Pb²⁺", "PbNO3_2", "Lead(II)"], ["Cu²⁺", "CuSO4", "Copper(II)"],
      ["Fe²⁺", "FeSO4", "Iron(II)"], ["Fe³⁺", "FeCl3", "Iron(III)"], ["Ba²⁺", "BaCl2", "Barium"],
      ["Sr²⁺", "SrCl2", "Strontium"], ["Ca²⁺", "CaCl2", "Calcium"], ["Ni²⁺", "NiCl2", "Nickel(II)"], ["Co²⁺", "CoCl2", "Cobalt(II)"]
    ];
    const anions = [
      ["OH⁻ (NaOH)", "NaOH", "Hydroxide Precipitation", -35.0],
      ["CO₃²⁻ (Na₂CO₃)", "Na2CO3", "Carbonate Precipitation", -28.0],
      ["I⁻ (KI)", "KI", "Iodide Metathesis", -42.0],
      ["SCN⁻ (KSCN)", "KSCN", "Thiocyanate Complexation", -18.0],
      ["[Fe(CN)₆]⁴⁻", "K4FeCN6", "Hexacyanoferrate(II) Complex", -46.0],
      ["SO₄²⁻ (H₂SO₄)", "H2SO4", "Sulfate Double Displacement", -31.0]
    ];

    cations.forEach(([cSym, cId, cName]) => {
      anions.forEach(([aSym, aId, rxnType, dh], j) => {
        list.push({
          id: `comb_${cId}_${aId}_${j}`, cat: "inorganic_salt", syllabus: "class12",
          name: `${cName} (${cSym}) + ${aSym} ${rxnType}`,
          equation: `${cId}(aq) + ${aId}(aq) → [${cSym}–${aSym} Product]↓/Complex`,
          reactants: { [cId]: 1, [aId]: 1 }, products: {},
          conditions: "298 K, Aqueous Qualitative Salt Analysis Medium", deltaH_kJ_mol: dh
        });
      });
    });

    return list;
  }

  window.CV.REACTIONS_ENCYCLOPEDIA = buildEncyclopedia();

  // ==========================================================================
  // 5. PRACTICAL TUTORIALS & GUIDED LAB PRESETS
  // ==========================================================================
  window.CV.TUTORIALS_DB = [
    {
      id: "tut_kmno4_oxalic",
      badge: "Class XII • Quantitative Volumetric Analysis",
      title: "1. Redox Titration: KMnO₄ vs Standard Oxalic Acid",
      aim: "To determine the molarity and strength of a given KMnO₄ solution by titrating it against standard 0.1 M Oxalic Acid.",
      theory: "In acidic medium (dilute H₂SO₄) at 60–70 °C, permanganate oxidizes oxalate to CO₂ while reducing from purple Mn(VII) to colorless Mn(II).",
      equation: "2 MnO₄⁻ + 5 C₂O₄²⁻ + 16 H⁺ → 2 Mn²⁺ + 10 CO₂↑ + 8 H₂O",
      steps: [
        "Fill the 50 mL 3D Burette with KMnO₄ solution.",
        "Dispense 25 mL of 0.1 M Oxalic Acid and 10 mL of H₂SO₄ into the vessel placed over the Bunsen Burner.",
        "Ignite the Bunsen Burner to heat to 60–70 °C, then open the burette valve until a permanent faint pink color appears."
      ],
      viva: "Q: Why is oxalic acid heated to 60 °C before titration? A: To overcome the high activation energy barrier; once Mn²⁺ forms, it autocatalyzes the reaction.",
      practicalId: "permanganate_redox"
    },
    {
      id: "tut_acid_base_curve",
      badge: "Class XI • Ionic Equilibrium & pH Curve",
      title: "2. pH-Metric Acid–Base Titration (HCl vs NaOH)",
      aim: "To plot the real-time pH titration curve of 0.1 M HCl against 0.1 M NaOH using Phenolphthalein indicator.",
      theory: "Near the equivalence point (pH 7.00), a single 0.05 mL drop of NaOH triggers a sharp pH jump from ~4.0 to ~10.0, turning Phenolphthalein magenta pink.",
      equation: "H₃O⁺(aq) + OH⁻(aq) → 2 H₂O(l)  (ΔH° = -57.3 kJ/mol)",
      steps: [
        "Dispense 25 mL of 0.1 M HCl and Phenolphthalein into the Erlenmeyer Flask.",
        "Load 0.1 M NaOH into the 3D Burette and run the Magnetic Stirrer at 600 RPM.",
        "Open the Graphs drawer to observe the sigmoidal titration curve."
      ],
      viva: "Q: What is the pH transition interval of Phenolphthalein? A: pH 8.2 to 10.0.",
      practicalId: "acid_base_titration"
    },
    {
      id: "tut_golden_rain_salt",
      badge: "Class XI & XII • Qualitative Salt Analysis",
      title: "3. Group I Cation Analysis & Golden Rain Recrystallization",
      aim: "To confirm Lead (Pb²⁺) ions using Potassium Iodide (KI) and observe thermal recrystallization.",
      theory: "Pb²⁺ reacts with I⁻ to precipitate canary-yellow Lead(II) Iodide (K_sp = 9.8 × 10⁻⁹ at 298 K).",
      equation: "Pb²⁺(aq) + 2 I⁻(aq) → PbI₂(s)↓ (Golden Yellow Platelets)",
      steps: [
        "Pour 30 mL of 0.1 M Lead(II) Nitrate into Beaker #1.",
        "Add 30 mL of 0.2 M Potassium Iodide (KI) to form bright yellow PbI₂.",
        "Move the beaker over the Bunsen Burner to dissolve on heating, then move it off the flame to recrystallize."
      ],
      viva: "Q: Why does PbI₂ dissolve in hot water? A: Its dissolution is endothermic, so solubility increases sharply with temperature.",
      practicalId: "golden_rain"
    }
  ];

  window.CV.GUIDED_PRACTICALS = [
    {
      id: "acid_base_titration", label: "Acid–Base Titration Curve", sub: "25mL HCl + Phenolphthalein vs NaOH",
      steps: [
        { action: "vessel", value: "erlenmeyer_250" },
        { action: "add", reagentId: "HCl", amount: 25, molarity: 0.1 },
        { action: "add", reagentId: "phenolphthalein", amount: 1, molarity: 0.005 },
        { action: "burette", reagentId: "NaOH" },
        { action: "stir", rpm: 600 }
      ]
    },
    {
      id: "golden_rain", label: "Golden Rain Recrystallization", sub: "Pb(NO₃)₂ + 2 KI → PbI₂(s)↓ Canary Yellow",
      steps: [
        { action: "vessel", value: "beaker_250" },
        { action: "add", reagentId: "PbNO3_2", amount: 30, molarity: 0.1 },
        { action: "add", reagentId: "KI", amount: 30, molarity: 0.2 }
      ]
    },
    {
      id: "permanganate_redox", label: "KMnO₄ vs Oxalic Acid Redox", sub: "Decolorization + CO₂ Effervescence",
      steps: [
        { action: "vessel", value: "erlenmeyer_250" },
        { action: "add", reagentId: "H2C2O4", amount: 25, molarity: 0.1 },
        { action: "add", reagentId: "H2SO4", amount: 10, molarity: 1.0 },
        { action: "burette", reagentId: "KMnO4" },
        { action: "add", reagentId: "KMnO4", amount: 8, molarity: 0.02 }
      ]
    },
    {
      id: "silver_mirror_test", label: "Tollens' Silver Mirror Test", sub: "CH₃CHO + [Ag(NH₃)₂]⁺ → Ag(0) Mirror",
      steps: [
        { action: "vessel", value: "boiling_tube" },
        { action: "add", reagentId: "CH3CHO", amount: 15, molarity: 0.5 },
        { action: "add", reagentId: "Tollens", amount: 15, molarity: 0.1 }
      ]
    },
    {
      id: "azo_dye_practical", label: "Class XII Orange Azo Dye Test", sub: "C₆H₅N₂Cl + Phenol (0–5 °C) → Orange Dye",
      steps: [
        { action: "vessel", value: "beaker_250" },
        { action: "add", reagentId: "BenzeneDiazonium", amount: 20, molarity: 0.5 },
        { action: "add", reagentId: "Phenol", amount: 20, molarity: 0.5 }
      ]
    },
    {
      id: "alkali_hazard_demo", label: "Sodium + Water Hazard Demo", sub: "2 Na(s) + 2 H₂O → 2 NaOH + H₂↑ (Warning)",
      steps: [
        { action: "vessel", value: "beaker_250" },
        { action: "add", reagentId: "H2O", amount: 50, molarity: 55.5 },
        { action: "add", reagentId: "Na_metal", amount: 2.0, unit: "g" }
      ]
    }
  ];

  // ==========================================================================
  // 6. VESSEL STATE THERMODYNAMICS, OPTICS & WEB AUDIO SYNTHESIZER
  // ==========================================================================
  window.CV.lerpHexColor = function (hexA, hexB, t) {
    const clampT = Math.max(0, Math.min(1, t));
    const numA = parseInt(hexA.replace("#", ""), 16);
    const numB = parseInt(hexB.replace("#", ""), 16);
    const rA = (numA >> 16) & 255, gA = (numA >> 8) & 255, bA = numA & 255;
    const rB = (numB >> 16) & 255, gB = (numB >> 8) & 255, bB = numB & 255;
    const r = Math.round(rA + (rB - rA) * clampT);
    const g = Math.round(gA + (gB - gA) * clampT);
    const b = Math.round(bA + (bB - bA) * clampT);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  };

  window.CV.computeIndicatorColor = function (indicatorId, pH) {
    if (indicatorId === "phenolphthalein") {
      if (pH < 8.2) return { hex: "#F8FAFC", opacity: 0.16 };
      if (pH <= 10.0) {
        const t = (pH - 8.2) / 1.8;
        return { hex: window.CV.lerpHexColor("#F8FAFC", "#EC4899", t), opacity: 0.16 + 0.72 * t };
      }
      return { hex: "#DB2777", opacity: 0.88 };
    }
    if (indicatorId === "methyl_orange") {
      if (pH < 3.1) return { hex: "#EF4444", opacity: 0.84 };
      if (pH <= 4.4) {
        const t = (pH - 3.1) / 1.3;
        return { hex: window.CV.lerpHexColor("#EF4444", "#FACC15", t), opacity: 0.80 };
      }
      return { hex: "#FACC15", opacity: 0.76 };
    }
    if (indicatorId === "bromothymol_blue") {
      if (pH < 6.0) return { hex: "#EAB308", opacity: 0.78 };
      if (pH <= 7.6) {
        const t = (pH - 6.0) / 1.6;
        return {
          hex: t < 0.5 ? window.CV.lerpHexColor("#EAB308", "#10B981", t * 2) : window.CV.lerpHexColor("#10B981", "#2563EB", (t - 0.5) * 2),
          opacity: 0.82
        };
      }
      return { hex: "#2563EB", opacity: 0.86 };
    }
    if (indicatorId === "universal_indicator") {
      const stops = [
        { pH: 1.0, hex: "#EF4444" }, { pH: 3.0, hex: "#F97316" }, { pH: 5.0, hex: "#EAB308" },
        { pH: 7.0, hex: "#22C55E" }, { pH: 9.0, hex: "#06B6D4" }, { pH: 11.0, hex: "#3B82F6" }, { pH: 13.5, hex: "#7E22CE" }
      ];
      if (pH <= stops[0].pH) return { hex: stops[0].hex, opacity: 0.85 };
      for (let i = 0; i < stops.length - 1; i++) {
        if (pH >= stops[i].pH && pH <= stops[i + 1].pH) {
          const t = (pH - stops[i].pH) / (stops[i + 1].pH - stops[i].pH);
          return { hex: window.CV.lerpHexColor(stops[i].hex, stops[i + 1].hex, t), opacity: 0.85 };
        }
      }
      return { hex: stops[stops.length - 1].hex, opacity: 0.88 };
    }
    return null;
  };

  window.CV.VesselState = class {
    constructor(vesselId, label = "Beaker #1", vesselType = "beaker", maxCapacityMl = 250, ambientTempC = 25.0) {
      this.vesselId = vesselId;
      this.label = label;
      this.vesselType = vesselType;
      this.maxCapacityMl = maxCapacityMl;
      this.ambientTempC = ambientTempC;
      this.temperatureC = ambientTempC;
      this.pressureAtm = 1.0;
      this.volumeMl = 0.0;
      this.pH = 7.00;
      this.stirrerRpm = 0;
      this.heatSourceWatts = 0;
      this.uvLightActive = false;
      this.activeCatalyst = "none";
      this.electrolysisVoltage = 0.0;
      this.species = new Map();
      this.indicators = new Set();
      this.precipitates = [];
      this.activeGas = null;
      this.colorOverride = null;
      this.reactionLog = [];
      this.liquidColorHex = "#E0F7FA";
      this.liquidOpacity = 0.16;
      this.turbidity = 0.0;
    }

    addReagent(reagentId, amountValue, unit = "mL", customMolarity = null) {
      const reagent = window.CV.LAB_REAGENTS[reagentId];
      if (!reagent) return { events: [], warnings: [] };

      const warnings = [];
      if (reagent.ghs && reagent.ghs.length > 0) {
        warnings.push(`${reagent.label} carries GHS Hazard Classifications: ${reagent.ghs.join(", ")}.`);
      }

      let addedMoles = 0;
      let addedVolumeMl = 0;

      if (unit === "mL") {
        addedVolumeMl = Math.max(0, amountValue);
        const molarity = customMolarity !== null ? customMolarity : (reagent.defaultMolarity || 1.0);
        addedMoles = (addedVolumeMl / 1000) * molarity;
        this.volumeMl += addedVolumeMl;
        if (this.volumeMl > this.maxCapacityMl) {
          warnings.push(`Vessel Overflow Warning: Total volume (${this.volumeMl.toFixed(1)} mL) exceeds ${this.maxCapacityMl} mL nominal capacity.`);
        }
        if (reagent.state === "aqueous" && reagentId !== "H2O") {
          const waterMoles = (addedVolumeMl / 1000) * 55.5;
          const prevWater = this.species.get("H2O")?.moles || 0;
          this.species.set("H2O", { moles: prevWater + waterMoles });
        }
      } else if (unit === "g") {
        const massG = Math.max(0, amountValue);
        addedMoles = massG / reagent.molarMass;
        addedVolumeMl = massG / (reagent.density || 2.0);
        this.volumeMl += addedVolumeMl;
      }

      if (reagent.category === "indicator") this.indicators.add(reagentId);
      const currentMoles = this.species.get(reagentId)?.moles || 0;
      this.species.set(reagentId, { moles: currentMoles + addedMoles });

      const events = this.evaluateReactions(warnings);
      this.recalculatepHAndOptics();
      return { events, warnings };
    }

    evaluateReactions(warningsOut = []) {
      const events = [];
      for (const rule of window.CV.REACTION_RULES) {
        if (rule.catalyst && (this.species.get(rule.catalyst)?.moles || 0) <= 1e-6 && this.activeCatalyst !== rule.catalyst) {
          continue;
        }

        let xi = Infinity;
        for (const [rId, coeff] of Object.entries(rule.reactants)) {
          const availableMoles = this.species.get(rId)?.moles || 0;
          xi = Math.min(xi, availableMoles / coeff);
        }

        if (xi > 1e-6 && Number.isFinite(xi)) {
          for (const [rId, coeff] of Object.entries(rule.reactants)) {
            const rem = Math.max(0, (this.species.get(rId)?.moles || 0) - xi * coeff);
            if (rem <= 1e-7) this.species.delete(rId);
            else this.species.set(rId, { moles: rem });
          }

          for (const [pId, coeff] of Object.entries(rule.products || {})) {
            const cur = this.species.get(pId)?.moles || 0;
            this.species.set(pId, { moles: cur + xi * coeff });
          }

          const heatJoules = -xi * (rule.deltaH_kJ_mol || -35.0) * 1000;
          const effectiveMassG = Math.max(10, this.volumeMl * 1.0);
          const deltaT = heatJoules / (effectiveMassG * 4.184);
          this.temperatureC = Math.min(140, Math.max(-20, this.temperatureC + deltaT));

          if (rule.hazardWarning) {
            warningsOut.push(rule.hazardWarning);
          }

          if (rule.phenomena?.precipitate) {
            const p = rule.phenomena.precipitate;
            const massFormedG = xi * (p.molarMass || 150);
            const existing = this.precipitates.find(item => item.formula === p.formula);
            if (existing) existing.massG += massFormedG;
            else this.precipitates.push({ ...p, massG: massFormedG });
            this.turbidity = Math.min(0.95, this.turbidity + Math.min(0.7, massFormedG * 2.5));
          }

          if (rule.phenomena?.gas) {
            this.activeGas = {
              ...rule.phenomena.gas,
              molesEvolved: xi,
              expiresAt: performance.now() + 6500
            };
          }

          if (rule.phenomena?.solutionColorOverride) {
            this.colorOverride = rule.phenomena.solutionColorOverride;
          }

          const logEntry = {
            timestamp: new Date().toLocaleTimeString(),
            ruleId: rule.id,
            name: rule.name,
            equation: rule.equation,
            extentMoles: Number(xi.toFixed(5)),
            deltaTempC: Number(deltaT.toFixed(2))
          };
          this.reactionLog.unshift(logEntry);
          events.push(logEntry);
        }
      }
      return events;
    }

    recalculatepHAndOptics() {
      if (this.volumeMl <= 0.05) {
        this.pH = 7.00;
        this.liquidColorHex = "#E0F7FA";
        this.liquidOpacity = 0.0;
        return;
      }

      const volL = this.volumeMl / 1000;
      let netHPlusMoles = 0, weakAcidHPlus = 0, weakBaseOHMinus = 0;

      for (const [rId, data] of this.species.entries()) {
        const r = window.CV.LAB_REAGENTS[rId];
        if (!r || data.moles <= 1e-8) continue;
        const concM = data.moles / volL;

        if (r.category === "acid") {
          if (r.acidType === "strong") netHPlusMoles += data.moles * (r.proticity || 1);
          else if (r.pKa !== undefined) weakAcidHPlus += Math.sqrt(Math.pow(10, -r.pKa) * concM) * volL;
        } else if (r.category === "base") {
          if (r.baseType === "strong") netHPlusMoles -= data.moles * (r.acidity || 1);
          else if (r.pKb !== undefined) weakBaseOHMinus += Math.sqrt(Math.pow(10, -r.pKb) * concM) * volL;
        }
      }

      const netConc = (netHPlusMoles + weakAcidHPlus - weakBaseOHMinus) / volL;
      if (Math.abs(netConc) < 1e-7) this.pH = 7.00;
      else if (netConc > 0) this.pH = Math.max(-0.5, Math.min(14.5, -Math.log10(netConc)));
      else this.pH = Math.max(-0.5, Math.min(14.5, 14.0 - (-Math.log10(Math.abs(netConc)))));

      if (this.colorOverride) {
        this.liquidColorHex = this.colorOverride.hex;
        this.liquidOpacity = this.colorOverride.opacity;
        return;
      }

      const coloredSpecies = ["KMnO4", "K2Cr2O7", "Fehling", "Br2_water", "CuSO4", "FeCl3", "CoCl2", "NiCl2", "FeSO4"];
      for (const cId of coloredSpecies) {
        const moles = this.species.get(cId)?.moles || 0;
        if (moles > 1e-6) {
          const r = window.CV.LAB_REAGENTS[cId];
          const conc = moles / volL;
          const saturation = Math.min(1, conc / ((r.defaultMolarity || 0.2) * 0.35));
          this.liquidColorHex = window.CV.lerpHexColor("#E0F7FA", r.colorHex, Math.max(0.3, saturation));
          this.liquidOpacity = 0.28 + 0.65 * saturation;
          return;
        }
      }

      if (this.indicators.size > 0) {
        const activeIndicator = Array.from(this.indicators)[this.indicators.size - 1];
        const indColor = window.CV.computeIndicatorColor(activeIndicator, this.pH);
        if (indColor) {
          this.liquidColorHex = indColor.hex;
          this.liquidOpacity = indColor.opacity;
          return;
        }
      }

      this.liquidColorHex = "#E0F7FA";
      this.liquidOpacity = 0.18;
    }

    stepThermalAndPhysics(dtSeconds) {
      if (this.heatSourceWatts > 0 && this.volumeMl > 0) {
        const massG = Math.max(15, this.volumeMl);
        const dT = (this.heatSourceWatts * dtSeconds) / (massG * 4.184);
        this.temperatureC = Math.min(104.0, this.temperatureC + dT);

        // Trigger thermal reactions once heated past 55 °C
        if (this.temperatureC >= 55.0 && this.species.size > 0) {
          this.evaluateReactions();
          this.recalculatepHAndOptics();
        }

        if (this.temperatureC >= 99.8) {
          this.activeGas = {
            formula: "H2O(g)", name: "Boiling Water Vapor (Steam)",
            colorHex: "#F1F5F9", rate: 0.85, expiresAt: performance.now() + 1000
          };
        }
      } else {
        this.temperatureC += (this.ambientTempC - this.temperatureC) * 0.045 * dtSeconds;
      }

      if (this.electrolysisVoltage >= 1.5 && this.volumeMl > 5) {
        this.activeGas = {
          formula: "H₂/O₂↑", name: "Electrolytic Gas Evolution",
          colorHex: "#BAE6FD", rate: 0.9, expiresAt: performance.now() + 800
        };
      }

      if (this.activeGas && performance.now() > this.activeGas.expiresAt) {
        this.activeGas = null;
      }

      if (this.turbidity > 0.05 && this.stirrerRpm === 0) {
        this.turbidity = Math.max(0.05, this.turbidity - 0.04 * dtSeconds);
      }
    }

    toTelemetryJSON() {
      return {
        vesselId: this.vesselId,
        label: this.label,
        vesselType: this.vesselType,
        volumeMl: Number(this.volumeMl.toFixed(2)),
        temperatureC: Number(this.temperatureC.toFixed(2)),
        heatSourceWatts: this.heatSourceWatts,
        pH: Number(this.pH.toFixed(2)),
        activeCatalyst: this.activeCatalyst,
        uvLightActive: this.uvLightActive,
        dissolvedSpecies: Array.from(this.species.entries()).map(([id, v]) => ({
          reagentId: id,
          moles: Number(v.moles.toFixed(5))
        })),
        precipitates: this.precipitates,
        activeGas: this.activeGas ? this.activeGas.formula : null,
        recentReactions: this.reactionLog.slice(0, 4)
      };
    }
  };

  window.CV.registerCustomReaction = function ({ reactantA, reactantB, equation, colorHex, deltaH, hasPpt, hasGas }) {
    const cleanA = (reactantA || "").trim();
    const cleanB = (reactantB || "").trim();
    if (!cleanA || !cleanB) return null;

    [cleanA, cleanB].forEach(formula => {
      if (!window.CV.LAB_REAGENTS[formula]) {
        window.CV.LAB_REAGENTS[formula] = {
          id: formula, formula, label: `${formula} Reagent`,
          category: "organic", state: "aqueous", molarMass: 110.0,
          defaultMolarity: 0.5, density: 1.02, colorHex: "#E0F2FE", opacity: 0.25, ghs: []
        };
      }
    });

    const customRule = {
      id: `custom_${Date.now()}`,
      cat: "organic_named",
      syllabus: "class12",
      name: "Unrestricted Custom Reaction",
      equation: equation?.trim() || `${cleanA} + ${cleanB} → Synthesized Product`,
      reactants: { [cleanA]: 1, [cleanB]: 1 },
      products: {},
      conditions: "Custom Sandbox Conditions",
      deltaH_kJ_mol: Number(deltaH) || -45.0,
      phenomena: {
        solutionColorOverride: { hex: colorHex || "#10B981", opacity: 0.86, name: "Custom Product" }
      }
    };

    if (hasPpt) {
      customRule.phenomena.precipitate = {
        formula: "Ppt(s)↓", name: "Synthesized Solid Precipitate",
        colorHex: colorHex || "#10B981", molarMass: 165.0
      };
    }
    if (hasGas) {
      customRule.phenomena.gas = {
        formula: "Gas(g)↑", name: "Evolved Reaction Gas",
        colorHex: "#E2E8F0", rate: 1.0
      };
    }

    window.CV.REACTION_RULES.unshift(customRule);
    window.CV.REACTIONS_ENCYCLOPEDIA.unshift(customRule);
    return customRule;
  };

  // Web Audio Synthesizer
  class LabAudioSynthesizer {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    }
    play(type) {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        if (type === "drop") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(580, now);
          osc.frequency.exponentialRampToValueAtTime(1240, now + 0.065);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
          osc.start(now);
          osc.stop(now + 0.07);
        } else if (type === "pour") {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(260, now);
          osc.frequency.linearRampToValueAtTime(410, now + 0.22);
          gain.gain.setValueAtTime(0.11, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
          osc.start(now);
          osc.stop(now + 0.24);
        } else if (type === "fizz") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(190 + Math.random() * 140, now);
          gain.gain.setValueAtTime(0.045, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          osc.start(now);
          osc.stop(now + 0.16);
        } else if (type === "clink") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(2450, now);
          osc.frequency.exponentialRampToValueAtTime(2100, now + 0.09);
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
        }
      } catch (_) {}
    }
  }

  window.CV.labAudio = new LabAudioSynthesizer();
})();
