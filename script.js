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
        this.testMode = false;
        this.testInterval = null;
        this.serialBuffer = ''; // Buffer for incomplete JSON data
        
        this.init();
    }

    init() {
        this.setupTheme();
        this.setupEventListeners();
        this.initializeCharts();
        this.log('Power Monitor initialized', 'success');
        
        // Add test mode button
        this.addTestModeButton();
    }

    addTestModeButton() {
        const connectBtn = document.getElementById('connectBtn');
        const testBtn = document.createElement('button');
        testBtn.id = 'testBtn';
        testBtn.className = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2 ml-2';
        testBtn.textContent = 'Test Mode';
        testBtn.addEventListener('click', () => this.startTestMode());
        connectBtn.parentNode.appendChild(testBtn);
    }

    startTestMode() {
        if (this.testMode) {
            this.stopTestMode();
            return;
        }

        this.testMode = true;
        this.isConnected = true;
        this.updateConnectionStatus();
        this.log('Test mode started - generating simulated data', 'success');
        
        // Update test button
        const testBtn = document.getElementById('testBtn');
        testBtn.textContent = 'Stop Test';
        testBtn.className = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2 ml-2';
        
        // Generate test data every second
        this.testInterval = setInterval(() => {
            this.generateTestData();
        }, 1000);
    }

    stopTestMode() {
        this.testMode = false;
        this.isConnected = false;
        this.updateConnectionStatus();
        this.log('Test mode stopped', 'warning');
        
        if (this.testInterval) {
            clearInterval(this.testInterval);
            this.testInterval = null;
        }
        
        // Update test button
        const testBtn = document.getElementById('testBtn');
        testBtn.textContent = 'Test Mode';
        testBtn.className = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2 ml-2';
    }

    generateTestData() {
        const timestamp = Math.floor(Date.now() / 1000);
        const data = {
            cS: []
        };
        
        // Generate data for 4 channels
        for (let i = 0; i < 4; i++) {
            const baseVoltage = 5000 + (i * 500); // 5V base + offset
            const baseCurrent = 100 + (i * 50);   // 100mA base + offset
            
            // Add some variation
            const voltageVariation = Math.sin(Date.now() / 1000 + i) * 200;
            const currentVariation = Math.sin(Date.now() / 1000 + i + 1) * 20;
            
            const voltage = Math.round(baseVoltage + voltageVariation);
            const current = Math.round(baseCurrent + currentVariation);
            const power = Math.round((voltage * current) / 1000); // Convert to mW
            
            data.cS.push({
                ch: i,
                v_mV: voltage,
                c_mA: current,
                p_mW: power,
                ts: timestamp
            });
        }
        
        this.updateCharts(data);
        this.log(`Test data: ${JSON.stringify(data)}`, 'info');
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
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
        const isDark = document.documentElement.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';
        
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        localStorage.setItem('theme', newTheme);
        this.updateThemeButton(newTheme);
        this.updateChartsTheme();
    }

    updateThemeButton(theme) {
        const lightIcon = document.querySelector('.light-icon');
        const darkIcon = document.querySelector('.dark-icon');
        
        if (theme === 'dark') {
            lightIcon.classList.add('hidden');
            darkIcon.classList.remove('hidden');
        } else {
            lightIcon.classList.remove('hidden');
            darkIcon.classList.add('hidden');
        }
    }

    updateChartsTheme() {
        const isDark = document.documentElement.classList.contains('dark');
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
            this.serialBuffer = ''; // Clear the buffer
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
            statusText.textContent = this.testMode ? 'Test Mode' : 'Connected';
            connectBtn.disabled = true;
            disconnectBtn.disabled = false;
            
            if (this.testMode) {
                deviceInfo.innerHTML = `
                    <p><strong>Mode:</strong> Test Mode</p>
                    <p><strong>Status:</strong> Generating simulated data</p>
                `;
            } else {
                deviceInfo.innerHTML = `
                    <p><strong>Port:</strong> ${this.port ? this.port.getInfo().usbProductId || 'Unknown' : 'Unknown'}</p>
                    <p><strong>Status:</strong> Active</p>
                `;
            }
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
            // Add new data to buffer
            this.serialBuffer += data;
            
            // Split buffer by newlines and process each complete line
            const lines = this.serialBuffer.split('\n');
            
            // Keep the last (potentially incomplete) line in the buffer
            this.serialBuffer = lines.pop() || '';
            
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine) {
                    try {
                        const jsonData = JSON.parse(trimmedLine);
                        this.updateCharts(jsonData);
                        this.log(`Received: ${trimmedLine}`, 'info');
                    } catch (parseError) {
                        this.log(`JSON parse error: ${parseError.message}`, 'error');
                    }
                }
            }
        } catch (error) {
            this.log(`Data processing error: ${error.message}`, 'error');
        }
    }

    initializeCharts() {
        this.log('Initializing charts...', 'info');
        
        const chartConfigs = [
            { id: 'voltageChart', label: 'Voltage (mV)', dataKey: 'voltage' },
            { id: 'currentChart', label: 'Current (mA)', dataKey: 'current' },
            { id: 'powerChart', label: 'Power (mW)', dataKey: 'power' }
        ];

        chartConfigs.forEach(config => {
            const canvas = document.getElementById(config.id);
            if (!canvas) {
                this.log(`Canvas element not found: ${config.id}`, 'error');
                return;
            }
            
            this.log(`Creating chart for ${config.id}`, 'info');
            this.charts[config.dataKey] = this.createChart(config.id, config.label);
        });
        
        this.log(`Charts initialized: ${Object.keys(this.charts).length} charts created`, 'info');
    }

    createChart(canvasId, label) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const isDark = document.documentElement.classList.contains('dark');
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
            this.log('Invalid data format received', 'error');
            return;
        }

        this.log(`Updating charts with ${data.cS.length} channels`, 'info');

        // Use the timestamp from the device data if available, otherwise use current time
        const timestamp = data.cS[0] && data.cS[0].ts ? 
            new Date(data.cS[0].ts * 1000) : new Date();
        
        data.cS.forEach(channel => {
            const channelNum = channel.ch;
            const channelLabel = `Channel ${channelNum}`;
            
            this.log(`Processing channel ${channelNum}: v=${channel.v_mV}mV, c=${channel.c_mA}mA, p=${channel.p_mW}mW`, 'info');
            
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
        if (!chart) {
            this.log(`Chart not found for type: ${chartType}`, 'error');
            return;
        }

        // Find or create dataset for this channel
        let dataset = chart.data.datasets.find(ds => ds.label === channelLabel);
        
        if (!dataset) {
            this.log(`Creating new dataset for ${channelLabel} in ${chartType} chart`, 'info');
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

        this.log(`Added data point to ${chartType} chart: ${channelLabel} = ${value}`, 'info');

        // Limit data points to prevent memory issues
        if (dataset.data.length > this.maxDataPoints) {
            dataset.data.shift();
        }

        // Update chart
        try {
            chart.update('none');
            this.log(`Chart ${chartType} updated successfully`, 'info');
        } catch (error) {
            this.log(`Error updating chart ${chartType}: ${error.message}`, 'error');
        }
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
        consoleContent.classList.toggle('hidden');
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PowerMonitor();
});