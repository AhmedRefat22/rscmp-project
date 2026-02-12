import { useState, useEffect } from 'react';
import { countries } from '../../data/countries';

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    placeholder?: string;
}

export default function PhoneInput({ value, onChange, error, placeholder }: PhoneInputProps) {
    const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Default to Egypt (+20) or first
    const [phoneNumber, setPhoneNumber] = useState('');

    // Parse initial value to split country code and number
    useEffect(() => {
        if (value) {
            // Find country matching the start of the value
            // Sort by length desc to match longest prefix (e.g. +1 vs +1242)
            const sortedCountries = [...countries].sort((a, b) => b.dial_code.length - a.dial_code.length);
            const country = sortedCountries.find(c => value.startsWith(c.dial_code));

            if (country) {
                setSelectedCountry(country);
                // Remove code from value to get number
                // Handle cases where value might have spaces
                const cleanValue = value.replace(/\s/g, '');
                const cleanCode = country.dial_code.replace(/\s/g, '');
                if (cleanValue.startsWith(cleanCode)) {
                    setPhoneNumber(value.slice(country.dial_code.length).trim());
                } else {
                    setPhoneNumber(value);
                }
            } else {
                setPhoneNumber(value);
            }
        }
    }, [value]);

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        const country = countries.find(c => c.code === code);
        if (country) {
            setSelectedCountry(country);
            // Update parent with new code + existing number
            updateValue(country.dial_code, phoneNumber);
        }
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const number = e.target.value.replace(/[^0-9]/g, ''); // Allow only numbers
        setPhoneNumber(number);
        updateValue(selectedCountry.dial_code, number);
    };

    const updateValue = (code: string, number: string) => {
        if (number) {
            onChange(`${code}${number}`);
        } else {
            onChange('');
        }
    };

    return (
        <div>
            <div className="relative flex rounded-lg shadow-sm">
                <div className="absolute inset-y-0 start-0 flex items-center z-10">
                    <label htmlFor="country-select" className="sr-only">Country</label>
                    <select
                        id="country-select"
                        value={selectedCountry.code}
                        onChange={handleCountryChange}
                        className="h-full py-0 ps-3 pe-7 bg-transparent bg-none text-secondary-500 sm:text-sm rounded-md border-transparent focus:ring-0 focus:border-transparent text-xs sm:text-sm font-medium"
                        dir="ltr"
                        style={{ maxWidth: '6rem' }}
                    >
                        {countries.map((country) => (
                            <option key={country.code} value={country.code}>
                                {country.code} ({country.dial_code})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="absolute inset-y-0 start-0 flex items-center pointer-events-none ps-3">
                    {/* Placeholder for icon if needed, but select takes space */}
                </div>

                <div className="relative w-full">
                    <div className="absolute inset-y-0 start-16 md:start-20 flex items-center pointer-events-none ps-2 text-secondary-400">
                        {/* Vertical separator */}
                        <span className="text-secondary-300">|</span>
                    </div>
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={handleNumberChange}
                        className={`block w-full rounded-lg border-secondary-300 ps-20 md:ps-24 py-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-secondary-800 dark:border-secondary-600 dark:text-white ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
                        placeholder={placeholder}
                        dir="ltr"
                    />
                </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
}
