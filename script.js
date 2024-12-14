class WallpaperManager {
  constructor() {
    this.currentIndex = 0;
    this.images = [];
    this.amapKey = 'd4a0d8498034a6b7f871763adacbcdb0';
    this.carouselPosition = 0;
    this.itemWidth = 170;
    this.init();
  }

  async init() {
    await this.loadImages();
    this.setupEventListeners();
    this.getWeather();
    this.setupCarousel();
  }

  async loadImages() {
    try {
      const response = await fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8');
      const data = await response.json();
      this.images = data.images;
      this.displayCurrentImage();
    } catch (error) {
      console.error('加载图片失败:', error);
    }
  }

  setupEventListeners() {
    document.getElementById('prevImage').addEventListener('click', () => this.changeImage(-1));
    document.getElementById('nextImage').addEventListener('click', () => this.changeImage(1));
    document.querySelectorAll('.download-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const quality = e.target.dataset.quality;
        this.downloadCurrentImage(quality);
      });
    });
  }

  async displayCurrentImage() {
    const image = this.images[this.currentIndex];
    let backgroundUrl = `https://www.bing.com${image.url}`;
    const background = document.getElementById('background');
    background.style.backgroundImage = '';
    setTimeout(() => {
      background.style.backgroundImage = `url(${backgroundUrl})`;
    }, 10);
    document.getElementById('title').textContent = image.title;
    document.getElementById('copyright').textContent = image.copyright;
  }

  changeImage(direction) {
    this.currentIndex = (this.currentIndex + direction + this.images.length) % this.images.length;
    this.displayCurrentImage();
    this.updateActiveCarouselItem();
  }

  async downloadCurrentImage(quality) {
    const image = this.images[this.currentIndex];
    let imageUrl = `https://www.bing.com${image.url}`;
    if (quality) {
      imageUrl = imageUrl.replace(/\d+x\d+/, quality);
    }
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `bing-wallpaper-${quality}-${new Date().toISOString().split('T')[0]}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      this.showDownloadToast(`已保存 ${quality} 壁纸`);
    } catch (error) {
      console.error('下载图片失败:', error);
      this.showDownloadToast('下载失败，请重试');
    }
  }

  showDownloadToast(message) {
    const toast = document.createElement('div');
    toast.className = 'download-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  async getWeather() {
    try {
      const ipLocationUrl = `https://restapi.amap.com/v3/ip?key=${this.amapKey}`;
      console.log('发送IP定位请求:', ipLocationUrl);
      const ipLocationResponse = await fetch(ipLocationUrl);
      const ipLocationData = await ipLocationResponse.json();
      console.log('IP定位响应:', ipLocationData);
      
      if (ipLocationData.status === '1') {
        const weatherUrl = `https://restapi.amap.com/v3/weather/weatherInfo?key=${this.amapKey}&city=${ipLocationData.adcode}&extensions=base`;
        console.log('发送天气请求:', weatherUrl);
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        console.log('天气响应:', weatherData);
        
        if (weatherData.status === '1' && weatherData.lives && weatherData.lives.length > 0) {
          const weather = weatherData.lives[0];
          console.log('天气数据:', { temp: weather.temperature, weather: weather.weather, city: weather.city });
          this.updateWeatherDisplay(weather);
        } else {
          console.error('天气数据无效:', weatherData);
          this.displayDefaultWeather();
        }
      } else {
        console.error('IP定位失败:', ipLocationData);
        this.displayDefaultWeather();
      }
    } catch (error) {
      console.error('获取天气信息失败:', error);
      this.displayDefaultWeather();
    }
  }

  displayDefaultWeather() {
    const defaultWeather = {
      temperature: 'N/A',
      weather: '未知',
      city: '未知城市'
    };
    this.updateWeatherDisplay(defaultWeather);
  }

  updateWeatherDisplay(weather) {
    const tempElement = document.getElementById('temperature');
    const descElement = document.getElementById('description');
    const iconElement = document.getElementById('weather-icon');
    
    console.log('更新天气显示:', {
      temperature: weather.temperature,
      weather: weather.weather,
      city: weather.city
    });
    
    if (tempElement && descElement && iconElement) {
      const temp = weather.temperature || 'N/A';
      const weatherDesc = weather.weather || '未知';
      const city = weather.city || '未城市';
      
      tempElement.textContent = temp === 'N/A' ? temp : `${temp}°C`;
      descElement.textContent = `${city} ${weatherDesc}`;
      iconElement.innerHTML = this.getWeatherIcon(weather.weather);
    } else {
      console.error('天气显示元素不存在:', {
        tempElement: !!tempElement,
        descElement: !!descElement,
        iconElement: !!iconElement
      });
    }
  }

  getWeatherIcon(weather) {
    if (!weather) {
      return '🌤️';
    }
    
    const weatherIcons = {
      '晴': '☀️',
      '多云': '⛅',
      '阴': '☁️',
      '小雨': '🌧️',
      '中雨': '🌧️',
      '大雨': '🌧️',
      '暴雨': '⛈️',
      '雷阵雨': '⛈️',
      '雪': '🌨️',
      '雾': '🌫️',
      '霾': '😷'
    };

    for (const [key, icon] of Object.entries(weatherIcons)) {
      if (weather.includes(key)) {
        return `<span title="${weather}">${icon}</span>`;
      }
    }
    return `<span title="未知天气">🌤️</span>`;
  }

  setupCarousel() {
    const track = document.querySelector('.carousel-track');
    
    this.images.forEach((image, index) => {
      const item = document.createElement('div');
      item.className = 'carousel-item';
      if (index === this.currentIndex) {
        item.classList.add('active');
      }
      
      const img = document.createElement('img');
      const thumbnailUrl = `https://www.bing.com${image.url}`;
      img.src = thumbnailUrl;
      img.alt = image.title;
      
      item.appendChild(img);
      item.addEventListener('click', () => {
        this.currentIndex = index;
        this.displayCurrentImage();
        this.updateActiveCarouselItem();
      });
      
      track.appendChild(item);
    });

    document.getElementById('prevCarousel').addEventListener('click', () => {
      this.moveCarousel(-1);
    });
    
    document.getElementById('nextCarousel').addEventListener('click', () => {
      this.moveCarousel(1);
    });
  }

  moveCarousel(direction) {
    const track = document.querySelector('.carousel-track');
    const container = document.querySelector('.carousel-container');
    const maxPosition = track.children.length * this.itemWidth - container.offsetWidth;
    
    this.carouselPosition = Math.max(
      Math.min(
        this.carouselPosition - direction * this.itemWidth * 3,
        0
      ),
      -maxPosition
    );
    
    track.style.transform = `translateX(${this.carouselPosition}px)`;
  }

  updateActiveCarouselItem() {
    const items = document.querySelectorAll('.carousel-item');
    items.forEach((item, index) => {
      item.classList.toggle('active', index === this.currentIndex);
    });
  }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  new WallpaperManager();
}); 