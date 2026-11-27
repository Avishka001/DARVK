import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ALL_COUNTRIES, CountryData } from '../data/countryList';

export interface Country extends CountryData {
  exchangeRate: number;
}

interface CurrencyContextType {
  countries: Country[];
  selectedCountry: Country;
  setSelectedCountryByCode: (code: string) => void;
  formatPrice: (basePriceLkr: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const defaultLk = ALL_COUNTRIES.find(c => c.code === 'LK') || ALL_COUNTRIES[0];
  const [countries, setCountries] = useState<Country[]>(
    ALL_COUNTRIES.map(c => ({ ...c, exchangeRate: 1 }))
  );
  
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    ...defaultLk,
    exchangeRate: 1
  });

  useEffect(() => {
    const fetchRates = () => {
      // Fetch live exchange rates using LKR as the base currency
      fetch('https://open.er-api.com/v6/latest/LKR')
        .then(res => res.json())
        .then(data => {
          if (data && data.rates) {
            const rates = data.rates;
            
            setCountries(prev => prev.map(c => ({
              ...c,
              exchangeRate: rates[c.currencyCode] || 1
            })));

            setSelectedCountry(prev => ({
              ...prev,
              exchangeRate: rates[prev.currencyCode] || prev.exchangeRate
            }));
          }
        })
        .catch(err => console.error('Failed to fetch exchange rates:', err));
    };

    fetchRates();
    // Refresh exchange rates every 10 minutes to ensure they are always up-to-date
    const intervalId = setInterval(fetchRates, 10 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const setSelectedCountryByCode = (code: string) => {
    const country = countries.find((c) => c.code === code);
    if (country) {
      setSelectedCountry(country);
    }
  };

  const formatPrice = (basePriceLkr: number) => {
    const convertedPrice = basePriceLkr * selectedCountry.exchangeRate;
    
    // Custom formatting to keep it clean
    const formattedNumber = convertedPrice.toLocaleString('en-US', {
      minimumFractionDigits: selectedCountry.currencyCode === 'LKR' ? 0 : 2,
      maximumFractionDigits: selectedCountry.currencyCode === 'LKR' ? 0 : 2,
    });
    
    return `${selectedCountry.currencyCode} ${formattedNumber}`;
  };

  return (
    <CurrencyContext.Provider value={{ countries, selectedCountry, setSelectedCountryByCode, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
