const appendWeatherStatus = (function() {
  return function(text) {
    document.getElementById('weatherStatusText').textContent = text;
  };
}());

const handleWeatherStatus = (function() {
  let state = 'getAddrDetails';
  return function(searchAddress) {
    if (searchAddress.length === 0) {
      appendWeatherStatus('Address field is empty. Please enter an address.');
      return false;
    }
    switch (state) {
      case 'getAddrDetails': {
        $.ajax({
          url: `https://developers.onemap.sg/commonapi/search?searchVal=${
              searchAddress}&returnGeom=Y&getAddrDetails=N`,
          success: function(response) {
            if (response.results.length === 0) {
              appendWeatherStatus('Invalid Longitude, Latitude result.');
              return false;
            }
            setTimeout(handleWeatherStatus, 0, {
              longitude: response.results[0].LONGITUDE,
              latitude: response.results[0].LATITUDE
            });
            state = 'getToken';
          }
        });
        break;
      }
      case 'getToken': {
        const settings = {
          'url': 'https://developers.onemap.sg/privateapi/auth/post/getToken',
          'data': {
            'email': 'peng.jimmy67@gmail.com',
            'password': 'UdFrDr3F97k6H9dz'
          },
          'async': 'true'
        };
        $.post(settings).done(function(response) {
          setTimeout(handleWeatherStatus, 0, {
            longitude: searchAddress.longitude,
            latitude: searchAddress.latitude,
            token: response.access_token,
          });
          state = 'getPlanningareaNames';
        });
        break;
      }
      case 'getPlanningareaNames': {
        $.ajax({
          url:
              `https://developers.onemap.sg/privateapi/popapi/getPlanningarea/?token=${
                  searchAddress.token}&lat=${searchAddress.latitude}&lng=${
                  searchAddress.longitude}`,
          success: function(response) {
            if (response.length === 0) {
              appendWeatherStatus('Invalid Town result.');
              return false;
            }
            setTimeout(handleWeatherStatus, 0, {town: response[0].pln_area_n});
            state = 'getWeatherForecast';
          }
        });
        break;
      }
      case 'getWeatherForecast': {
        $.ajax({
          url: 'https://api.data.gov.sg/v1/environment/2-hour-weather-forecast',
          success: function(response) {
            const matchingArea =
                response.items[0].forecasts.filter(function(matchedArea) {
                  return matchedArea.area.toUpperCase() === searchAddress.town;
                });
            state = 'getAddrDetails';
            if (matchingArea.length === 0) {
              appendWeatherStatus(
                  'Invalid weather forecasts result for the input address.');
              return false;
            }
            appendWeatherStatus(
                `Location: ${matchingArea[0].area}. Weather Forecast: ${
                    matchingArea[0].forecast}.`);
          }
        });
        break;
      }
    }
  }
}());

(function initSubmitButton() {
  document.getElementById('submitButton')
      .addEventListener('click', function handleSubmitButtonClick(event) {
        event.preventDefault();
        handleWeatherStatus(document.getElementById('addressText').value);
      }, false);
}());