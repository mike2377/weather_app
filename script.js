// API key
const API_KEY = process.env.API_KEY;

const cityInput = document.getElementById('city-input')
const searchBtn = document.getElementById('search-btn')
const errorMessage = document.getElementById('error-message')
const weatherDisplay = document.getElementById('weather-display')
const unitRadios = document.getElementsByName('units')

// Storage functions
function saveLastCity (city) {
  localStorage.setItem('lastCity', city)
}

function getLastCity () {
  return localStorage.getItem('lastCity') || ''
}

// units
function getUnits () {
  for (const radio of unitRadios) {
    if (radio.checked) return radio.value
  }
  return 'metric'
}

function getTempUnit () {
  return getUnits() === 'metric' ? '°C' : '°F'
}

function getWindUnit () {
  return getUnits() === 'metric' ? 'm/s' : 'mph'
}

// current weather
async function fetchWeather (city) {
  if (!city) return

  const units = getUnits()
  const encodedCity = encodeURIComponent(city)
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${API_KEY}&units=${units}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      if (response.status === 404) throw new Error('City not found. Please try again.')
      if (response.status === 401) throw new Error('Invalid API Key. Please check your code.')
      throw new Error('Failed to fetch weather data.')
    }
    const data = await response.json()
    displayCurrentWeather(data)
    fetchForecast(city, units)
    updateBackground(data.weather[0].main)
    saveLastCity(city)
    hideError()
    weatherDisplay.classList.remove('hidden')
  } catch (error) {
    showError(error.message)
    weatherDisplay.classList.add('hidden')
  }
}
