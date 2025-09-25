/**
 * BGAPP Wind Time Dimension System
 * Sistema de dimensão temporal para animações de vento
 * Controles de timeline, player e navegação temporal
 */

"use strict";

// ===== SISTEMA TIMEDIMENSION =====
class BGAPPTimeDimension {
    constructor(options = {}) {
        this.options = {
            // Configurações temporais
            startTime: options.startTime || new Date(Date.now() - 24 * 3600000), // 24h atrás
            endTime: options.endTime || new Date(),
            currentTime: options.currentTime || new Date(),
            step: options.step || 3600000, // 1 hora em ms
            
            // Configurações de player
            autoPlay: options.autoPlay || false,
            loop: options.loop || true,
            speed: options.speed || 1000, // ms entre frames
            
            // Configurações de dados
            preloadSteps: options.preloadSteps || 6,
            maxTimeSteps: options.maxTimeSteps || 48,
            
            // Callbacks
            onTimeChange: options.onTimeChange || null,
            onPlay: options.onPlay || null,
            onPause: options.onPause || null,
            onDataLoad: options.onDataLoad || null,
            onError: options.onError || null,
        };

        this.timeSteps = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.playInterval = null;
        this.dataCache = new Map();
        this.loadingPromises = new Map();
        
        this._generateTimeSteps();
        this._findCurrentIndex();
        
        console.log("BGAPP TimeDimension - Inicializado:", {
            steps: this.timeSteps.length,
            currentTime: this.options.currentTime,
            range: `${this.options.startTime.toISOString()} - ${this.options.endTime.toISOString()}`
        });
    }

    /**
     * Gerar passos de tempo
     */
    _generateTimeSteps() {
        this.timeSteps = [];
        let current = new Date(this.options.startTime);
        
        while (current <= this.options.endTime && this.timeSteps.length < this.options.maxTimeSteps) {
            this.timeSteps.push(new Date(current));
            current = new Date(current.getTime() + this.options.step);
        }
        
        console.log(`BGAPP TimeDimension - Gerados ${this.timeSteps.length} passos temporais`);
    }

    /**
     * Encontrar índice do tempo atual
     */
    _findCurrentIndex() {
        let closestIndex = 0;
        let closestDiff = Infinity;
        
        this.timeSteps.forEach((time, index) => {
            const diff = Math.abs(time.getTime() - this.options.currentTime.getTime());
            if (diff < closestDiff) {
                closestDiff = diff;
                closestIndex = index;
            }
        });
        
        this.currentIndex = closestIndex;
        this.options.currentTime = this.timeSteps[this.currentIndex];
    }

    /**
     * Definir tempo atual
     */
    setCurrentTime(time) {
        if (time instanceof Date) {
            this.options.currentTime = time;
            this._findCurrentIndex();
            this._notifyTimeChange();
        } else if (typeof time === 'number') {
            // Assumir que é um índice
            if (time >= 0 && time < this.timeSteps.length) {
                this.currentIndex = time;
                this.options.currentTime = this.timeSteps[this.currentIndex];
                this._notifyTimeChange();
            }
        }
    }

    /**
     * Obter tempo atual
     */
    getCurrentTime() {
        return this.options.currentTime;
    }

    /**
     * Obter todos os passos de tempo
     */
    getTimeSteps() {
        return [...this.timeSteps];
    }

    /**
     * Obter índice atual
     */
    getCurrentIndex() {
        return this.currentIndex;
    }

    /**
     * Ir para próximo passo
     */
    next() {
        if (this.currentIndex < this.timeSteps.length - 1) {
            this.currentIndex++;
        } else if (this.options.loop) {
            this.currentIndex = 0;
        } else {
            this.pause();
            return false;
        }
        
        this.options.currentTime = this.timeSteps[this.currentIndex];
        this._notifyTimeChange();
        return true;
    }

    /**
     * Ir para passo anterior
     */
    previous() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        } else if (this.options.loop) {
            this.currentIndex = this.timeSteps.length - 1;
        } else {
            return false;
        }
        
        this.options.currentTime = this.timeSteps[this.currentIndex];
        this._notifyTimeChange();
        return true;
    }

    /**
     * Iniciar reprodução
     */
    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.playInterval = setInterval(() => {
            if (!this.next() && !this.options.loop) {
                this.pause();
            }
        }, this.options.speed);
        
        if (this.options.onPlay) {
            this.options.onPlay(this.options.currentTime);
        }
        
        console.log("BGAPP TimeDimension - Reprodução iniciada");
    }

    /**
     * Pausar reprodução
     */
    pause() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
        
        if (this.options.onPause) {
            this.options.onPause(this.options.currentTime);
        }
        
        console.log("BGAPP TimeDimension - Reprodução pausada");
    }

    /**
     * Alternar reprodução
     */
    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Parar reprodução e voltar ao início
     */
    stop() {
        this.pause();
        this.currentIndex = 0;
        this.options.currentTime = this.timeSteps[0];
        this._notifyTimeChange();
        
        console.log("BGAPP TimeDimension - Reprodução parada");
    }

    /**
     * Definir velocidade de reprodução
     */
    setSpeed(speed) {
        this.options.speed = speed;
        
        if (this.isPlaying) {
            this.pause();
            this.play();
        }
        
        console.log(`BGAPP TimeDimension - Velocidade definida para ${speed}ms`);
    }

    /**
     * Ir para um tempo específico
     */
    goToTime(targetTime) {
        let closestIndex = 0;
        let closestDiff = Infinity;
        
        this.timeSteps.forEach((time, index) => {
            const diff = Math.abs(time.getTime() - targetTime.getTime());
            if (diff < closestDiff) {
                closestDiff = diff;
                closestIndex = index;
            }
        });
        
        this.setCurrentTime(closestIndex);
    }

    /**
     * Notificar mudança de tempo
     */
    _notifyTimeChange() {
        if (this.options.onTimeChange) {
            this.options.onTimeChange(this.options.currentTime, this.currentIndex);
        }
    }

    /**
     * Obter progresso como porcentagem
     */
    getProgress() {
        return (this.currentIndex / (this.timeSteps.length - 1)) * 100;
    }

    /**
     * Definir progresso por porcentagem
     */
    setProgress(percentage) {
        const index = Math.round((percentage / 100) * (this.timeSteps.length - 1));
        this.setCurrentTime(index);
    }

    /**
     * Atualizar configurações
     */
    updateOptions(newOptions) {
        const oldPlaying = this.isPlaying;
        if (oldPlaying) this.pause();
        
        Object.assign(this.options, newOptions);
        
        // Regenerar passos se necessário
        if (newOptions.startTime || newOptions.endTime || newOptions.step) {
            this._generateTimeSteps();
            this._findCurrentIndex();
        }
        
        if (oldPlaying) this.play();
        
        console.log("BGAPP TimeDimension - Opções atualizadas:", newOptions);
    }

    /**
     * Obter informações de status
     */
    getStatus() {
        return {
            isPlaying: this.isPlaying,
            currentTime: this.options.currentTime,
            currentIndex: this.currentIndex,
            totalSteps: this.timeSteps.length,
            progress: this.getProgress(),
            speed: this.options.speed,
            loop: this.options.loop,
            timeRange: {
                start: this.options.startTime,
                end: this.options.endTime,
                step: this.options.step
            }
        };
    }

    /**
     * Destruir instância
     */
    destroy() {
        this.pause();
        this.dataCache.clear();
        this.loadingPromises.clear();
        
        console.log("BGAPP TimeDimension - Instância destruída");
    }
}

// ===== CONTROLE DE PLAYER =====
L.Control.WindPlayer = L.Control.extend({
    options: {
        position: 'bottomright',
        timeDimension: null,
        showProgress: true,
        showTimeDisplay: true,
        showSpeedControl: true,
        compact: false,
    },

    initialize: function(options) {
        L.setOptions(this, options);
        this.timeDimension = this.options.timeDimension;
        this._isVisible = true;
    },

    onAdd: function(map) {
        this._container = L.DomUtil.create('div', 'bgapp-wind-player-control');
        this._container.style.background = 'rgba(0, 0, 0, 0.8)';
        this._container.style.borderRadius = '8px';
        this._container.style.padding = '10px';
        this._container.style.minWidth = this.options.compact ? '200px' : '300px';
        this._container.style.color = '#fff';
        this._container.style.fontFamily = 'Arial, sans-serif';
        this._container.style.fontSize = '12px';
        this._container.style.userSelect = 'none';

        L.DomEvent.disableClickPropagation(this._container);
        L.DomEvent.disableScrollPropagation(this._container);

        this._createPlayerInterface();
        this._bindEvents();
        this._updateInterface();

        return this._container;
    },

    onRemove: function(map) {
        this._unbindEvents();
    },

    _createPlayerInterface: function() {
        // Header
        const header = L.DomUtil.create('div', 'bgapp-player-header', this._container);
        header.style.marginBottom = '10px';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';

        const title = L.DomUtil.create('span', 'bgapp-player-title', header);
        title.innerHTML = '🌪️ Animação de Vento';
        title.style.fontWeight = 'bold';

        // Botão toggle visibilidade
        this._toggleBtn = L.DomUtil.create('button', 'bgapp-player-toggle', header);
        this._toggleBtn.innerHTML = '−';
        this._toggleBtn.style.background = 'transparent';
        this._toggleBtn.style.border = '1px solid #fff';
        this._toggleBtn.style.color = '#fff';
        this._toggleBtn.style.borderRadius = '3px';
        this._toggleBtn.style.width = '20px';
        this._toggleBtn.style.height = '20px';
        this._toggleBtn.style.cursor = 'pointer';

        // Container de controles
        this._controlsContainer = L.DomUtil.create('div', 'bgapp-player-controls', this._container);

        // Display de tempo
        if (this.options.showTimeDisplay) {
            this._timeDisplay = L.DomUtil.create('div', 'bgapp-player-time', this._controlsContainer);
            this._timeDisplay.style.textAlign = 'center';
            this._timeDisplay.style.marginBottom = '8px';
            this._timeDisplay.style.fontSize = '11px';
            this._timeDisplay.style.fontFamily = 'monospace';
        }

        // Barra de progresso
        if (this.options.showProgress) {
            const progressContainer = L.DomUtil.create('div', 'bgapp-progress-container', this._controlsContainer);
            progressContainer.style.marginBottom = '8px';
            progressContainer.style.position = 'relative';

            this._progressBar = L.DomUtil.create('input', 'bgapp-progress-bar', progressContainer);
            this._progressBar.type = 'range';
            this._progressBar.min = '0';
            this._progressBar.max = '100';
            this._progressBar.value = '0';
            this._progressBar.style.width = '100%';
            this._progressBar.style.cursor = 'pointer';

            // Labels de tempo
            const timeLabels = L.DomUtil.create('div', 'bgapp-time-labels', progressContainer);
            timeLabels.style.display = 'flex';
            timeLabels.style.justifyContent = 'space-between';
            timeLabels.style.fontSize = '9px';
            timeLabels.style.marginTop = '2px';

            this._startTimeLabel = L.DomUtil.create('span', 'bgapp-start-time', timeLabels);
            this._endTimeLabel = L.DomUtil.create('span', 'bgapp-end-time', timeLabels);
        }

        // Controles de reprodução
        const playControls = L.DomUtil.create('div', 'bgapp-play-controls', this._controlsContainer);
        playControls.style.display = 'flex';
        playControls.style.justifyContent = 'center';
        playControls.style.gap = '8px';
        playControls.style.marginBottom = '8px';

        // Botão anterior
        this._prevBtn = this._createButton('⏮', 'Passo anterior', playControls);
        
        // Botão play/pause
        this._playBtn = this._createButton('▶', 'Reproduzir/Pausar', playControls);
        this._playBtn.style.fontSize = '16px';
        
        // Botão próximo
        this._nextBtn = this._createButton('⏭', 'Próximo passo', playControls);
        
        // Botão stop
        this._stopBtn = this._createButton('⏹', 'Parar', playControls);

        // Controle de velocidade
        if (this.options.showSpeedControl) {
            const speedContainer = L.DomUtil.create('div', 'bgapp-speed-container', this._controlsContainer);
            speedContainer.style.display = 'flex';
            speedContainer.style.alignItems = 'center';
            speedContainer.style.gap = '5px';
            speedContainer.style.fontSize = '10px';

            const speedLabel = L.DomUtil.create('span', 'bgapp-speed-label', speedContainer);
            speedLabel.innerHTML = 'Velocidade:';

            this._speedSlider = L.DomUtil.create('input', 'bgapp-speed-slider', speedContainer);
            this._speedSlider.type = 'range';
            this._speedSlider.min = '100';
            this._speedSlider.max = '3000';
            this._speedSlider.value = '1000';
            this._speedSlider.step = '100';
            this._speedSlider.style.flex = '1';

            this._speedDisplay = L.DomUtil.create('span', 'bgapp-speed-display', speedContainer);
            this._speedDisplay.innerHTML = '1.0x';
            this._speedDisplay.style.minWidth = '30px';
        }
    },

    _createButton: function(text, title, parent) {
        const button = L.DomUtil.create('button', 'bgapp-player-btn', parent);
        button.innerHTML = text;
        button.title = title;
        button.style.background = 'rgba(255, 255, 255, 0.2)';
        button.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        button.style.color = '#fff';
        button.style.borderRadius = '4px';
        button.style.width = '30px';
        button.style.height = '30px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '12px';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';

        // Efeitos hover
        button.addEventListener('mouseenter', () => {
            button.style.background = 'rgba(255, 255, 255, 0.3)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'rgba(255, 255, 255, 0.2)';
        });

        return button;
    },

    _bindEvents: function() {
        if (!this.timeDimension) return;

        // Eventos do TimeDimension
        this.timeDimension.options.onTimeChange = (time, index) => {
            this._updateInterface();
        };

        this.timeDimension.options.onPlay = () => {
            this._playBtn.innerHTML = '⏸';
            this._playBtn.title = 'Pausar';
        };

        this.timeDimension.options.onPause = () => {
            this._playBtn.innerHTML = '▶';
            this._playBtn.title = 'Reproduzir';
        };

        // Eventos dos controles
        L.DomEvent.on(this._toggleBtn, 'click', this._toggleVisibility, this);
        L.DomEvent.on(this._playBtn, 'click', () => this.timeDimension.toggle(), this);
        L.DomEvent.on(this._prevBtn, 'click', () => this.timeDimension.previous(), this);
        L.DomEvent.on(this._nextBtn, 'click', () => this.timeDimension.next(), this);
        L.DomEvent.on(this._stopBtn, 'click', () => this.timeDimension.stop(), this);

        if (this._progressBar) {
            L.DomEvent.on(this._progressBar, 'input', (e) => {
                this.timeDimension.setProgress(parseFloat(e.target.value));
            }, this);
        }

        if (this._speedSlider) {
            L.DomEvent.on(this._speedSlider, 'input', (e) => {
                const speed = parseInt(e.target.value);
                this.timeDimension.setSpeed(speed);
                this._speedDisplay.innerHTML = (1000 / speed).toFixed(1) + 'x';
            }, this);
        }
    },

    _unbindEvents: function() {
        if (this._toggleBtn) L.DomEvent.off(this._toggleBtn, 'click', this._toggleVisibility, this);
        if (this._playBtn) L.DomEvent.off(this._playBtn, 'click');
        if (this._prevBtn) L.DomEvent.off(this._prevBtn, 'click');
        if (this._nextBtn) L.DomEvent.off(this._nextBtn, 'click');
        if (this._stopBtn) L.DomEvent.off(this._stopBtn, 'click');
        if (this._progressBar) L.DomEvent.off(this._progressBar, 'input');
        if (this._speedSlider) L.DomEvent.off(this._speedSlider, 'input');
    },

    _updateInterface: function() {
        if (!this.timeDimension) return;

        const status = this.timeDimension.getStatus();

        // Atualizar display de tempo
        if (this._timeDisplay) {
            const timeStr = status.currentTime.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            this._timeDisplay.innerHTML = `${timeStr} (${status.currentIndex + 1}/${status.totalSteps})`;
        }

        // Atualizar barra de progresso
        if (this._progressBar) {
            this._progressBar.value = status.progress.toString();
        }

        // Atualizar labels de tempo
        if (this._startTimeLabel && this._endTimeLabel) {
            this._startTimeLabel.innerHTML = status.timeRange.start.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            this._endTimeLabel.innerHTML = status.timeRange.end.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Atualizar botão play/pause
        if (this._playBtn) {
            if (status.isPlaying) {
                this._playBtn.innerHTML = '⏸';
                this._playBtn.title = 'Pausar';
            } else {
                this._playBtn.innerHTML = '▶';
                this._playBtn.title = 'Reproduzir';
            }
        }
    },

    _toggleVisibility: function() {
        this._isVisible = !this._isVisible;
        
        if (this._isVisible) {
            this._controlsContainer.style.display = 'block';
            this._toggleBtn.innerHTML = '−';
        } else {
            this._controlsContainer.style.display = 'none';
            this._toggleBtn.innerHTML = '+';
        }
    },

    setTimeDimension: function(timeDimension) {
        this._unbindEvents();
        this.timeDimension = timeDimension;
        this._bindEvents();
        this._updateInterface();
    },

    getTimeDimension: function() {
        return this.timeDimension;
    },

    setCompact: function(compact) {
        this.options.compact = compact;
        if (this._container) {
            this._container.style.minWidth = compact ? '200px' : '300px';
        }
    }
});

L.control.windPlayer = function(options) {
    return new L.Control.WindPlayer(options);
};

// Exportar classes
window.BGAPPTimeDimension = BGAPPTimeDimension;

console.log("BGAPP Wind Time Dimension System - Carregado com sucesso! ⏰");
