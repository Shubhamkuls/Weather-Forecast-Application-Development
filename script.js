const API_KEY = 'ae382a8968857cfcb78a645bb556fe70';

// Grabbing HTML elements we'll interact with

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentBtn = document.getElementById('currentBtn');
const recentCities = document.getElementById('recentCities');
const weatherInfo = document.getElementById('weatherInfo');
const forecastContainer = document.getElementById('forecastContainer');
const errorMsg = document.getElementById('error');

// Elements where we’ll display weather details

const cityNameElem = document.getElementById('cityName');
const temperatureElem = document.getElementById('temperature');
const humidityElem = document.getElementById('humidity');
const windElem = document.getElementById('wind');
const weatherIcon = document.getElementById('weatherIcon');

// Function to update weather section UI with data

const updateUI = (data) => {
  const { name, main, wind, weather } = data;
  // Fill data into respective elements
  cityNameElem.textContent = name;
  temperatureElem.textContent = main.temp;
  humidityElem.textContent = main.humidity;
  windElem.textContent = wind.speed;
  weatherIcon.src = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
  weatherIcon.alt = weather[0].main;
  // Make weather info box visible
  weatherInfo.classList.remove('hidden');
};
// Function to show error messages
const displayError = (msg) => {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
  weatherInfo.classList.add('hidden');
  forecastContainer.classList.add('hidden');
};
// Fetch current weather for a given city
const fetchWeather = async (city) => {
  errorMsg.classList.add('hidden');
  try {
    // API call to get current weather
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );
    if (!res.ok) throw new Error('City not found');
    const data = await res.json();
    updateUI(data); // Update the current weather UI
    fetchForecast(city); // Also get forecast data
    saveRecentCity(city); // Save city in local storage
  } catch (err) {
    displayError(err.message); // Handle errors like "city not found"
  }
};
// Fetch 5-day forecast for a city
const fetchForecast = async (city) => {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
    );
    const data = await res.json();
    // Get only one forecast per day at 12:00:00 PM
    const filtered = data.list.filter(item => item.dt_txt.includes("12:00:00"));

    // Clear previous forecast content
    forecastContainer.innerHTML = '';

    // For each day, create a forecast card
    filtered.forEach(day => {
      const card = document.createElement('div');
      card.className = "bg-white p-4 rounded shadow text-center";

      // Set card content
      card.innerHTML = `
        <h3 class="font-semibold">${new Date(day.dt_txt).toDateString()}</h3>
        <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="icon" class="mx-auto"/>
        <p>Temp: ${day.main.temp}°C</p>
        <p>Wind: ${day.wind.speed} m/s</p>
        <p>Humidity: ${day.main.humidity}%</p>
      `;
      forecastContainer.appendChild(card); // Add to page
    });
    forecastContainer.classList.remove('hidden'); // Show forecast
  } catch (err) {
    displayError('Could not fetch forecast');
  }
};
// Get weather based on user’s current location using geolocation API
const getCurrentLocationWeather = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        // API call using coordinates
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        );
        const data = await res.json();
        updateUI(data);
        fetchForecast(data.name);
        saveRecentCity(data.name);
      } catch {
        displayError('Unable to fetch weather for current location');
      }
    }, () => displayError('Location access denied'));
  } else {
    displayError('Geolocation not supported');
  }
};
// Save city name in localStorage for dropdown
const saveRecentCity = (city) => {
  let cities = JSON.parse(localStorage.getItem('recentCities')) || [];
  // Avoid duplicates
  if (!cities.includes(city)) {
    cities.push(city);
    localStorage.setItem('recentCities', JSON.stringify(cities));
    updateRecentDropdown();
  }
};
// Show recent searched cities in dropdown
const updateRecentDropdown = () => {
  let cities = JSON.parse(localStorage.getItem('recentCities')) || [];
  // Clear dropdown
  recentCities.innerHTML = `<option disabled selected>Recent Searches</option>`;
  cities.forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    option.textContent = city;
    recentCities.appendChild(option);
  });
  if (cities.length > 0) recentCities.classList.remove('hidden'); // Show dropdown if cities available
};
// --- Event Listeners ---

// Search button clicked
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (!city) return displayError('Please enter a city name');
  fetchWeather(city);
});
// Current location button clicked
currentBtn.addEventListener('click', getCurrentLocationWeather);
// Dropdown option selected
recentCities.addEventListener('change', () => {
  const city = recentCities.value;
  fetchWeather(city);
});
// When page loads, update dropdown with stored cities
window.addEventListener('DOMContentLoaded', updateRecentDropdown);
