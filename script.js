class PowerMonitor {
    constructor() {
        this.port = null;
        this.reader = null;
        this.isConnected = false;
        this.charts = {};
        this.dataBuffers = {
            voltage: {},
            current: {},
            power: {}
        };
        this.maxDataPoints = 100;
        this.channelColors = [
            '#FF6384', // Red
            '#36A2EB', // Blue
            '#FFCE56', // Yellow
            '#4BC0C0'  // Green
        ];
        
        this.init();
    }

    init() {
        this.setupTheme();
        this.setupEventListeners();
        this.initializeCharts();
        this.log('Power Monitor initialized', 'success');
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeButton(savedTheme);
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Connection controls
        document.getElementById('connectBtn').addEventListener('click', () => {
            this.connect();
        });

        document.getElementById('disconnectBtn').addEventListener('click', () => {
            this.disconnect();
        });

        // Console toggle
        document.getElementById('consoleToggle').addEventListener('click', () => {
            this.toggleConsole();
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeButton(newTheme);
        this.updateChartsTheme();
    }

    updateThemeButton(theme) {
        const lightIcon = document.querySelector('.light-icon');
        const darkIcon = document.querySelector('.dark-icon');
        
        if (theme === 'dark') {
            lightIcon.style.display = 'none';
            darkIcon.style.display = 'inline';
        } else {
            lightIcon.style.display = 'inline';
            darkIcon.style.display = 'none';
        }
    }

    updateChartsTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#ffffff' : '#212529';
        const gridColor = isDark ? '#404040' : '#e9ecef';

        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.options.scales.x.ticks.color = textColor;
                chart.options.scales.y.ticks.color = textColor;
                chart.options.scales.x.grid.color = gridColor;
                chart.options.scales.y.grid.color = gridColor;
                chart.update();
            }
        });
    }

    async connect() {
        try {
            if (!('serial' in navigator)) {
                throw new Error('Web Serial API not supported. Please use Chrome or Edge.');
            }

            this.log('Requesting serial port access...', 'info');
            
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 115200 });
            
            this.isConnected = true;
            this.updateConnectionStatus();
            this.log('Serial port connected successfully', 'success');
            
            this.startReading();
            
        } catch (error) {
            this.log(`Connection failed: ${error.message}`, 'error');
        }
    }

    async disconnect() {
        try {
            if (this.reader) {
                await this.reader.cancel();
                this.reader = null;
            }
            
            if (this.port) {
                await this.port.close();
                this.port = null;
            }
            
            this.isConnected = false;
            this.updateConnectionStatus();
            this.log('Serial port disconnected', 'warning');
            
        } catch (error) {
            this.log(`Disconnect error: ${error.message}`, 'error');
        }
    }

    updateConnectionStatus() {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const deviceInfo = document.getElementById('deviceInfo');

        if (this.isConnected) {
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected';
            connectBtn.disabled = true;
            disconnectBtn.disabled = false;
            deviceInfo.innerHTML = `
                <p><strong>Port:</strong> ${this.port.getInfo().usbProductId || 'Unknown'}</p>
                <p><strong>Status:</strong> Active</p>
            `;
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = 'Disconnected';
            connectBtn.disabled = false;
            disconnectBtn.disabled = true;
            deviceInfo.innerHTML = '<p>No device connected</p>';
        }
    }

    async startReading() {
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();

        this.reader = reader;

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }
                
                this.processData(value);
            }
        } catch (error) {
            this.log(`Reading error: ${error.message}`, 'error');
        } finally {
            reader.releaseLock();
        }
    }

    processData(data) {
        try {
            // Split data by newlines and process each line
            const lines = data.split('\n');
            
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine) {
                    const jsonData = JSON.parse(trimmedLine);
                    this.updateCharts(jsonData);
                    this.log(`Received: ${trimmedLine}`, 'info');
                }
            }
        } catch (error) {
            this.log(`Data processing error: ${error.message}`, 'error');
        }
    }

    initializeCharts() {
        const chartConfigs = [
            { id: 'voltageChart', label: 'Voltage (mV)', dataKey: 'voltage' },
            { id: 'currentChart', label: 'Current (mA)', dataKey: 'current' },
            { id: 'powerChart', label: 'Power (mW)', dataKey: 'power' }
        ];

        chartConfigs.forEach(config => {
            this.charts[config.dataKey] = this.createChart(config.id, config.label);
        });
    }

    createChart(canvasId, label) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#ffffff' : '#212529';
        const gridColor = isDark ? '#404040' : '#e9ecef';

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: textColor,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: isDark ? '#2d2d2d' : '#ffffff',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: gridColor,
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            displayFormats: {
                                second: 'HH:mm:ss'
                            }
                        },
                        ticks: {
                            color: textColor,
                            maxTicksLimit: 10
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    y: {
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    updateCharts(data) {
        if (!data.cS || !Array.isArray(data.cS)) {
            return;
        }

        const timestamp = new Date();
        
        data.cS.forEach(channel => {
            const channelNum = channel.ch;
            const channelLabel = `Channel ${channelNum}`;
            
            // Update voltage chart
            this.updateChartDataset('voltage', channelNum, channelLabel, channel.v_mV, timestamp);
            
            // Update current chart
            this.updateChartDataset('current', channelNum, channelLabel, channel.c_mA, timestamp);
            
            // Update power chart
            this.updateChartDataset('power', channelNum, channelLabel, channel.p_mW, timestamp);
        });
    }

    updateChartDataset(chartType, channelNum, channelLabel, value, timestamp) {
        const chart = this.charts[chartType];
        if (!chart) return;

        // Find or create dataset for this channel
        let dataset = chart.data.datasets.find(ds => ds.label === channelLabel);
        
        if (!dataset) {
            dataset = {
                label: channelLabel,
                data: [],
                borderColor: this.channelColors[channelNum % this.channelColors.length],
                backgroundColor: this.channelColors[channelNum % this.channelColors.length] + '20',
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 4
            };
            chart.data.datasets.push(dataset);
        }

        // Add new data point
        dataset.data.push({
            x: timestamp,
            y: value
        });

        // Limit data points to prevent memory issues
        if (dataset.data.length > this.maxDataPoints) {
            dataset.data.shift();
        }

        // Update chart
        chart.update('none');
    }

    log(message, type = 'info') {
        const consoleMessages = document.getElementById('consoleMessages');
        const messageElement = document.createElement('div');
        messageElement.className = `console-message ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        messageElement.textContent = `[${timestamp}] ${message}`;
        
        consoleMessages.appendChild(messageElement);
        consoleMessages.scrollTop = consoleMessages.scrollHeight;
        
        // Keep only last 50 messages
        while (consoleMessages.children.length > 50) {
            consoleMessages.removeChild(consoleMessages.firstChild);
        }
    }

    toggleConsole() {
        const consoleContent = document.getElementById('consoleContent');
        consoleContent.classList.toggle('show');
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PowerMonitor();
});