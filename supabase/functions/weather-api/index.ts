import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WEATHER_API_KEY = "c2520c02b4a606631e800dd742bab498";

function owmToMeteoCode(id: number) {
  if (id >= 200 && id < 300) return 95; // Thunderstorm
  if (id >= 300 && id < 400) return 51; // Drizzle
  if (id >= 500 && id < 600) {
    if (id === 502 || id === 503 || id === 504) return 65; // Heavy rain
    return 61; // Slight/Moderate rain
  }
  if (id >= 600 && id < 700) {
    if (id === 602) return 75; // Heavy snow
    return 71; // Slight snow
  }
  if (id >= 700 && id < 800) return 45; // Fog
  if (id === 800) return 0; // Clear
  if (id === 801) return 1; // Mainly clear
  if (id === 802) return 2; // Partly cloudy
  if (id === 803 || id === 804) return 3; // Overcast
  return 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { region } = await req.json();
    if (!region) {
      return new Response(JSON.stringify({ error: "Region is required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Fetching OpenWeatherMap weather for region:", region);

    // Fetch Current Weather
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(region)}&appid=${WEATHER_API_KEY}&units=metric`
    );
    const currentData = await currentRes.json();

    if (currentData.cod !== 200) {
      console.error("OpenWeatherMap error:", currentData.message);
      return new Response(JSON.stringify({ error: `Could not fetch weather: ${currentData.message}` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch 5-Day Forecast
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(region)}&appid=${WEATHER_API_KEY}&units=metric`
    );
    const forecastData = await forecastRes.json();

    if (forecastData.cod !== "200") {
      console.error("OpenWeatherMap forecast error:", forecastData.message);
      return new Response(JSON.stringify({ error: `Could not fetch forecast: ${forecastData.message}` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, sys, coord } = currentData;
    const country = sys.country || "";
    const latitude = coord.lat;
    const longitude = coord.lon;

    const currentCondition = currentData.weather[0];

    // Aggregate 3-hour data into daily data
    const dailyForecasts = new Map<string, any>();

    forecastData.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0];
      const precipitation = item.rain && item.rain['3h'] ? item.rain['3h'] : 0;
      const windSpeedKmh = item.wind.speed * 3.6; // convert m/s to km/h

      if (!dailyForecasts.has(date)) {
        dailyForecasts.set(date, {
          date,
          temp_max: item.main.temp_max,
          temp_min: item.main.temp_min,
          precipitation: precipitation,
          wind_speed_max: windSpeedKmh,
          weather_code: owmToMeteoCode(item.weather[0].id),
          condition: item.weather[0].main
        });
      } else {
        const day = dailyForecasts.get(date);
        day.temp_max = Math.max(day.temp_max, item.main.temp_max);
        day.temp_min = Math.min(day.temp_min, item.main.temp_min);
        day.precipitation += precipitation;
        day.wind_speed_max = Math.max(day.wind_speed_max, windSpeedKmh);
      }
    });

    const forecast = Array.from(dailyForecasts.values()).slice(0, 5);

    const result = {
      location: { name, country, latitude, longitude },
      current: {
        temperature: currentData.main.temp,
        humidity: currentData.main.humidity,
        wind_speed: currentData.wind.speed * 3.6, // m/s to km/h
        feels_like: currentData.main.feels_like,
        weather_code: owmToMeteoCode(currentCondition.id),
        condition: currentCondition.main,
      },
      forecast: forecast,
    };

    console.log("Weather data fetched successfully from OpenWeatherMap");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Weather API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
