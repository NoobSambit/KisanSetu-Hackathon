/**
 * Weather Intelligence Service (Phase 3)
 *
 * Integrates with OpenWeatherMap API for real-time weather data
 * Provides weather-based farming advice and alerts
 */

import {
  ServiceResponse,
  createSuccessResponse,
  createErrorResponse,
} from '../utils/errorHandler';
import { cache } from '../utils/cache';

export interface WeatherData {
  location: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  description: string;
  icon: string;
  alerts?: WeatherAlert[];
  forecast?: DailyForecast[];
  farmingAdvice?: string;
}

export interface WeatherAlert {
  type: 'extreme-heat' | 'heavy-rain' | 'frost' | 'wind' | 'general';
  severity: 'low' | 'medium' | 'high';
  message: string;
  advice: string;
}

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  rainProbability: number;
  description: string;
  icon: string;
}

/**
 * Get current weather data by city name
 */
export async function getWeatherByCity(
  city: string
): Promise<ServiceResponse<WeatherData>> {
  try {
    // Check cache first (cache for 30 minutes)
    const cacheKey = `weather:city:${city.toLowerCase()}`;
    const cached = cache.get<WeatherData>(cacheKey);

    if (cached) {
      return createSuccessResponse(cached);
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      // If no API key, return mock data for development
      console.warn('OpenWeatherMap API key not found, using mock data');
      const mockData = await getMockWeatherData(city);
      cache.set(cacheKey, mockData, 1800); // 30 minutes
      return createSuccessResponse(mockData);
    }

    // Call OpenWeatherMap API
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}`);
    }

    const data = await response.json();
    const weatherData = parseOpenWeatherResponse(data);

    // Cache for 30 minutes
    cache.set(cacheKey, weatherData, 1800);

    return createSuccessResponse(weatherData);
  } catch (error) {
    console.error('Weather fetch error:', error);
    return createErrorResponse(
      'Failed to fetch weather data. Please try again.',
      'WEATHER_FETCH_FAILED'
    );
  }
}

/**
 * Get weather by coordinates
 */
export async function getWeatherByCoordinates(
  lat: number,
  lon: number
): Promise<ServiceResponse<WeatherData>> {
  try {
    const cacheKey = `weather:coords:${lat},${lon}`;
    const cached = cache.get<WeatherData>(cacheKey);

    if (cached) {
      return createSuccessResponse(cached);
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      const mockData = await getMockWeatherData('Your Location');
      cache.set(cacheKey, mockData, 1800);
      return createSuccessResponse(mockData);
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}`);
    }

    const data = await response.json();
    const weatherData = parseOpenWeatherResponse(data);

    cache.set(cacheKey, weatherData, 1800);
    return createSuccessResponse(weatherData);
  } catch (error) {
    console.error('Weather fetch error:', error);
    return createErrorResponse(
      'Failed to fetch weather data. Please try again.',
      'WEATHER_FETCH_FAILED'
    );
  }
}

/**
 * Parse OpenWeatherMap API response
 */
function parseOpenWeatherResponse(data: any): WeatherData {
  const weather: WeatherData = {
    location: data.name || 'Unknown',
    coordinates: {
      lat: data.coord.lat,
      lon: data.coord.lon,
    },
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
    rainProbability: data.rain ? 80 : 20, // Simplified
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    alerts: [],
  };

  // Generate alerts and farming advice
  weather.alerts = generateWeatherAlerts(weather);
  weather.farmingAdvice = generateFarmingAdvice(weather);

  return weather;
}

/**
 * Generate weather alerts based on conditions
 */
function generateWeatherAlerts(weather: WeatherData): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  // Extreme heat alert
  if (weather.temperature > 38) {
    alerts.push({
      type: 'extreme-heat',
      severity: 'high',
      message: `Extreme heat warning: ${weather.temperature}°C`,
      advice:
        'Increase watering frequency. Provide shade for sensitive crops. Avoid working in fields during peak heat (12-3 PM).',
    });
  } else if (weather.temperature > 35) {
    alerts.push({
      type: 'extreme-heat',
      severity: 'medium',
      message: `High temperature: ${weather.temperature}°C`,
      advice:
        'Monitor crops for heat stress. Water early morning or evening. Mulch to retain soil moisture.',
    });
  }

  // Rain alert
  if (weather.rainProbability > 70) {
    alerts.push({
      type: 'heavy-rain',
      severity: 'medium',
      message: 'High chance of rain',
      advice:
        'Postpone irrigation. Ensure proper drainage in fields. Cover harvested crops. Delay pesticide/fertilizer application.',
    });
  }

  // Cold alert
  if (weather.temperature < 10) {
    alerts.push({
      type: 'frost',
      severity: weather.temperature < 5 ? 'high' : 'medium',
      message: `Cold weather: ${weather.temperature}°C`,
      advice:
        'Protect sensitive crops with covers. Avoid watering late evening. Harvest mature crops before frost.',
    });
  }

  // High wind alert
  if (weather.windSpeed > 40) {
    alerts.push({
      type: 'wind',
      severity: weather.windSpeed > 60 ? 'high' : 'medium',
      message: `High winds: ${weather.windSpeed} km/h`,
      advice:
        'Secure loose equipment and structures. Stake young plants. Avoid spraying pesticides/fertilizers.',
    });
  }

  return alerts;
}

/**
 * Generate farming advice based on weather
 */
function generateFarmingAdvice(weather: WeatherData): string {
  const { temperature, humidity, rainProbability } = weather;

  if (temperature > 35 && humidity < 40) {
    return 'Hot and dry conditions. Increase irrigation frequency. Apply mulch to conserve soil moisture. Monitor crops for wilting.';
  }

  if (rainProbability > 70) {
    return 'Rain expected soon. Good time to postpone watering. Ensure field drainage is clear. Delay fertilizer application until after rain.';
  }

  if (humidity > 80 && temperature > 25) {
    return 'High humidity increases disease risk. Monitor for fungal infections. Ensure good air circulation in dense plantings. Consider preventive fungicide spray.';
  }

  if (temperature >= 20 && temperature <= 30 && humidity >= 50 && humidity <= 70) {
    return 'Ideal conditions for farming! Good time for planting, transplanting, and general field work. Regular watering schedule recommended.';
  }

  return 'Monitor your crops regularly. Adjust watering based on soil moisture. Follow seasonal best practices for your region.';
}

/**
 * Mock weather data for development/testing
 */
async function getMockWeatherData(location: string): Promise<WeatherData> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockScenarios = [
    {
      location,
      temperature: 32,
      feelsLike: 35,
      humidity: 65,
      windSpeed: 15,
      rainProbability: 20,
      description: 'Partly cloudy',
      icon: '02d',
    },
    {
      location,
      temperature: 28,
      feelsLike: 29,
      humidity: 75,
      windSpeed: 10,
      rainProbability: 60,
      description: 'Cloudy with chance of rain',
      icon: '04d',
    },
    {
      location,
      temperature: 36,
      feelsLike: 39,
      humidity: 45,
      windSpeed: 20,
      rainProbability: 10,
      description: 'Clear sky',
      icon: '01d',
    },
  ];

  const weather =
    mockScenarios[Math.floor(Math.random() * mockScenarios.length)];

  const weatherData: WeatherData = {
    ...weather,
    alerts: generateWeatherAlerts(weather as WeatherData),
    farmingAdvice: generateFarmingAdvice(weather as WeatherData),
  };

  return weatherData;
}
