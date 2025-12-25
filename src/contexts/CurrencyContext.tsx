import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, CurrencyInfo } from '@/services/api';
import { useAuth } from './AuthContext';

interface CurrencyContextType {
  currentCurrency: string;
  currencyInfo: CurrencyInfo | null;
  availableCurrencies: CurrencyInfo[];
  formatAmount: (amount: number) => string;
  setCurrency: (currencyCode: string) => Promise<void>;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [currentCurrency, setCurrentCurrency] = useState<string>('USD');
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo | null>(null);
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Load available currencies
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const currencies = await apiService.getCurrencies();
        setAvailableCurrencies(currencies);
      } catch (error) {
        console.error('Error loading currencies:', error);
        // Set default currencies if API fails
        setAvailableCurrencies([
          {
            code: 'USD',
            name: 'US Dollar',
            symbol: '$',
            position: 'before',
            decimals: 2
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadCurrencies();
  }, []);

  // Update currency when user changes or currencies are loaded
  useEffect(() => {
    if (isAuthenticated && user?.baseCurrency && availableCurrencies.length > 0) {
      const userCurrency = user.baseCurrency;
      const currency = availableCurrencies.find(c => c.code === userCurrency);
      
      if (currency) {
        setCurrentCurrency(userCurrency);
        setCurrencyInfo(currency);
      } else {
        // If user's currency is not in available currencies, create a temporary CurrencyInfo
        // This handles cases like EGP that might not be in the API response yet
        const tempCurrencyInfo: CurrencyInfo = {
          code: userCurrency,
          name: userCurrency === 'EGP' ? 'Egyptian Pound' : 
                userCurrency === 'SAR' ? 'Saudi Riyal' : 
                userCurrency === 'USD' ? 'US Dollar' : userCurrency,
          symbol: userCurrency === 'EGP' ? 'E£' : 
                  userCurrency === 'SAR' ? 'ريال' : 
                  userCurrency === 'USD' ? '$' : userCurrency,
          position: 'before',
          decimals: 2
        };
        setCurrentCurrency(userCurrency);
        setCurrencyInfo(tempCurrencyInfo);
      }
    } else if (!isAuthenticated) {
      // Default to USD for non-authenticated users
      const usdCurrency = availableCurrencies.find(c => c.code === 'USD');
      if (usdCurrency) {
        setCurrentCurrency('USD');
        setCurrencyInfo(usdCurrency);
      }
    }
  }, [user?.baseCurrency, isAuthenticated, availableCurrencies]);

  const formatAmount = (amount: number): string => {
    if (!currencyInfo) return amount.toString();
    
    const formattedAmount = amount.toFixed(currencyInfo.decimals);
    
    if (currencyInfo.position === 'before') {
      return `${currencyInfo.symbol}${formattedAmount}`;
    } else {
      return `${formattedAmount} ${currencyInfo.symbol}`;
    }
  };

  const setCurrency = async (currencyCode: string): Promise<void> => {
    if (!isAuthenticated || !user) {
      throw new Error('User must be authenticated to change currency');
    }

    // Check if currency is available in the list
    const isCurrencyAvailable = availableCurrencies.some(c => c.code === currencyCode);
    
    if (!isCurrencyAvailable) {
      // Reload currencies first to check if it was added
      try {
        const currencies = await apiService.getCurrencies();
        setAvailableCurrencies(currencies);
        
        const stillNotAvailable = !currencies.some(c => c.code === currencyCode);
        if (stillNotAvailable) {
          throw new Error(`Currency ${currencyCode} is not available. Please make sure it's added to the backend first.`);
        }
      } catch (error: any) {
        throw new Error(`Currency ${currencyCode} is not available. ${error?.message || 'Please make sure it\'s added to the backend first.'}`);
      }
    }

    try {
      setLoading(true);
      
      // Update user profile with new currency
      try {
        await apiService.updateProfile({
          base_currency: currencyCode
        });
      } catch (error: any) {
        // Extract detailed error message from response
        let errorMessage = 'Failed to update currency. The currency may not be supported by the backend.';
        
        if (error?.response?.status === 500) {
          errorMessage = 'Internal server error. Please check the backend logs or contact support. The currency may need to be added to the backend database first.';
        } else if (error?.response?.status === 400) {
          errorMessage = error?.response?.data?.message || 
                        error?.response?.data?.error ||
                        'Invalid currency code. Please make sure the currency is supported by the backend.';
        } else if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error?.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error?.response?.data?.errors) {
          if (Array.isArray(error.response.data.errors)) {
            errorMessage = error.response.data.errors.join(', ');
          } else if (typeof error.response.data.errors === 'object') {
            const errorKeys = Object.keys(error.response.data.errors);
            if (errorKeys.length > 0) {
              errorMessage = error.response.data.errors[errorKeys[0]] || errorMessage;
            }
          }
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }

      // Refresh user data in AuthContext to get the updated currency
      await refreshUser();

      // Reload currencies from API to get the latest list (including EGP if it was just added)
      try {
        const currencies = await apiService.getCurrencies();
        setAvailableCurrencies(currencies);
        
        // Find the currency in the updated list
        const newCurrency = currencies.find(c => c.code === currencyCode);
        if (newCurrency) {
          setCurrentCurrency(currencyCode);
          setCurrencyInfo(newCurrency);
        } else {
          // If currency not found in API response, create a temporary CurrencyInfo
          // This handles cases where the backend hasn't returned the currency yet
          const tempCurrencyInfo: CurrencyInfo = {
            code: currencyCode,
            name: currencyCode === 'EGP' ? 'Egyptian Pound' : currencyCode,
            symbol: currencyCode === 'EGP' ? 'E£' : currencyCode,
            position: 'before',
            decimals: 2
          };
          setCurrentCurrency(currencyCode);
          setCurrencyInfo(tempCurrencyInfo);
        }
      } catch (currencyError) {
        console.error('Error reloading currencies:', currencyError);
        // Fallback: update with temporary currency info
        const tempCurrencyInfo: CurrencyInfo = {
          code: currencyCode,
          name: currencyCode === 'EGP' ? 'Egyptian Pound' : currencyCode,
          symbol: currencyCode === 'EGP' ? 'E£' : currencyCode,
          position: 'before',
          decimals: 2
        };
        setCurrentCurrency(currencyCode);
        setCurrencyInfo(tempCurrencyInfo);
      }
    } catch (error: any) {
      console.error('Error updating currency:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currentCurrency,
        currencyInfo,
        availableCurrencies,
        formatAmount,
        setCurrency,
        loading
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyProvider; 