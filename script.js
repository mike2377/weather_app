import { API_KEY } from './config.js';

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

//  5day forecast
async function fetchForecast (city, units) {
  const encodedCity = encodeURIComponent(city)
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodedCity}&appid=${API_KEY}&units=${units}`
  try {
    const response = await fetch(url)
    if (!response.ok) return
    const data = await response.json()
    displayForecast(data.list)
  } catch (error) {
    console.error('Forecast error:', error)
  }
}

// update for current weather
function displayCurrentWeather (data) {
  document.getElementById('city-name').textContent = `${data.name}, ${data.sys.country}`
  document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`
  document.getElementById('weather-desc').textContent = data.weather[0].description
  document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}${getTempUnit()}`
  document.getElementById('humidity').textContent = `${data.main.humidity}%`
  document.getElementById('wind').textContent = `${data.wind.speed} ${getWindUnit()}`
}

// update  forecast
function displayForecast (list) {
  const container = document.getElementById('forecast-container')
  container.innerHTML = ''

  // one forecast per day
  const dailyMap = new Map()
  list.forEach(item => {
    const date = new Date(item.dt * 1000).toLocaleDateString()
    if (!dailyMap.has(date)) {
      dailyMap.set(date, item)
    }
  })

  const dailyForecasts = Array.from(dailyMap.values()).slice(0, 5)

  dailyForecasts.forEach(day => {
    const date = new Date(day.dt * 1000)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    const temp = Math.round(day.main.temp)
    const icon = day.weather[0].icon

    const dayEl = document.createElement('div')
    dayEl.className = 'forecast-day'
    dayEl.innerHTML = `
            <p><strong>${dayName}</strong></p>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="forecast icon">
            <p>${temp}${getTempUnit()}</p>
        `
    container.appendChild(dayEl)
  })
}

// dynamic background
function updateBackground (weatherMain) {
  document.body.className = ''
  const main = weatherMain.toLowerCase()
  let bgClass = 'weather-default'

  if (main.includes('cloud')) bgClass = 'weather-clouds'
  else if (main.includes('rain') || main.includes('drizzle')) bgClass = 'weather-rain'
  else if (main.includes('snow')) bgClass = 'weather-snow'
  else if (main.includes('thunder')) bgClass = 'weather-thunderstorm'
  else if (main.includes('mist') || main.includes('fog') || main.includes('haze')) bgClass = 'weather-mist'
  else if (main.includes('clear')) bgClass = 'weather-clear'

  document.body.classList.add(bgClass)
}

// error handle
function showError (msg) {
  errorMessage.textContent = msg
  errorMessage.classList.remove('hidden')
}

function hideError () {
  errorMessage.classList.add('hidden')
}

// event listener
searchBtn.addEventListener('click', () => {
  fetchWeather(cityInput.value.trim())
})

cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    fetchWeather(cityInput.value.trim())
  }
})

// units are changed
unitRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    const lastCity = getLastCity() || cityInput.value.trim()
    if (lastCity) fetchWeather(lastCity)
  })
})

window.addEventListener('DOMContentLoaded', () => {
  const lastCity = getLastCity()
  if (lastCity) {
    cityInput.value = lastCity
    fetchWeather(lastCity)
  }
})
