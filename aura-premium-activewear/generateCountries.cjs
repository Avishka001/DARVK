const https = require('https');
const fs = require('fs');

https.get('https://raw.githubusercontent.com/mledoze/countries/master/countries.json', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body);
    const countryList = data.map(c => {
      const currencyCodes = Object.keys(c.currencies || {});
      const currencyCode = currencyCodes.length > 0 ? currencyCodes[0] : 'USD';
      const currencySymbol = currencyCodes.length > 0 && c.currencies[currencyCode].symbol ? c.currencies[currencyCode].symbol : currencyCode;
      return {
        code: c.cca2,
        name: c.name.common,
        currencyCode,
        currencySymbol,
        flagUrl: `https://flagcdn.com/w40/${c.cca2.toLowerCase()}.png`
      };
    }).sort((a, b) => {
      // Put Sri Lanka at the top as requested
      if (a.code === 'LK') return -1;
      if (b.code === 'LK') return 1;
      return a.name.localeCompare(b.name);
    });
    
    const tsContent = `export interface CountryData {
  code: string;
  name: string;
  currencyCode: string;
  currencySymbol: string;
  flagUrl: string;
}

export const ALL_COUNTRIES: CountryData[] = ${JSON.stringify(countryList, null, 2)};
`;
    fs.writeFileSync('src/data/countryList.ts', tsContent);
    console.log('Saved to src/data/countryList.ts');
  });
}).on('error', (e) => {
  console.error(e);
});
