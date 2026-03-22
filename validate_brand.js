
const { tiktokAdsData } = require('./src/data/realAdsData.js');

const targetBrand = 'HANASUI';
const targetDate = '2026-03-11';

// Mock the normalization logic
const normalize = (d) => {
    let brand = d.BRAND || d.brand || '-';
    if (brand === '-' && d['Campaign name']) {
        const parts = d['Campaign name'].split('//').map(p => p.trim());
        if (parts.length >= 3) {
            const possibleBrand = parts[2].toUpperCase();
            if (['HANASUI', 'NCO', 'FYNE', 'EOMMA BABY'].includes(possibleBrand)) {
                brand = possibleBrand;
            } else if (parts[1] && ['HANASUI', 'NCO', 'FYNE', 'EOMMA BABY'].includes(parts[1].toUpperCase())) {
                brand = parts[1].toUpperCase();
            }
        }
    }
    return { ...d, BRAND: brand };
};

const normalized = tiktokAdsData.map(normalize);
const hanasuiData = normalized.filter(d => d.BRAND === targetBrand && d.By Day === targetDate);

console.log(`Total Hanasui Rows on ${targetDate}: ${hanasuiData.length}`);
const totalSpend = hanasuiData.reduce((acc, curr) => acc + (Number(curr.Cost) || 0), 0);
console.log(`Total Hanasui Spend on ${targetDate}: ${totalSpend}`);

const otherBrands = normalized.filter(d => d.BRAND !== targetBrand && d.BRAND !== '-' && d.By Day === targetDate);
console.log(`Total Other Brands Rows on ${targetDate}: ${otherBrands.length}`);
console.log(`Brands found today: ${[...new Set(otherBrands.map(o => o.BRAND))]}`);
