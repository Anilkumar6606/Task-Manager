// Task Manager Application
class TaskManager {
    constructor() {
        this.tasks = [];
        this.penalties = 0;
        this.completionDates = [];
        this.currentStreak = 0;
        
        this.init();
        this.loadData();
        this.setupEventListeners();
        this.startTimers();
        this.updateDateTime();
    }

    init() {
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    loadData() {
        // Load tasks from localStorage
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks).map(task => ({
                frequency: 'today',
                category: 'other',
                ...task,
                createdAt: new Date(task.createdAt)
            }));
        }

        // Load penalties
        const savedPenalties = localStorage.getItem('penalties');
        if (savedPenalties) {
            this.penalties = parseInt(savedPenalties);
        }

        // Load completion dates
        const savedDates = localStorage.getItem('completionDates');
        if (savedDates) {
            this.completionDates = JSON.parse(savedDates);
        }

        this.calculateStreak();
        this.updateUI();
    }

    saveData() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        localStorage.setItem('penalties', this.penalties.toString());
        localStorage.setItem('completionDates', JSON.stringify(this.completionDates));
    }

    setupEventListeners() {
        // Add task button
        document.getElementById('add-task-btn').addEventListener('click', () => {
            this.showModal();
        });

        // Modal close
        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideModal();
        });

        // Deploy task
        document.getElementById('deploy-task').addEventListener('click', () => {
            this.addTask();
        });

        // Modal backdrop click
        document.getElementById('task-modal').addEventListener('click', (e) => {
            if (e.target.id === 'task-modal') {
                this.hideModal();
            }
        });

        // Sync calendar (placeholder)
        document.getElementById('sync-calendar').addEventListener('click', () => {
            alert('Calendar sync feature coming soon!');
        });
    }

    showModal() {
        document.getElementById('task-modal').classList.remove('hidden');
        // Reset form
        document.getElementById('task-name').value = '';
        document.getElementById('start-time').value = '';
        document.getElementById('end-time').value = '';
        document.getElementById('points').value = '10';
        document.getElementById('frequency').value = 'today';
        document.getElementById('category').value = 'other';
    }

    hideModal() {
        document.getElementById('task-modal').classList.add('hidden');
    }

    addTask() {
        const name = document.getElementById('task-name').value.trim();
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const points = parseInt(document.getElementById('points').value) || 10;
        const frequency = document.getElementById('frequency').value;
        const category = document.getElementById('category').value;

        if (!name || !startTime || !endTime) {
            alert('Please fill in all required fields');
            return;
        }

        const task = {
            id: Date.now().toString(),
            name,
            startTime,
            endTime,
            points,
            completed: false,
            createdAt: new Date(),
            penaltyApplied: false,
            frequency,
            category
        };

        this.tasks.push(task);
        this.saveData();
        this.updateUI();
        this.hideModal();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            
            // Update completion dates for streak tracking
            if (task.completed) {
                const today = new Date().toDateString();
                if (!this.completionDates.includes(today)) {
                    this.completionDates.push(today);
                }
            }
            
            this.calculateStreak();
            this.saveData();
            this.updateUI();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveData();
        this.updateUI();
    }

    getTaskStatus(task) {
        if (task.completed) return 'completed';

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const startTime = this.timeToMinutes(task.startTime);
        const endTime = this.timeToMinutes(task.endTime);

        if (currentTime > endTime) return 'overdue';
        if (currentTime >= startTime && currentTime <= endTime) return 'active';
        return 'pending';
    }

    timeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }

    calculateStreak() {
        const today = new Date();
        let streak = 0;

        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateString = checkDate.toDateString();

            if (this.completionDates.includes(dateString)) {
                streak++;
            } else {
                break;
            }
        }

        this.currentStreak = streak;
    }

    updateDateTime() {
        const now = new Date();
        const dateOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };

        document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', dateOptions);
        document.getElementById('current-time').textContent = now.toLocaleTimeString('en-US', timeOptions);
    }

    updateUI() {
        this.renderTasks();
        this.updateStats();
        this.updateTimer();
        this.updateStreak();
        this.updateOverdueAlert();
    }

    renderTasks() {
        const container = document.getElementById('tasks-container');
        const emptyState = document.getElementById('empty-state');

        if (this.tasks.length === 0) {
            emptyState.classList.remove('hidden');
            // Remove any existing task cards
            const taskCards = container.querySelectorAll('.task-card');
            taskCards.forEach(card => card.remove());
            return;
        }

        emptyState.classList.add('hidden');

        // Remove existing task cards
        const taskCards = container.querySelectorAll('.task-card');
        taskCards.forEach(card => card.remove());

        // Render tasks
        this.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const status = this.getTaskStatus(task);
        const div = document.createElement('div');
        div.className = `task-card ${status}`;

        const categoryIcons = {
            study: '📚',
            work: '💼',
            gym: '💪',
            skill: '🎯',
            personal: '👤',
            health: '🏥',
            other: '📋'
        };

        div.innerHTML = `
            <div class="task-content">
                <div class="task-main">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="taskManager.toggleTask('${task.id}')">
                    <div class="task-details">
                        <div class="task-name ${task.completed ? 'completed' : ''}">${task.name}</div>
                        <div class="task-meta">
                            <div class="task-time">
                                <i data-lucide="clock"></i>
                                ${this.formatTime(task.startTime)} - ${this.formatTime(task.endTime)}
                            </div>
                            <span class="badge points">+${task.points} pts</span>
                            <span class="badge frequency">${task.frequency.charAt(0).toUpperCase() + task.frequency.slice(1)}</span>
                            <span class="badge category">${categoryIcons[task.category]} ${task.category.charAt(0).toUpperCase() + task.category.slice(1)}</span>
                            ${task.penaltyApplied ? `<span class="badge penalty">-${Math.floor(task.points / 2)} penalty</span>` : ''}
                            <span class="badge status ${status}">${status}</span>
                        </div>
                    </div>
                </div>
                <button class="delete-btn" onclick="taskManager.deleteTask('${task.id}')">&times;</button>
            </div>
        `;

        // Re-initialize Lucide icons for the new element
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        return div;
    }

    updateStats() {
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const totalPoints = this.tasks.filter(task => task.completed).reduce((sum, task) => sum + task.points, 0);
        const netPoints = totalPoints - this.penalties;
        const completionRate = this.tasks.length > 0 ? Math.round((completedTasks / this.tasks.length) * 100) : 0;
        const overdueTasks = this.tasks.filter(task => this.getTaskStatus(task) === 'overdue' && !task.completed).length;
        const activeTasks = this.tasks.filter(task => this.getTaskStatus(task) === 'active').length;

        // Update XP display
        document.getElementById('net-points').textContent = netPoints;
        document.getElementById('total-points').textContent = totalPoints;
        document.getElementById('penalties').textContent = this.penalties;

        // Update XP chart
        const xpMax = Math.max(netPoints + 100, 500);
        const xpPercentage = Math.max(0, netPoints) / xpMax * 100;
        this.updateCircularChart('xp-circle', xpPercentage);
        document.getElementById('xp-chart-value').textContent = Math.max(0, netPoints);

        // Update diagnostics
        document.getElementById('total-tasks').textContent = this.tasks.length;
        document.getElementById('active-tasks').textContent = activeTasks;
        document.getElementById('overdue-tasks').textContent = overdueTasks;
        document.getElementById('penalty-points').textContent = this.penalties;

        // Update analysis charts
        const completedPercentage = this.tasks.length > 0 ? (completedTasks / this.tasks.length) * 100 : 0;
        this.updateCircularChart('completed-circle', completedPercentage);
        this.updateCircularChart('success-circle', completionRate);
        
        document.getElementById('completed-value').textContent = completedTasks;
        document.getElementById('completed-max').textContent = this.tasks.length || 1;
        document.getElementById('success-value').textContent = completionRate;
    }

    updateCircularChart(elementId, percentage) {
        const circle = document.getElementById(elementId);
        if (circle) {
            const circumference = 2 * Math.PI * 40; // radius = 40
            const offset = circumference - (percentage / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }
    }

    updateTimer() {
        const now = new Date();
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const totalDayMinutes = 24 * 60;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const remainingMinutes = Math.max(0, totalDayMinutes - currentMinutes);

        const hours = Math.floor(remainingMinutes / 60);
        const minutes = remainingMinutes % 60;

        // Update timer display
        const timerValue = document.getElementById('timer-value');
        const timerCircle = document.getElementById('timer-circle');
        const timerMessage = document.getElementById('timer-message');

        if (timerValue) {
            timerValue.textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        }

        // Update timer circle
        const progress = (currentMinutes / totalDayMinutes) * 100;
        const circumference = 2 * Math.PI * 45; // radius = 45
        const offset = circumference - (progress / 100) * circumference;
        if (timerCircle) {
            timerCircle.style.strokeDashoffset = offset;
            
            // Update color based on time left
            if (remainingMinutes <= 60) {
                timerCircle.style.stroke = '#ef4444'; // Red
                timerValue.style.color = '#ef4444';
            } else if (remainingMinutes <= 180) {
                timerCircle.style.stroke = '#f59e0b'; // Orange
                timerValue.style.color = '#f59e0b';
            } else {
                timerCircle.style.stroke = '#22d3ee'; // Cyan
                timerValue.style.color = '#22d3ee';
            }
        }

        // Update timer message
        const incompleteDailyTasks = this.tasks.filter(
            task => (task.frequency === 'daily' || task.frequency === 'today') && !task.completed
        ).length;

        if (timerMessage) {
            if (incompleteDailyTasks === 0) {
                timerMessage.textContent = '✅ All daily tasks complete!';
            } else if (remainingMinutes <= 60) {
                timerMessage.textContent = '⚠️ CRITICAL: Penalties incoming!';
            } else if (remainingMinutes <= 180) {
                timerMessage.textContent = '⚠️ WARNING: Day ending soon!';
            } else {
                timerMessage.textContent = `${incompleteDailyTasks} daily tasks pending`;
            }
        }
    }

    updateStreak() {
        // Update header streak
        const headerStreakCount = document.getElementById('header-streak-count');
        const headerFlame = document.getElementById('header-flame');
        
        if (headerStreakCount) {
            headerStreakCount.textContent = this.currentStreak;
        }
        
        if (headerFlame) {
            if (this.currentStreak > 0) {
                headerFlame.style.color = '#60a5fa';
                headerFlame.style.filter = 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.6))';
            } else {
                headerFlame.style.color = '#6b7280';
                headerFlame.style.filter = 'none';
            }
        }

        // Update main streak display
        const streakCount = document.getElementById('streak-count');
        const mainFlame = document.getElementById('main-flame');
        const streakBar = document.getElementById('streak-bar');

        if (streakCount) {
            streakCount.textContent = `${this.currentStreak} / 7 days`;
        }

        if (mainFlame) {
            if (this.currentStreak > 0) {
                mainFlame.style.color = '#60a5fa';
                mainFlame.style.filter = 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))';
            } else {
                mainFlame.style.color = '#6b7280';
                mainFlame.style.filter = 'none';
            }
        }

        if (streakBar) {
            const streakPercentage = Math.min((this.currentStreak / 7) * 100, 100);
            streakBar.style.width = `${streakPercentage}%`;
        }
    }

    updateOverdueAlert() {
        const alert = document.getElementById('overdue-alert');
        const alertMessage = document.getElementById('alert-message');
        const overdueTasks = this.tasks.filter(task => this.getTaskStatus(task) === 'overdue' && !task.completed);

        if (overdueTasks.length > 0) {
            const penaltyPoints = overdueTasks.reduce((sum, task) => {
                return sum + (task.penaltyApplied ? Math.floor(task.points / 2) : 0);
            }, 0);

            alertMessage.textContent = `⚠️ SYSTEM ALERT: ${overdueTasks.length} task(s) overdue! Penalty applied: -${penaltyPoints} points`;
            alert.classList.remove('hidden');
        } else {
            alert.classList.add('hidden');
        }
    }

    checkForPenalties() {
        let newPenalties = 0;
        this.tasks.forEach(task => {
            if (!task.completed && !task.penaltyApplied && this.getTaskStatus(task) === 'overdue') {
                newPenalties += Math.floor(task.points / 2);
                task.penaltyApplied = true;
            }
        });

        if (newPenalties > 0) {
            this.penalties += newPenalties;
            this.saveData();
            this.updateUI();
        }
    }

    startTimers() {
        // Update time every second
        setInterval(() => {
            this.updateDateTime();
            this.updateTimer();
        }, 1000);

        // Check for penalties every 30 seconds
        setInterval(() => {
            this.checkForPenalties();
        }, 30000);

        // Update UI every minute
        setInterval(() => {
            this.updateUI();
        }, 60000);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});

// Handle page visibility change to update when user returns
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.taskManager) {
        window.taskManager.updateUI();
    }
});