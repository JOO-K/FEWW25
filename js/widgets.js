document.addEventListener('DOMContentLoaded', function() {
  function initWidgets() {
    const timeElement = document.getElementById('time');
    const coordinatesElement = document.getElementById('mouse-coordinates');
    const temperatureElement = document.getElementById('temperature');

    if (!timeElement || !coordinatesElement || !temperatureElement) {
      console.log('Widget elements not found');
      return;
    }

    function updateTime() {
      const options = {
        timeZone: 'America/Los_Angeles',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
      };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      timeElement.textContent = formatter.format(new Date());
    }
    updateTime();
    setInterval(updateTime, 1000);

    let lastUpdate = 0;
    window.addEventListener('mousemove', (event) => {
      const now = Date.now();
      if (now - lastUpdate > 100) {
        coordinatesElement.textContent = `X: ${event.clientX}, Y: ${event.clientY}`;
        lastUpdate = now;
      }
    });

    const apiKey = 'fd582057b6c16f5f503ac7985fbf94c7';
    const city = 'Los Angeles';
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    function updateTemperature() {
      fetch(apiUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Weather API request failed: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          const tempCelsius = Math.round(data.main.temp);
          const tempFahrenheit = Math.round((tempCelsius * 9/5) + 32);
          temperatureElement.textContent = `${tempCelsius}°C / ${tempFahrenheit}°F`;
        })
        .catch(error => {
          console.error('Error fetching temperature:', error);
          temperatureElement.textContent = 'N/A';
        });
    }
    updateTemperature();
    setInterval(updateTemperature, 600000);

    console.log('Widgets initialized successfully');
  }

  function checkAndInit() {
    if (window.jQuery && document.querySelector('.widgets-container')) {
      initWidgets();
    } else {
      setTimeout(checkAndInit, 100);
    }
  }
  checkAndInit();
});