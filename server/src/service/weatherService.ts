import dotenv from 'dotenv';
import fetch from 'node-fetch';
import dayjs, { type Dayjs } from 'dayjs';
dotenv.config();

interface Coordinates {
  lat: number;
  lon: number;
  name: string;
}

interface Weather {
  city: string;
  date: Dayjs | string;
  icon: number;
  description: string;
  tempF: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
}




class WeatherService {
  private baseURL: string = 'https://api.openweathermap.org/data/2.5/';
  private apiKey: string = process.env.API_KEY || '';
  private city: string = ''

  // Fetch coordinates using city name
  private async fetchLocationData(query: string): Promise<Coordinates> {
    console.log('in fetch location funciton')
    const url = this.buildGeocodeQuery(query);
    console.log(url, 'in fetch location funciton')
    const response = await fetch(url);
    console.log(response.status , "in fetch function")
    const data: any = await response.json();
    if (data.cod !== 200) {
      throw new Error('City not found');
    }
    console.log(data, ">===============================>")
    return { name: data.name, lat: data.coord.lat, lon: data.coord.lon };
  }

  private destructureLocationData(locationData: Coordinates): Coordinates {
    return {
      lat: locationData.lat,
      lon: locationData.lon,
      name: locationData.name
    };
  }

  private buildGeocodeQuery(city: string): string {
    console.log(this.apiKey, "api keyyyyy")
    return `${this.baseURL}weather?q=${city}&appid=${this.apiKey}&units=imperial`;
  }

  private buildWeatherQuery(coordinates: Coordinates): string {
    return `${this.baseURL}forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.apiKey}&units=imperial`;
  }
  private async fetchAndDestructureLocationData(): Promise<Coordinates> {
    // console.log(this.city, 'in fetch funciton')
    const rawLocationData = await this.fetchLocationData(this.city);
    // console.log(rawLocationData, "raw data==========")
    return this.destructureLocationData(rawLocationData);
  }

  private async fetchWeatherData(coordinates: Coordinates): Promise<any> {
    console.log("========");
    const url = this.buildWeatherQuery(coordinates);
  
    const response = await fetch(url);
    // console.log(response.status, "fetch weather func");
    const data: any = await response.json() ;
    

   
    const currentWeather: Weather = this.parseCurrentWeather(data.list[0]);
    console.log(currentWeather, "probably the same thing")
    const forecast: Weather[] = this.buildForecastArray(currentWeather, data.list)
    console.log(forecast, "this be the forecast");
    return forecast;
  }

  private parseCurrentWeather(response: any): Weather {
    console.log(response, "parse current weather")
    const parsedDate = dayjs.unix(response.dt).format('M/D/YYYY');
    return {
      city: this.city,
      date: parsedDate,
      description: response.weather[0].description || response.weather[0].main,
      icon: response.weather[0].icon,
      tempF: response.main.temp,
      humidity: response.main.humidity,
      pressure: response.main.pressure,
      windSpeed: response.wind.speed,
    };
  }

  private buildForecastArray(currentWeather: Weather, weatherData: any[]): Weather[] {
    const weatherForecast: Weather[] = [currentWeather]
    const filteredWeather = weatherData.filter((day) => day.dt_txt.includes("12:00:00"))
   console.log(weatherData,"444444444444444444")
   
    // return filteredWeather.map((data: any) => ({
    //   city: this.city,
    //   description: data.weather[0].description,
    //   temperature: data.main.temp,
    //   humidity: data.main.humidity,
    //   pressure: data.main.pressure,
    //   windSpeed: data.wind.speed,
    // }));

        for (const day of filteredWeather) {
          const weather: Weather = {
              city: this.city,
              date: dayjs.unix(day.dt).format('M/D/YYYY'),
              icon: day.weather[0].icon,
              description: day.weather[0].description || day.weather[0].main,
              tempF: day.main.temp,
              humidity: day.main.humidity,
              pressure: day.main.pressure,
              windSpeed: day.wind.speed,
          }
          weatherForecast.push(weather)
        }
        return weatherForecast
  }

  // async getWeather(city: string): Promise<Weather> {
  async getWeather(city: string) {
    console.log(city , 'sup daddy 2')
    this.city = city
    try {
      
      console.log('sup daddy 3')
      const coordinates = await this.fetchAndDestructureLocationData();
      console.log('sup daddy 4')
      // console.log(coordinates, "coordinates=================");
      const weatherData = await this.fetchWeatherData(coordinates);
      console.log(weatherData, "weather D =======================");
      // return this.parseCurrentWeather(weatherData);
      return weatherData;
    } catch (error: any) {
      throw new Error('Error fetching weather for the city: ' + error.message);
    }
  }
}

export default new WeatherService();
