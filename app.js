// app.js - Complete Supercharged Life Tracker Pro
const LifeTrackerApp = {
    init() {
        this.currentDate = new Date();
        this.currentViewMonth = new Date();
        this.workoutViewMonth = new Date();
        this.hygieneViewMonth = new Date();
        this.selectedWorkoutTemplate = null;
        this.charts = {};
        
        this.setupEventListeners();
        this.updateCurrentDate();
        this.initializeApp();
        this.setupEmailAutomation();
    },

    async initializeApp() {
        try {
            await db.open();
            console.log('Database opened successfully');
            
            // Initialize default data
            await this.initializeDefaultData();
            
            this.renderAllPages();
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    },

    async initializeDefaultData() {
        // Check if we have any workout templates
        const templates = await db.workoutTemplates.toArray();
        if (templates.length === 0) {
            const defaultTemplateId = await db.workoutTemplates.add({
                name: "Full Body Workout",
                createdAt: new Date(),
                category: "strength"
            });
            this.selectedWorkoutTemplate = defaultTemplateId;
            
            await db.workoutExercises.bulkAdd([
                { templateId: defaultTemplateId, name: "Squats", pr: "", order: 1, createdAt: new Date(), targetSets: 3, targetReps: 10 },
                { templateId: defaultTemplateId, name: "Push-ups", pr: "", order: 2, createdAt: new Date(), targetSets: 3, targetReps: 15 },
                { templateId: defaultTemplateId, name: "Pull-ups", pr: "", order: 3, createdAt: new Date(), targetSets: 3, targetReps: 8 }
            ]);
        } else {
            this.selectedWorkoutTemplate = templates[0].id;
        }

        // Initialize default goals
        const goals = await db.goals.toArray();
        if (goals.length === 0) {
            await db.goals.bulkAdd([
                {
                    title: "30-Day Dopamine Control",
                    description: "Complete 30 consecutive days of dopamine control",
                    type: "streak",
                    targetValue: 30,
                    currentValue: 0,
                    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    completed: false,
                    createdAt: new Date()
                },
                {
                    title: "Perfect Hygiene Week",
                    description: "Complete all hygiene habits for 7 consecutive days",
                    type: "completion",
                    targetValue: 7,
                    currentValue: 0,
                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    completed: false,
                    createdAt: new Date()
                }
            ]);
        }
    },

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = item.getAttribute('data-page');
                this.showPage(targetPage);
            });
        });

        // Settings button
        document.getElementById('settingsButton').addEventListener('click', () => {
            this.showPage('database');
        });

        // Email report button
        const emailReportButton = document.getElementById('emailReportButton');
        if (emailReportButton) {
            emailReportButton.addEventListener('click', () => {
                this.showEmailReportModal();
            });
        }

        // Modal handlers - with null checks
        this.setupModalHandlers();
    },

    setupModalHandlers() {
        // Helper function to safely add event listeners
        const safeAddEventListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            }
        };

        // Dopamine modal
        safeAddEventListener('closeDopamineModal', 'click', () => {
            this.hideModal('dopamineModal');
        });
        safeAddEventListener('cancelDopamineLog', 'click', () => {
            this.hideModal('dopamineModal');
        });
        safeAddEventListener('saveDopamineLog', 'click', () => {
            this.saveDopamineEntry();
        });

        // Habit modal
        safeAddEventListener('closeHabitModal', 'click', () => {
            this.hideModal('habitModal');
        });
        safeAddEventListener('cancelHabit', 'click', () => {
            this.hideModal('habitModal');
        });
        safeAddEventListener('saveHabit', 'click', () => {
            this.saveHabit();
        });

        // Workout modal
        safeAddEventListener('closeWorkoutModal', 'click', () => {
            this.hideModal('workoutModal');
        });
        safeAddEventListener('cancelWorkout', 'click', () => {
            this.hideModal('workoutModal');
        });
        safeAddEventListener('saveWorkout', 'click', () => {
            this.saveWorkoutTemplate();
        });

        // Exercise modal
        safeAddEventListener('closeExerciseModal', 'click', () => {
            this.hideModal('exerciseModal');
        });
        safeAddEventListener('cancelExercise', 'click', () => {
            this.hideModal('exerciseModal');
        });
        safeAddEventListener('saveExercise', 'click', () => {
            this.saveExercise();
        });

        // Mood modal
        safeAddEventListener('closeMoodModal', 'click', () => {
            this.hideModal('moodModal');
        });
        safeAddEventListener('cancelMoodLog', 'click', () => {
            this.hideModal('moodModal');
        });
        safeAddEventListener('saveMoodLog', 'click', () => {
            this.saveMoodEntry();
        });

        // Email modal
        safeAddEventListener('closeEmailModal', 'click', () => {
            this.hideModal('emailReportModal');
        });
        safeAddEventListener('cancelEmailReport', 'click', () => {
            this.hideModal('emailReportModal');
        });
        safeAddEventListener('sendEmailReport', 'click', () => {
            this.sendEmailReport();
        });
    },

    updateCurrentDate() {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('currentDate').textContent = 
            this.currentDate.toLocaleDateString('en-US', options);
    },

    showPage(pageId) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === pageId) {
                item.classList.add('active');
            }
        });

        // Show selected page
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');

        // Render page content
        switch(pageId) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'dopamine':
                this.renderDopaminePage();
                break;
            case 'hygiene':
                this.renderHygienePage();
                break;
            case 'workout':
                this.renderWorkoutPage();
                break;
            case 'mood':
                this.renderMoodPage();
                break;
            case 'analytics':
                this.renderAnalyticsPage();
                break;
            case 'database':
                this.renderDatabasePage();
                break;
        }
    },

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    // Enhanced Dashboard with Dark Aesthetic
    async renderDashboard() {
        const today = this.formatDate(new Date());
        const currentStreak = await this.calculateCurrentStreak();
        const completionRate = await this.calculateTodayCompletion(today);
        const todayMood = await this.getTodayMood();

        const dashboardEl = document.getElementById('dashboard');
        dashboardEl.innerHTML = `
            <div class="welcome-card" style="background: linear-gradient(135deg, #1a1a1a, #2d2d2d); border: 1px solid #333;">
                <h2 style="color: #fff;">Welcome to Life Tracker Pro!</h2>
                <p style="color: #ccc;">Your supercharged productivity companion</p>
                <div class="stats-grid">
                    <div class="stat-card" style="background: rgba(40, 40, 40, 0.8);">
                        <div class="stat-value" id="currentStreak" style="color: #4CAF50;">${currentStreak}</div>
                        <div class="stat-label" style="color: #888;">Day Streak</div>
                    </div>
                    <div class="stat-card" style="background: rgba(40, 40, 40, 0.8);">
                        <div class="stat-value" id="todayCompletion" style="color: #2196F3;">${completionRate}%</div>
                        <div class="stat-label" style="color: #888;">Today's Progress</div>
                    </div>
                    <div class="stat-card" style="background: rgba(40, 40, 40, 0.8);">
                        <div class="stat-value" id="moodScore" style="color: #9C27B0;">${todayMood ? `${todayMood.mood}/5` : '-'}</div>
                        <div class="stat-label" style="color: #888;">Today's Mood</div>
                    </div>
                    <div class="stat-card" style="background: rgba(40, 40, 40, 0.8);">
                        <div class="stat-value" id="stressLevel" style="color: #FF5722;">${todayMood && todayMood.stress ? `${todayMood.stress}/5` : '-'}</div>
                        <div class="stat-label" style="color: #888;">Stress Level</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Quick Actions</div>
                </div>
                <div class="module-card" data-page="dopamine">
                    <div class="module-icon" style="background: #405DE6;">
                        <i class="fas fa-brain"></i>
                    </div>
                    <div class="module-info">
                        <div class="module-title">Dopamine Control</div>
                        <div class="module-desc">Track your daily progress</div>
                    </div>
                    <div class="module-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
                
                <div class="module-card" data-page="hygiene">
                    <div class="module-icon" style="background: #0095F6;">
                        <i class="fas fa-shower"></i>
                    </div>
                    <div class="module-info">
                        <div class="module-title">Personal Hygiene</div>
                        <div class="module-desc">Daily routine tracker</div>
                    </div>
                    <div class="module-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
                
                <div class="module-card" data-page="workout">
                    <div class="module-icon" style="background: #00C851;">
                        <i class="fas fa-dumbbell"></i>
                    </div>
                    <div class="module-info">
                        <div class="module-title">Workout</div>
                        <div class="module-desc">Exercise tracking & analytics</div>
                    </div>
                    <div class="module-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>

                <div class="module-card" data-page="mood">
                    <div class="module-icon" style="background: #C13584;">
                        <i class="fas fa-heart"></i>
                    </div>
                    <div class="module-info">
                        <div class="module-title">Mood & Energy</div>
                        <div class="module-desc">Track how you feel</div>
                    </div>
                    <div class="module-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            </div>

            <!-- Quick Mood Log -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Quick Mood Check</div>
                </div>
                <div class="mood-quick-actions">
                    <div class="mood-btn" data-mood="5" data-energy="5" data-stress="1" data-ocd="1">
                        <div class="mood-emoji">😊</div>
                        <div class="mood-label">Great</div>
                    </div>
                    <div class="mood-btn" data-mood="4" data-energy="4" data-stress="2" data-ocd="2">
                        <div class="mood-emoji">😄</div>
                        <div class="mood-label">Good</div>
                    </div>
                    <div class="mood-btn" data-mood="3" data-energy="3" data-stress="3" data-ocd="3">
                        <div class="mood-emoji">😐</div>
                        <div class="mood-label">Okay</div>
                    </div>
                    <div class="mood-btn" data-mood="2" data-energy="2" data-stress="4" data-ocd="4">
                        <div class="mood-emoji">😔</div>
                        <div class="mood-label">Low</div>
                    </div>
                    <div class="mood-btn" data-mood="1" data-energy="1" data-stress="5" data-ocd="5">
                        <div class="mood-emoji">😢</div>
                        <div class="mood-label">Poor</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Monthly Overview</div>
                </div>
                <div class="calendar-container" id="dashboardCalendar">
                    <!-- Calendar will be populated by JavaScript -->
                </div>
            </div>
        `;

        // Add event listeners for dashboard modules
        dashboardEl.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', () => {
                const targetPage = card.getAttribute('data-page');
                this.showPage(targetPage);
            });
        });

        // Add event listeners for quick mood buttons
        dashboardEl.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mood = parseInt(btn.getAttribute('data-mood'));
                const energy = parseInt(btn.getAttribute('data-energy'));
                const stress = parseInt(btn.getAttribute('data-stress'));
                const ocd = parseInt(btn.getAttribute('data-ocd'));
                this.quickLogMood(mood, energy, stress, ocd);
            });
        });

        this.renderDashboardCalendar();
    },

    async renderDashboardCalendar() {
        const calendarEl = document.getElementById('dashboardCalendar');
        if (!calendarEl) return;

        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        let calendarHTML = `
            <div class="calendar-header">
                <div class="calendar-month">${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                <div class="calendar-nav">
                    <div class="calendar-nav-btn" id="prevDashboardMonth">
                        <i class="fas fa-chevron-left"></i>
                    </div>
                    <div class="calendar-nav-btn" id="nextDashboardMonth">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            </div>
            <div class="calendar">
        `;
        
        // Day headers
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach(day => {
            calendarHTML += `<div class="calendar-day empty"><div class="day-name">${day}</div></div>`;
        });
        
        // Empty days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayDate = new Date(now.getFullYear(), now.getMonth(), i);
            const dateKey = this.formatDate(dayDate);
            let dayClass = 'calendar-day future';
            
            // Check if it's today
            if (i === now.getDate() && now.getMonth() === new Date().getMonth() && now.getFullYear() === new Date().getFullYear()) {
                dayClass += ' current';
            }
            
            // Calculate completion for this day and color code
            const completion = await this.calculateTodayCompletion(dateKey);
            if (completion >= 75) {
                dayClass += ' passed'; // Green
            } else if (completion >= 50) {
                dayClass += ' warning'; // Orange
            } else if (completion > 0) {
                dayClass += ' failed'; // Red
            }
            
            calendarHTML += `
                <div class="${dayClass}" data-date="${dateKey}" style="cursor: pointer;" title="${completion}% completion">
                    <div class="day-number">${i}</div>
                    ${completion > 0 ? `<div class="day-completion" style="font-size: 8px; margin-top: 2px;">${completion}%</div>` : ''}
                </div>
            `;
        }
        
        calendarHTML += '</div>';
        calendarEl.innerHTML = calendarHTML;

        // Add event listeners for dashboard calendar navigation
        const prevBtn = document.getElementById('prevDashboardMonth');
        const nextBtn = document.getElementById('nextDashboardMonth');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                now.setMonth(now.getMonth() - 1);
                this.renderDashboardCalendar();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                now.setMonth(now.getMonth() + 1);
                this.renderDashboardCalendar();
            });
        }

        // Add click handlers for calendar days
        calendarEl.querySelectorAll('.calendar-day[data-date]').forEach(day => {
            day.addEventListener('click', () => {
                const date = day.getAttribute('data-date');
                this.showDayDetails(date);
            });
        });
    },

    async showDayDetails(date) {
        const dopamineEntry = await db.dopamineEntries.where('date').equals(date).first();
        const workoutEntry = await db.workoutHistory.where('date').equals(date).first();
        const hygieneCompletions = await db.hygieneCompletions.where('date').equals(date).toArray();
        const moodEntry = await db.moodEntries.where('date').equals(date).first();
        const habits = await db.hygieneHabits.toArray();
        
        const completedHabits = habits.filter(habit => 
            hygieneCompletions.some(completion => completion.habitId === habit.id && completion.completed)
        );
        const missedHabits = habits.filter(habit => 
            !hygieneCompletions.some(completion => completion.habitId === habit.id && completion.completed)
        );
        
        const completionRate = await this.calculateTodayCompletion(date);
        
        let detailsHTML = `
            <div class="modal active" id="dayDetailsModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">Daily Overview - ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        <div class="modal-close" id="closeDayDetails">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class="completion-summary" style="text-align: center; margin-bottom: 20px;">
                            <div style="font-size: 24px; font-weight: bold; color: ${completionRate >= 75 ? '#4CAF50' : completionRate >= 50 ? '#FF9800' : '#F44336'};">${completionRate}%</div>
                            <div style="color: #888; font-size: 14px;">Overall Completion</div>
                        </div>
                        
                        <div class="day-section">
                            <h4 style="margin-bottom: 10px;">Dopamine Control</h4>
                            <div class="status-badge ${dopamineEntry ? (dopamineEntry.status === 'passed' ? 'status-passed' : 'status-failed') : 'status-missing'}">
                                ${dopamineEntry ? (dopamineEntry.status === 'passed' ? '✅ Successful Day' : '❌ Challenging Day') : '❓ Not Logged'}
                            </div>
                            ${dopamineEntry && dopamineEntry.notes ? `<div style="margin-top: 5px; color: #888; font-size: 14px;">${dopamineEntry.notes}</div>` : ''}
                        </div>
                        
                        <div class="day-section">
                            <h4 style="margin-bottom: 10px;">Workout</h4>
                            <div class="status-badge ${workoutEntry ? (workoutEntry.type === 'completed' ? 'status-passed' : workoutEntry.type === 'rest' ? 'status-warning' : 'status-failed') : 'status-missing'}">
                                ${workoutEntry ? (
                                    workoutEntry.type === 'completed' ? '💪 Workout Completed' : 
                                    workoutEntry.type === 'rest' ? '😴 Rest Day' : 
                                    '❌ Missed Workout'
                                ) : '❓ Not Logged'}
                            </div>
                        </div>
                        
                        <div class="day-section">
                            <h4 style="margin-bottom: 10px;">Hygiene Habits</h4>
                            <div style="margin-bottom: 10px;">
                                <strong>Completed (${completedHabits.length}/${habits.length}):</strong>
                                ${completedHabits.length > 0 ? completedHabits.map(habit => `<div style="color: #4CAF50; margin: 2px 0;">✓ ${habit.name}</div>`).join('') : '<div style="color: #888;">No habits completed</div>'}
                            </div>
                            <div>
                                <strong>Missed:</strong>
                                ${missedHabits.length > 0 ? missedHabits.map(habit => `<div style="color: #F44336; margin: 2px 0;">✗ ${habit.name}</div>`).join('') : '<div style="color: #4CAF50;">All habits completed!</div>'}
                            </div>
                        </div>
                        
                        ${moodEntry ? `
                        <div class="day-section">
                            <h4 style="margin-bottom: 10px;">Mood & Energy</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px;">
                                <div style="text-align: center;">
                                    <div style="font-size: 20px;">${this.getMoodEmoji(moodEntry.mood)}</div>
                                    <div style="font-size: 12px; color: #888;">Mood: ${moodEntry.mood}/5</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 20px;">⚡</div>
                                    <div style="font-size: 12px; color: #888;">Energy: ${moodEntry.energy}/5</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 20px;">😰</div>
                                    <div style="font-size: 12px; color: #888;">Stress: ${moodEntry.stress}/5</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 20px;">🔄</div>
                                    <div style="font-size: 12px; color: #888;">OCD: ${moodEntry.ocd}/5</div>
                                </div>
                            </div>
                            ${moodEntry.notes ? `<div style="margin-top: 10px; color: #888; font-size: 14px;">${moodEntry.notes}</div>` : ''}
                        </div>
                        ` : ''}
                        
                        <div class="form-actions" style="margin-top: 20px;">
                            <button class="btn btn-secondary" id="closeDayDetailsBtn">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Create modal element
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = detailsHTML;
        document.body.appendChild(modalContainer);
        
        // Add event listeners
        document.getElementById('closeDayDetails').addEventListener('click', () => {
            document.body.removeChild(modalContainer);
        });
        
        document.getElementById('closeDayDetailsBtn').addEventListener('click', () => {
            document.body.removeChild(modalContainer);
        });
    },

    // RESTORED: Dopamine Page (fully functional as before)
    async renderDopaminePage() {
        const dopamineEl = document.getElementById('dopamine');
        const currentStreak = await this.calculateCurrentStreak();
        const longestStreak = await this.calculateLongestStreak();
        const recentEntries = await this.getRecentDopamineEntries();

        dopamineEl.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Dopamine Control</div>
                </div>
                
                <div class="calendar-container">
                    <div class="calendar-header">
                        <div class="calendar-month">${this.currentViewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                        <div class="calendar-nav">
                            <div class="calendar-nav-btn" id="prevDopamineMonth">
                                <i class="fas fa-chevron-left"></i>
                            </div>
                            <div class="calendar-nav-btn" id="nextDopamineMonth">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="calendar" id="dopamineCalendar">
                        ${await this.renderDopamineCalendar()}
                    </div>
                </div>
                
                <div class="streak-display">
                    <div class="streak-info">
                        <div class="streak-value">${currentStreak}</div>
                        <div class="streak-label">Current Streak</div>
                    </div>
                    <div class="streak-info">
                        <div class="streak-value">${longestStreak}</div>
                        <div class="streak-label">Longest Streak</div>
                    </div>
                </div>
                
                <button class="btn btn-primary" id="logDopamineStatus">
                    <i class="fas fa-plus"></i> Log Today's Status
                </button>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Recent Entries</div>
                </div>
                <div id="dopamineEntries">
                    ${recentEntries.length > 0 ? recentEntries : `
                        <div class="empty-state">
                            <i class="fas fa-brain"></i>
                            <p>No entries yet</p>
                            <p>Start tracking your progress today!</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        // Add event listeners
        const prevBtn = document.getElementById('prevDopamineMonth');
        const nextBtn = document.getElementById('nextDopamineMonth');
        const logBtn = document.getElementById('logDopamineStatus');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentViewMonth.setMonth(this.currentViewMonth.getMonth() - 1);
                this.renderDopaminePage();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentViewMonth.setMonth(this.currentViewMonth.getMonth() + 1);
                this.renderDopaminePage();
            });
        }

        if (logBtn) {
            logBtn.addEventListener('click', () => {
                this.showDopamineModal();
            });
        }

        // Add click handlers for entries
        dopamineEl.querySelectorAll('.edit-dopamine').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const entryId = parseInt(btn.getAttribute('data-id'));
                this.editDopamineEntry(entryId);
            });
        });
    },

    async renderDopamineCalendar() {
        const firstDay = new Date(this.currentViewMonth.getFullYear(), this.currentViewMonth.getMonth(), 1);
        const lastDay = new Date(this.currentViewMonth.getFullYear(), this.currentViewMonth.getMonth() + 1, 0);
        const today = new Date();
        
        let calendarHTML = '';
        
        // Day headers
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach(day => {
            calendarHTML += `<div class="calendar-day empty"><div class="day-name">${day}</div></div>`;
        });
        
        // Empty days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayDate = new Date(this.currentViewMonth.getFullYear(), this.currentViewMonth.getMonth(), i);
            const dateKey = this.formatDate(dayDate);
            let dayClass = 'calendar-day future';
            
            // Check if it's today
            if (i === today.getDate() && this.currentViewMonth.getMonth() === today.getMonth() && this.currentViewMonth.getFullYear() === today.getFullYear()) {
                dayClass += ' current';
            }
            
            // Check dopamine status for this day
            const dopamineEntry = await db.dopamineEntries.where('date').equals(dateKey).first();
            if (dopamineEntry) {
                dayClass += dopamineEntry.status === 'passed' ? ' passed' : ' failed';
            }
            
            calendarHTML += `
                <div class="${dayClass}" data-date="${dateKey}">
                    <div class="day-number">${i}</div>
                </div>
            `;
        }
        
        return calendarHTML;
    },

    showDopamineModal(entry = null) {
        const today = this.formatDate(new Date());
        const dateInput = document.getElementById('dopamineDate');
        const statusInput = document.getElementById('dopamineStatus');
        const notesInput = document.getElementById('dopamineNotes');
        const saveBtn = document.getElementById('saveDopamineLog');
        const modalTitle = document.querySelector('#dopamineModal .modal-title');

        if (dateInput && statusInput && notesInput && saveBtn && modalTitle) {
            dateInput.value = entry ? entry.date : today;
            statusInput.value = entry ? entry.status : 'passed';
            notesInput.value = entry ? entry.notes : '';
            
            if (entry) {
                modalTitle.textContent = 'Edit Dopamine Entry';
                saveBtn.setAttribute('data-edit-id', entry.id);
            } else {
                modalTitle.textContent = 'Log Dopamine Status';
                saveBtn.removeAttribute('data-edit-id');
            }
            
            this.showModal('dopamineModal');
        }
    },

    async saveDopamineEntry() {
        const dateInput = document.getElementById('dopamineDate');
        const statusInput = document.getElementById('dopamineStatus');
        const notesInput = document.getElementById('dopamineNotes');
        const saveBtn = document.getElementById('saveDopamineLog');

        if (!dateInput || !statusInput || !notesInput || !saveBtn) return;

        const date = dateInput.value;
        const status = statusInput.value;
        const notes = notesInput.value;
        const editId = saveBtn.getAttribute('data-edit-id');

        if (!date) {
            alert('Please select a date');
            return;
        }

        try {
            if (editId) {
                // Update existing entry
                await db.dopamineEntries.update(parseInt(editId), {
                    date,
                    status,
                    notes,
                    createdAt: new Date()
                });
            } else {
                // Create new entry
                await db.dopamineEntries.add({
                    date,
                    status,
                    notes,
                    createdAt: new Date()
                });
            }

            this.hideModal('dopamineModal');
            this.renderDopaminePage();
            this.renderDashboard();
        } catch (error) {
            console.error('Error saving dopamine entry:', error);
            alert('Error saving entry. Please try again.');
        }
    },

    async getRecentDopamineEntries() {
        const entries = await db.dopamineEntries.orderBy('date').reverse().limit(5).toArray();
        
        return entries.map(entry => `
            <div class="log-entry">
                <div class="log-date">
                    ${new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    <div class="log-actions">
                        <div class="log-action edit-dopamine" data-id="${entry.id}">
                            <i class="fas fa-edit"></i>
                        </div>
                    </div>
                </div>
                <div class="log-status ${entry.status === 'passed' ? 'status-passed' : 'status-failed'}">
                    ${entry.status === 'passed' ? 'Successful Day' : 'Challenging Day'}
                </div>
                <div class="log-notes">${entry.notes || 'No notes'}</div>
            </div>
        `).join('');
    },

    async editDopamineEntry(entryId) {
        const entry = await db.dopamineEntries.get(entryId);
        if (entry) {
            this.showDopamineModal(entry);
        }
    },

    // Enhanced Hygiene Page with Individual Habit Tracking
    async renderHygienePage() {
        const hygieneEl = document.getElementById('hygiene');
        const habits = await db.hygieneHabits.toArray();
        const today = this.formatDate(new Date());
        const completionRate = await this.calculateHygieneCompletion(today);

        let habitsHTML = '';
        for (const habit of habits) {
            const completed = await this.isHabitCompletedToday(habit.id);
            habitsHTML += `
                <div class="habit-item ${completed ? 'swipe-completed' : ''}" data-habit-id="${habit.id}">
                    <div class="habit-icon">
                        <i class="fas fa-${this.getHabitIcon(habit.name)}"></i>
                    </div>
                    <div class="habit-info">
                        <div class="habit-name">${habit.name}</div>
                        <div class="habit-desc">${habit.description}</div>
                    </div>
                    <div class="habit-check ${completed ? 'completed' : ''}">
                        <i class="fas fa-check"></i>
                    </div>
                </div>
            `;
        }

        hygieneEl.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Daily Hygiene</div>
                </div>
                
                ${habitsHTML || `
                    <div class="empty-state">
                        <i class="fas fa-shower"></i>
                        <p>No habits added yet</p>
                    </div>
                `}
                
                <div class="completion-card" style="background: linear-gradient(135deg, #1a1a1a, #2d2d2d);">
                    <div class="completion-value">${completionRate}%</div>
                    <div class="completion-label">Today's Completion</div>
                </div>
            </div>
            
            <button class="btn btn-primary" id="addHygieneHabit">
                <i class="fas fa-plus"></i> Add New Habit
            </button>

            <div class="card mt-20">
                <div class="card-header">
                    <div class="card-title">Monthly Hygiene Calendar</div>
                </div>
                
                <div class="calendar-container">
                    <div class="calendar-header">
                        <div class="calendar-month">${this.hygieneViewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                        <div class="calendar-nav">
                            <div class="calendar-nav-btn" id="prevHygieneMonth">
                                <i class="fas fa-chevron-left"></i>
                            </div>
                            <div class="calendar-nav-btn" id="nextHygieneMonth">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="calendar" id="hygieneCalendar">
                        ${await this.renderHygieneCalendar()}
                    </div>
                </div>
            </div>

            <div class="card mt-20">
                <div class="card-header">
                    <div class="card-title">Individual Habit Calendars</div>
                </div>
                <div id="individualHabitCalendars">
                    ${await this.renderIndividualHabitCalendars()}
                </div>
            </div>
        `;

        // Add event listeners
        const addHabitBtn = document.getElementById('addHygieneHabit');
        const prevMonthBtn = document.getElementById('prevHygieneMonth');
        const nextMonthBtn = document.getElementById('nextHygieneMonth');

        if (addHabitBtn) {
            addHabitBtn.addEventListener('click', () => {
                this.showHabitModal();
            });
        }

        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                this.hygieneViewMonth.setMonth(this.hygieneViewMonth.getMonth() - 1);
                this.renderHygienePage();
            });
        }

        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                this.hygieneViewMonth.setMonth(this.hygieneViewMonth.getMonth() + 1);
                this.renderHygienePage();
            });
        }

        // Add click handlers for habits
        hygieneEl.querySelectorAll('.habit-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const habitId = parseInt(item.getAttribute('data-habit-id'));
                const completed = item.classList.contains('swipe-completed');
                this.toggleHabitCompletion(habitId, !completed);
            });
        });

        // Add click handlers for habit calendars
        hygieneEl.querySelectorAll('.habit-calendar-day').forEach(day => {
            day.addEventListener('click', (e) => {
                const habitId = parseInt(day.getAttribute('data-habit-id'));
                const date = day.getAttribute('data-date');
                this.toggleHabitCompletionForDate(habitId, date);
            });
        });
    },

    async renderIndividualHabitCalendars() {
        const habits = await db.hygieneHabits.toArray();
        let calendarsHTML = '';
        
        for (const habit of habits) {
            const habitCompletions = await db.hygieneCompletions
                .where('habitId').equals(habit.id)
                .toArray();
                
            calendarsHTML += `
                <div class="habit-calendar">
                    <h4 style="margin: 15px 0 10px 0; color: #fff;">${habit.name}</h4>
                    <div class="mini-calendar">
                        ${await this.renderMiniHabitCalendar(habit.id, habitCompletions)}
                    </div>
                </div>
            `;
        }
        
        return calendarsHTML;
    },

    async renderMiniHabitCalendar(habitId, completions) {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        let calendarHTML = '<div class="mini-calendar-grid">';
        
        // Day headers
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach(day => {
            calendarHTML += `<div class="mini-calendar-header">${day}</div>`;
        });
        
        // Empty days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="mini-calendar-day empty"></div>';
        }
        
        // Days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayDate = new Date(now.getFullYear(), now.getMonth(), i);
            const dateKey = this.formatDate(dayDate);
            
            const completion = completions.find(c => c.date === dateKey);
            const isCompleted = completion && completion.completed;
            const isToday = i === now.getDate() && now.getMonth() === new Date().getMonth();
            
            let dayClass = 'mini-calendar-day';
            if (isToday) dayClass += ' today';
            if (isCompleted) {
                dayClass += ' completed';
            } else {
                // Check if this day is in the past and not completed - mark as missed
                if (dayDate < new Date() && dayDate.getDate() !== new Date().getDate()) {
                    dayClass += ' missed';
                }
            }
            
            calendarHTML += `
                <div class="${dayClass}" data-habit-id="${habitId}" data-date="${dateKey}">
                    ${i}
                </div>
            `;
        }
        
        calendarHTML += '</div>';
        return calendarHTML;
    },

    async toggleHabitCompletionForDate(habitId, date) {
        try {
            // Check if completion record already exists for this date
            const existingCompletion = await db.hygieneCompletions
                .where('habitId').equals(habitId)
                .and(item => item.date === date)
                .first();

            if (existingCompletion) {
                await db.hygieneCompletions.update(existingCompletion.id, { 
                    completed: !existingCompletion.completed,
                    createdAt: new Date()
                });
            } else {
                await db.hygieneCompletions.add({
                    habitId,
                    date: date,
                    completed: true,
                    createdAt: new Date()
                });
            }

            this.renderHygienePage();
            this.renderDashboard();
        } catch (error) {
            console.error('Error toggling habit completion for date:', error);
        }
    },

    getHabitIcon(habitName) {
        const icons = {
            'Brush Teeth': 'tooth',
            'Face Wash': 'water',
            'Bath / Shower': 'bath',
            'Hair Care': 'wind',
            'Perfume / Cologne': 'spray-can'
        };
        return icons[habitName] || 'check-circle';
    },

    async toggleHabitCompletion(habitId, completed) {
        const today = this.formatDate(new Date());
        
        try {
            // Check if completion record already exists for today
            const existingCompletion = await db.hygieneCompletions
                .where('habitId').equals(habitId)
                .and(item => item.date === today)
                .first();

            if (existingCompletion) {
                await db.hygieneCompletions.update(existingCompletion.id, { 
                    completed,
                    createdAt: new Date()
                });
            } else {
                await db.hygieneCompletions.add({
                    habitId,
                    date: today,
                    completed,
                    createdAt: new Date()
                });
            }

            await this.updateDailyCompletion();
            this.renderHygienePage();
            this.renderDashboard();
        } catch (error) {
            console.error('Error toggling habit completion:', error);
        }
    },

    async isHabitCompletedToday(habitId) {
        const today = this.formatDate(new Date());
        const completion = await db.hygieneCompletions
            .where('habitId').equals(habitId)
            .and(item => item.date === today)
            .first();
        
        return completion ? completion.completed : false;
    },

    async calculateHygieneCompletion(date) {
        const habits = await db.hygieneHabits.toArray();
        const completions = await db.hygieneCompletions.where('date').equals(date).toArray();
        
        let completedCount = 0;
        habits.forEach(habit => {
            const completion = completions.find(c => c.habitId === habit.id);
            if (completion && completion.completed) {
                completedCount++;
            }
        });
        
        return habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
    },

    async renderHygieneCalendar() {
        const firstDay = new Date(this.hygieneViewMonth.getFullYear(), this.hygieneViewMonth.getMonth(), 1);
        const lastDay = new Date(this.hygieneViewMonth.getFullYear(), this.hygieneViewMonth.getMonth() + 1, 0);
        const today = new Date();
        
        let calendarHTML = '';
        
        // Day headers
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach(day => {
            calendarHTML += `<div class="calendar-day empty"><div class="day-name">${day}</div></div>`;
        });
        
        // Empty days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayDate = new Date(this.hygieneViewMonth.getFullYear(), this.hygieneViewMonth.getMonth(), i);
            const dateKey = this.formatDate(dayDate);
            let dayClass = 'calendar-day future';
            
            // Check if it's today
            if (i === today.getDate() && this.hygieneViewMonth.getMonth() === today.getMonth() && this.hygieneViewMonth.getFullYear() === today.getFullYear()) {
                dayClass += ' current';
            }
            
            // Check hygiene completion for this day
            const completionRate = await this.calculateHygieneCompletion(dateKey);
            if (completionRate >= 80) {
                dayClass += ' passed';
            } else if (completionRate >= 50) {
                dayClass += ' warning';
            } else if (completionRate > 0) {
                dayClass += ' failed';
            }
            
            calendarHTML += `
                <div class="${dayClass}" data-date="${dateKey}" style="cursor: pointer;">
                    <div class="day-number">${i}</div>
                    ${completionRate > 0 ? `<div class="day-completion" style="font-size: 8px; margin-top: 2px;">${completionRate}%</div>` : ''}
                </div>
            `;
        }
        
        return calendarHTML;
    },

    showHabitModal() {
        const habitNameInput = document.getElementById('habitName');
        const habitDescriptionInput = document.getElementById('habitDescription');

        if (habitNameInput && habitDescriptionInput) {
            habitNameInput.value = '';
            habitDescriptionInput.value = '';
            this.showModal('habitModal');
        }
    },

    async saveHabit() {
        const habitNameInput = document.getElementById('habitName');
        const habitDescriptionInput = document.getElementById('habitDescription');

        if (!habitNameInput || !habitDescriptionInput) return;

        const name = habitNameInput.value;
        const description = habitDescriptionInput.value;

        if (!name) {
            alert('Please enter a habit name');
            return;
        }

        try {
            // Get the next order value
            const habits = await db.hygieneHabits.toArray();
            const nextOrder = habits.length > 0 ? Math.max(...habits.map(h => h.order)) + 1 : 1;

            await db.hygieneHabits.add({
                name,
                description,
                order: nextOrder,
                createdAt: new Date()
            });

            this.hideModal('habitModal');
            this.renderHygienePage();
        } catch (error) {
            console.error('Error saving habit:', error);
            alert('Error saving habit. Please try again.');
        }
    },

    // Enhanced Workout Page with Exercise Sets and Template Management
    async renderWorkoutPage() {
        const workoutEl = document.getElementById('workout');
        const templates = await db.workoutTemplates.toArray();
        const workoutStats = await this.getWorkoutStats();
        
        let templatesHTML = '';
        templates.forEach(template => {
            templatesHTML += `
                <div class="workout-option ${template.id === this.selectedWorkoutTemplate ? 'active' : ''}" data-template-id="${template.id}">
                    ${template.name}
                    <span class="delete-template" data-template-id="${template.id}" style="margin-left: 10px; color: #ff4444; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </span>
                </div>
            `;
        });

        workoutEl.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Workout Tracker</div>
                </div>
                
                <div class="workout-selector" id="workoutTemplates">
                    ${templatesHTML}
                    <div class="workout-option" id="addWorkoutTemplate">
                        <i class="fas fa-plus"></i> New Template
                    </div>
                </div>
                
                <div class="workout-actions">
                    <button class="workout-action-btn rest-day" id="logRestDay">
                        <i class="fas fa-bed"></i> Log Rest Day
                    </button>
                    
                    <button class="workout-action-btn missed" id="logMissedWorkout">
                        <i class="fas fa-times"></i> Missed Workout
                    </button>
                </div>
                
                <div class="workout-stats">
                    <div class="workout-stat-card">
                        <div class="workout-stat-value">${workoutStats.weeklyCompleted}</div>
                        <div class="workout-stat-label">Workouts This Week</div>
                    </div>
                    <div class="workout-stat-card">
                        <div class="workout-stat-value">${workoutStats.consistency}%</div>
                        <div class="workout-stat-label">Monthly Consistency</div>
                    </div>
                    <div class="workout-stat-card">
                        <div class="workout-stat-value">${workoutStats.totalCompleted}</div>
                        <div class="workout-stat-label">Total Workouts</div>
                    </div>
                    <div class="workout-stat-card">
                        <div class="workout-stat-value">${workoutStats.currentStreak}</div>
                        <div class="workout-stat-label">Day Streak</div>
                    </div>
                </div>
                
                <div class="calendar-container">
                    <div class="calendar-header">
                        <div class="calendar-month">${this.workoutViewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                        <div class="calendar-nav">
                            <div class="calendar-nav-btn" id="prevWorkoutMonth">
                                <i class="fas fa-chevron-left"></i>
                            </div>
                            <div class="calendar-nav-btn" id="nextWorkoutMonth">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="calendar" id="workoutCalendar">
                        ${await this.renderWorkoutCalendar()}
                    </div>
                </div>
            </div>
            
            <div id="workoutExercisesContent">
                ${await this.renderWorkoutExercises()}
            </div>
        `;

        this.setupWorkoutEventListeners();
    },

    setupWorkoutEventListeners() {
        const addTemplateBtn = document.getElementById('addWorkoutTemplate');
        const logRestDayBtn = document.getElementById('logRestDay');
        const logMissedBtn = document.getElementById('logMissedWorkout');
        const prevMonthBtn = document.getElementById('prevWorkoutMonth');
        const nextMonthBtn = document.getElementById('nextWorkoutMonth');

        if (addTemplateBtn) {
            addTemplateBtn.addEventListener('click', () => {
                this.showWorkoutModal();
            });
        }

        if (logRestDayBtn) {
            logRestDayBtn.addEventListener('click', () => {
                this.logWorkoutDay('rest');
            });
        }

        if (logMissedBtn) {
            logMissedBtn.addEventListener('click', () => {
                this.logWorkoutDay('missed');
            });
        }

        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                this.workoutViewMonth.setMonth(this.workoutViewMonth.getMonth() - 1);
                this.renderWorkoutPage();
            });
        }

        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                this.workoutViewMonth.setMonth(this.workoutViewMonth.getMonth() + 1);
                this.renderWorkoutPage();
            });
        }

        // Template selection
        document.querySelectorAll('.workout-option[data-template-id]').forEach(option => {
            option.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-template')) {
                    this.selectedWorkoutTemplate = parseInt(option.getAttribute('data-template-id'));
                    this.renderWorkoutPage();
                }
            });
        });

        // Delete template
        document.querySelectorAll('.delete-template').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const templateId = parseInt(btn.getAttribute('data-template-id'));
                if (confirm('Are you sure you want to delete this workout template?')) {
                    await this.deleteWorkoutTemplate(templateId);
                }
            });
        });

        // Add exercise button
        const addExerciseBtn = document.getElementById('addExerciseBtn');
        if (addExerciseBtn) {
            addExerciseBtn.addEventListener('click', () => {
                this.showExerciseModal();
            });
        }

        // Complete workout button
        const completeWorkoutBtn = document.getElementById('completeWorkout');
        if (completeWorkoutBtn) {
            completeWorkoutBtn.addEventListener('click', () => {
                this.completeWorkout();
            });
        }
    },

    async deleteWorkoutTemplate(templateId) {
        try {
            // Delete template and related data
            await db.workoutTemplates.delete(templateId);
            await db.workoutExercises.where('templateId').equals(templateId).delete();
            
            // Select another template if available
            const templates = await db.workoutTemplates.toArray();
            this.selectedWorkoutTemplate = templates.length > 0 ? templates[0].id : null;
            
            this.renderWorkoutPage();
        } catch (error) {
            console.error('Error deleting workout template:', error);
            alert('Error deleting template. Please try again.');
        }
    },

    async completeWorkout() {
        const today = this.formatDate(new Date());
        
        try {
            // Save all exercise sets
            const exerciseElements = document.querySelectorAll('.exercise-card');
            const exercisesData = [];
            
            for (const exerciseEl of exerciseElements) {
                const exerciseName = exerciseEl.querySelector('.exercise-name').textContent;
                const sets = [];
                
                const setRows = exerciseEl.querySelectorAll('.set-row');
                setRows.forEach((setRow, index) => {
                    const weightInput = setRow.querySelector('input[placeholder*="Weight"]');
                    const repsInput = setRow.querySelector('input[placeholder*="Reps"]');
                    
                    sets.push({
                        setNumber: index + 1,
                        weight: weightInput ? weightInput.value : '',
                        reps: repsInput ? repsInput.value : ''
                    });
                });
                
                exercisesData.push({
                    name: exerciseName,
                    sets: sets
                });
            }
            
            // Log workout completion
            await db.workoutHistory.add({
                date: today,
                type: 'completed',
                templateId: this.selectedWorkoutTemplate,
                exercises: exercisesData,
                createdAt: new Date()
            });
            
            await this.updateDailyCompletion();
            this.renderWorkoutPage();
            this.renderDashboard();
            alert('Workout completed successfully!');
        } catch (error) {
            console.error('Error completing workout:', error);
            alert('Error completing workout. Please try again.');
        }
    },

    async renderWorkoutCalendar() {
        const firstDay = new Date(this.workoutViewMonth.getFullYear(), this.workoutViewMonth.getMonth(), 1);
        const lastDay = new Date(this.workoutViewMonth.getFullYear(), this.workoutViewMonth.getMonth() + 1, 0);
        const today = new Date();
        
        let calendarHTML = '';
        
        // Day headers
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach(day => {
            calendarHTML += `<div class="calendar-day empty"><div class="day-name">${day}</div></div>`;
        });
        
        // Empty days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayDate = new Date(this.workoutViewMonth.getFullYear(), this.workoutViewMonth.getMonth(), i);
            const dateKey = this.formatDate(dayDate);
            let dayClass = 'calendar-day future';
            
            // Check if it's today
            if (i === today.getDate() && this.workoutViewMonth.getMonth() === today.getMonth() && this.workoutViewMonth.getFullYear() === today.getFullYear()) {
                dayClass += ' current';
            }
            
            // Check workout history
            const workoutEntry = await db.workoutHistory.where('date').equals(dateKey).first();
            if (workoutEntry) {
                if (workoutEntry.type === 'completed') {
                    dayClass += ' passed';
                } else if (workoutEntry.type === 'rest') {
                    dayClass += ' warning';
                } else if (workoutEntry.type === 'missed') {
                    dayClass += ' failed';
                }
            }
            
            calendarHTML += `
                <div class="${dayClass}" data-date="${dateKey}">
                    <div class="day-number">${i}</div>
                </div>
            `;
        }
        
        return calendarHTML;
    },

    async renderWorkoutExercises() {
        if (!this.selectedWorkoutTemplate) {
            return `
                <div class="card">
                    <div class="empty-state">
                        <i class="fas fa-dumbbell"></i>
                        <p>Select a workout template to view exercises</p>
                    </div>
                </div>
            `;
        }

        const exercises = await db.workoutExercises
            .where('templateId')
            .equals(this.selectedWorkoutTemplate)
            .toArray();

        if (exercises.length === 0) {
            return `
                <div class="card">
                    <div class="empty-state">
                        <i class="fas fa-dumbbell"></i>
                        <p>No exercises in this template</p>
                        <button class="btn btn-primary mt-20" id="addExerciseBtn">
                            <i class="fas fa-plus"></i> Add Exercise
                        </button>
                    </div>
                </div>
            `;
        }

        let exercisesHTML = '';
        for (const exercise of exercises) {
            exercisesHTML += `
                <div class="exercise-card">
                    <div class="exercise-header">
                        <div class="exercise-name">${exercise.name}</div>
                        <div class="exercise-pr">${exercise.pr ? 'PR: ' + exercise.pr : 'No PR set'}</div>
                    </div>
                    <div class="sets-container">
                        ${this.renderExerciseSets(exercise)}
                    </div>
                    <button class="btn btn-small add-set-btn" data-exercise="${exercise.name}" style="margin-top: 10px;">
                        <i class="fas fa-plus"></i> Add Set
                    </button>
                </div>
            `;
        }

        return `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Today's Exercises</div>
                </div>
                ${exercisesHTML}
            </div>
            <button class="btn btn-primary mt-20" id="completeWorkout">
                <i class="fas fa-check-circle"></i> Complete Workout
            </button>

            <button class="btn btn-secondary mt-10" id="addExerciseBtn">
                <i class="fas fa-plus"></i> Add Exercise
            </button>
        `;
    },

    renderExerciseSets(exercise) {
        let setsHTML = '';
        const targetSets = exercise.targetSets || 3;
        
        for (let i = 1; i <= targetSets; i++) {
            setsHTML += `
                <div class="set-row">
                    <div class="set-number">${i}</div>
                    <div class="set-input">
                        <div class="input-group">
                            <label>Weight</label>
                            <input type="text" placeholder="e.g., 50 lbs" class="exercise-weight">
                        </div>
                        <div class="input-group">
                            <label>Reps</label>
                            <input type="text" placeholder="e.g., 12" class="exercise-reps">
                        </div>
                    </div>
                </div>
            `;
        }
        
        return setsHTML;
    },

    showWorkoutModal() {
        const workoutNameInput = document.getElementById('workoutName');
        if (workoutNameInput) {
            workoutNameInput.value = '';
            this.showModal('workoutModal');
        }
    },

    async saveWorkoutTemplate() {
        const workoutNameInput = document.getElementById('workoutName');
        if (!workoutNameInput) return;

        const name = workoutNameInput.value;

        if (!name) {
            alert('Please enter a workout name');
            return;
        }

        try {
            const templateId = await db.workoutTemplates.add({
                name,
                createdAt: new Date()
            });

            this.selectedWorkoutTemplate = templateId;
            this.hideModal('workoutModal');
            this.renderWorkoutPage();
        } catch (error) {
            console.error('Error saving workout template:', error);
            alert('Error saving workout template. Please try again.');
        }
    },

    showExerciseModal() {
        const exerciseNameInput = document.getElementById('exerciseName');
        const exercisePRInput = document.getElementById('exercisePR');
        const exerciseSetsInput = document.getElementById('exerciseSets');
        const exerciseRepsInput = document.getElementById('exerciseReps');
        
        if (exerciseNameInput && exercisePRInput && exerciseSetsInput && exerciseRepsInput) {
            exerciseNameInput.value = '';
            exercisePRInput.value = '';
            exerciseSetsInput.value = '3';
            exerciseRepsInput.value = '10';
            this.showModal('exerciseModal');
        }
    },

    async saveExercise() {
        const exerciseNameInput = document.getElementById('exerciseName');
        const exercisePRInput = document.getElementById('exercisePR');
        const exerciseSetsInput = document.getElementById('exerciseSets');
        const exerciseRepsInput = document.getElementById('exerciseReps');
        
        if (!exerciseNameInput || !exercisePRInput || !exerciseSetsInput || !exerciseRepsInput) return;

        const name = exerciseNameInput.value;
        const pr = exercisePRInput.value;
        const targetSets = parseInt(exerciseSetsInput.value);
        const targetReps = parseInt(exerciseRepsInput.value);

        if (!name) {
            alert('Please enter an exercise name');
            return;
        }

        try {
            // Get the next order value
            const exercises = await db.workoutExercises
                .where('templateId')
                .equals(this.selectedWorkoutTemplate)
                .toArray();
            
            const nextOrder = exercises.length > 0 ? Math.max(...exercises.map(e => e.order)) + 1 : 1;

            await db.workoutExercises.add({
                templateId: this.selectedWorkoutTemplate,
                name,
                pr,
                order: nextOrder,
                targetSets: targetSets,
                targetReps: targetReps,
                createdAt: new Date()
            });

            this.hideModal('exerciseModal');
            this.renderWorkoutPage();
        } catch (error) {
            console.error('Error saving exercise:', error);
            alert('Error saving exercise. Please try again.');
        }
    },

    async logWorkoutDay(type) {
        const today = this.formatDate(new Date());

        try {
            // Check if entry already exists for today
            const existingEntry = await db.workoutHistory
                .where('date')
                .equals(today)
                .first();

            if (existingEntry) {
                await db.workoutHistory.update(existingEntry.id, {
                    type,
                    createdAt: new Date()
                });
            } else {
                await db.workoutHistory.add({
                    date: today,
                    type,
                    createdAt: new Date()
                });
            }

            await this.updateDailyCompletion();
            this.renderWorkoutPage();
            this.renderDashboard();
            alert(`${type === 'rest' ? 'Rest day' : 'Missed workout'} logged successfully!`);
        } catch (error) {
            console.error('Error logging workout day:', error);
            alert('Error logging workout day. Please try again.');
        }
    },

    async getWorkoutStats() {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const allWorkouts = await db.workoutHistory.toArray();
        const completedWorkouts = allWorkouts.filter(w => w.type === 'completed');
        
        const weeklyCompleted = completedWorkouts.filter(w => {
            const workoutDate = new Date(w.date);
            return workoutDate >= weekStart;
        }).length;
        
        const monthlyCompleted = completedWorkouts.filter(w => {
            const workoutDate = new Date(w.date);
            return workoutDate >= monthStart;
        }).length;
        
        const totalDays = Math.floor((today - monthStart) / (1000 * 60 * 60 * 24)) + 1;
        const consistency = totalDays > 0 ? Math.round((monthlyCompleted / totalDays) * 100) : 0;
        
        // Calculate current streak
        let currentStreak = 0;
        const sortedWorkouts = completedWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date));
        let checkDate = new Date();
        
        for (let i = 0; i < 30; i++) {
            const dateStr = this.formatDate(checkDate);
            const hasWorkout = sortedWorkouts.some(w => w.date === dateStr);
            
            if (hasWorkout) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return {
            weeklyCompleted,
            monthlyCompleted,
            totalCompleted: completedWorkouts.length,
            consistency,
            currentStreak
        };
    },

    // Mood Tracking with Stress and OCD
    async renderMoodPage() {
        const moodEl = document.getElementById('mood');
        const todayMood = await this.getTodayMood();
        const moodHistory = await this.getMoodHistory();

        moodEl.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">How are you feeling today?</div>
                </div>
                <div class="mood-current">
                    ${todayMood ? `
                        <div class="mood-summary">
                            <div class="mood-emoji-large">${this.getMoodEmoji(todayMood.mood)}</div>
                            <div class="mood-details">
                                <div class="mood-date">Today's Mood</div>
                                <div class="mood-metrics">
                                    <div class="mood-metric">Mood: <span>${todayMood.mood}/5</span></div>
                                    <div class="mood-metric">Energy: <span>${todayMood.energy}/5</span></div>
                                    <div class="mood-metric">Stress: <span>${todayMood.stress}/5</span></div>
                                    <div class="mood-metric">OCD: <span>${todayMood.ocd}/5</span></div>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="empty-state">
                            <i class="fas fa-heart"></i>
                            <p>No mood logged today</p>
                            <p>How are you feeling?</p>
                        </div>
                    `}
                </div>
                <button class="btn btn-primary" id="logMoodButton">
                    <i class="fas fa-plus"></i> ${todayMood ? 'Update' : 'Log'} Today's Mood
                </button>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Mood History</div>
                </div>
                <div class="mood-history">
                    ${moodHistory.length > 0 ? moodHistory.map(entry => `
                        <div class="mood-entry">
                            <div class="mood-emoji-large">${this.getMoodEmoji(entry.mood)}</div>
                            <div class="mood-details">
                                <div class="mood-date">${new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                                <div class="mood-metrics">
                                    <div class="mood-metric">Mood: <span>${entry.mood}/5</span></div>
                                    <div class="mood-metric">Energy: <span>${entry.energy}/5</span></div>
                                    <div class="mood-metric">Stress: <span>${entry.stress}/5</span></div>
                                    <div class="mood-metric">OCD: <span>${entry.ocd}/5</span></div>
                                </div>
                                ${entry.notes ? `<div class="mood-notes">${entry.notes}</div>` : ''}
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <p>No mood history yet</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        const logMoodBtn = document.getElementById('logMoodButton');
        if (logMoodBtn) {
            logMoodBtn.addEventListener('click', () => {
                this.showMoodModal();
            });
        }
    },

    getMoodEmoji(mood) {
        const emojis = ['😢', '😔', '😐', '😄', '😊'];
        return emojis[mood - 1] || '😐';
    },

    async getTodayMood() {
        const today = this.formatDate(new Date());
        return await db.moodEntries.where('date').equals(today).first();
    },

    async getMoodHistory() {
        return await db.moodEntries.orderBy('date').reverse().limit(10).toArray();
    },

    showMoodModal(entry = null) {
        const today = this.formatDate(new Date());
        const dateInput = document.getElementById('moodDate');
        const moodInput = document.getElementById('moodLevel');
        const energyInput = document.getElementById('energyLevel');
        const stressInput = document.getElementById('stressLevel');
        const ocdInput = document.getElementById('ocdLevel');
        const notesInput = document.getElementById('moodNotes');

        if (dateInput && moodInput && energyInput && stressInput && ocdInput && notesInput) {
            dateInput.value = entry ? entry.date : today;
            moodInput.value = entry ? entry.mood : 3;
            energyInput.value = entry ? entry.energy : 3;
            stressInput.value = entry ? entry.stress : 3;
            ocdInput.value = entry ? entry.ocd : 3;
            notesInput.value = entry ? entry.notes : '';
            
            this.showModal('moodModal');
        }
    },

    async quickLogMood(mood, energy, stress, ocd) {
        const today = this.formatDate(new Date());
        
        try {
            const existingEntry = await db.moodEntries.where('date').equals(today).first();
            
            if (existingEntry) {
                await db.moodEntries.update(existingEntry.id, {
                    mood,
                    energy,
                    stress,
                    ocd,
                    createdAt: new Date()
                });
            } else {
                await db.moodEntries.add({
                    date: today,
                    mood,
                    energy,
                    stress,
                    ocd,
                    notes: '',
                    createdAt: new Date()
                });
            }
            
            this.renderDashboard();
            this.renderMoodPage();
            alert('Mood logged successfully!');
        } catch (error) {
            console.error('Error logging mood:', error);
            alert('Error logging mood. Please try again.');
        }
    },

    async saveMoodEntry() {
        const dateInput = document.getElementById('moodDate');
        const moodInput = document.getElementById('moodLevel');
        const energyInput = document.getElementById('energyLevel');
        const stressInput = document.getElementById('stressLevel');
        const ocdInput = document.getElementById('ocdLevel');
        const notesInput = document.getElementById('moodNotes');

        if (!dateInput || !moodInput || !energyInput || !stressInput || !ocdInput || !notesInput) return;

        const date = dateInput.value;
        const mood = parseInt(moodInput.value);
        const energy = parseInt(energyInput.value);
        const stress = parseInt(stressInput.value);
        const ocd = parseInt(ocdInput.value);
        const notes = notesInput.value;

        if (!date) {
            alert('Please select a date');
            return;
        }

        try {
            const existingEntry = await db.moodEntries.where('date').equals(date).first();
            
            if (existingEntry) {
                await db.moodEntries.update(existingEntry.id, {
                    mood,
                    energy,
                    stress,
                    ocd,
                    notes,
                    createdAt: new Date()
                });
            } else {
                await db.moodEntries.add({
                    date,
                    mood,
                    energy,
                    stress,
                    ocd,
                    notes,
                    createdAt: new Date()
                });
            }

            this.hideModal('moodModal');
            this.renderDashboard();
            this.renderMoodPage();
        } catch (error) {
            console.error('Error saving mood entry:', error);
            alert('Error saving mood entry. Please try again.');
        }
    },

    // Analytics Page
    async renderAnalyticsPage() {
        const analyticsEl = document.getElementById('analytics');
        
        analyticsEl.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Productivity Overview</div>
                </div>
                <div class="chart-container">
                    <canvas id="productivityChart"></canvas>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Weekly Progress</div>
                </div>
                <div class="chart-container">
                    <canvas id="weeklyChart"></canvas>
                </div>
            </div>
        `;

        // Render simple charts
        this.renderSimpleCharts();
    },

    renderSimpleCharts() {
        // Simple implementation for now
        const productivityCtx = document.getElementById('productivityChart');
        const weeklyCtx = document.getElementById('weeklyChart');

        if (productivityCtx) {
            new Chart(productivityCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Dopamine', 'Workout', 'Hygiene'],
                    datasets: [{
                        data: [70, 60, 80],
                        backgroundColor: ['#405DE6', '#00C851', '#0095F6']
                    }]
                }
            });
        }

        if (weeklyCtx) {
            new Chart(weeklyCtx, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Completion %',
                        data: [80, 70, 90, 60, 85, 75, 95],
                        backgroundColor: '#405DE6'
                    }]
                }
            });
        }
    },

    // Database Page with Delete Functionality
    async renderDatabasePage() {
        const databaseEl = document.getElementById('database');
        
        const dopamineEntries = await db.dopamineEntries.toArray();
        const hygieneHabits = await db.hygieneHabits.toArray();
        const workoutHistory = await db.workoutHistory.toArray();
        const moodEntries = await db.moodEntries.toArray();
        const hygieneCompletions = await db.hygieneCompletions.toArray();

        databaseEl.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Database Viewer</div>
                    <button class="btn btn-secondary" id="clearAllData">
                        <i class="fas fa-trash"></i> Clear All Data
                    </button>
                </div>
                
                <div class="database-section">
                    <h3>Dopamine Entries (${dopamineEntries.length})</h3>
                    <div class="database-table-container">
                        ${dopamineEntries.length > 0 ? dopamineEntries.map(entry => `
                            <div class="database-entry">
                                <div class="entry-main">
                                    <div class="entry-date">${entry.date}</div>
                                    <div class="entry-status ${entry.status === 'passed' ? 'status-passed' : 'status-failed'}">
                                        ${entry.status === 'passed' ? '✅ Successful' : '❌ Challenging'}
                                    </div>
                                </div>
                                <div class="entry-notes">${entry.notes || 'No notes'}</div>
                                <div class="entry-actions">
                                    <button class="btn btn-small btn-secondary edit-entry" data-type="dopamine" data-id="${entry.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-small btn-danger delete-entry" data-type="dopamine" data-id="${entry.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<div class="empty-state">No dopamine entries</div>'}
                    </div>
                </div>

                <div class="database-section">
                    <h3>Hygiene Habits (${hygieneHabits.length})</h3>
                    <div class="database-table-container">
                        ${hygieneHabits.length > 0 ? hygieneHabits.map(habit => `
                            <div class="database-entry">
                                <div class="entry-main">
                                    <div class="entry-name">${habit.name}</div>
                                    <div class="entry-desc">${habit.description}</div>
                                </div>
                                <div class="entry-actions">
                                    <button class="btn btn-small btn-danger delete-entry" data-type="hygiene" data-id="${habit.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<div class="empty-state">No hygiene habits</div>'}
                    </div>
                </div>

                <div class="database-section">
                    <h3>Hygiene Completions (${hygieneCompletions.length})</h3>
                    <div class="database-table-container">
                        ${hygieneCompletions.length > 0 ? hygieneCompletions.map(completion => `
                            <div class="database-entry">
                                <div class="entry-main">
                                    <div class="entry-date">${completion.date}</div>
                                    <div class="entry-status ${completion.completed ? 'status-passed' : 'status-failed'}">
                                        ${completion.completed ? '✅ Completed' : '❌ Missed'}
                                    </div>
                                </div>
                                <div class="entry-actions">
                                    <button class="btn btn-small btn-danger delete-entry" data-type="hygieneCompletion" data-id="${completion.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<div class="empty-state">No hygiene completions</div>'}
                    </div>
                </div>

                <div class="database-section">
                    <h3>Workout History (${workoutHistory.length})</h3>
                    <div class="database-table-container">
                        ${workoutHistory.length > 0 ? workoutHistory.map(history => `
                            <div class="database-entry">
                                <div class="entry-main">
                                    <div class="entry-date">${history.date}</div>
                                    <div class="entry-type ${history.type === 'completed' ? 'status-passed' : history.type === 'rest' ? 'status-warning' : 'status-failed'}">
                                        ${history.type === 'completed' ? '💪 Completed' : history.type === 'rest' ? '😴 Rest Day' : '❌ Missed'}
                                    </div>
                                </div>
                                <div class="entry-actions">
                                    <button class="btn btn-small btn-danger delete-entry" data-type="workout" data-id="${history.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<div class="empty-state">No workout history</div>'}
                    </div>
                </div>

                <div class="database-section">
                    <h3>Mood Entries (${moodEntries.length})</h3>
                    <div class="database-table-container">
                        ${moodEntries.length > 0 ? moodEntries.map(entry => `
                            <div class="database-entry">
                                <div class="entry-main">
                                    <div class="entry-date">${entry.date}</div>
                                    <div class="entry-mood">
                                        Mood: ${this.getMoodEmoji(entry.mood)} ${entry.mood}/5 | 
                                        Energy: ${entry.energy}/5 | 
                                        Stress: ${entry.stress}/5 |
                                        OCD: ${entry.ocd}/5
                                    </div>
                                </div>
                                <div class="entry-notes">${entry.notes || 'No notes'}</div>
                                <div class="entry-actions">
                                    <button class="btn btn-small btn-secondary edit-entry" data-type="mood" data-id="${entry.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-small btn-danger delete-entry" data-type="mood" data-id="${entry.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<div class="empty-state">No mood entries</div>'}
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for delete buttons
        databaseEl.querySelectorAll('.delete-entry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = btn.getAttribute('data-type');
                const id = parseInt(btn.getAttribute('data-id'));
                this.deleteDatabaseEntry(type, id);
            });
        });

        // Add event listeners for edit buttons
        databaseEl.querySelectorAll('.edit-entry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = btn.getAttribute('data-type');
                const id = parseInt(btn.getAttribute('data-id'));
                this.editDatabaseEntry(type, id);
            });
        });

        // Clear all data button
        const clearAllBtn = document.getElementById('clearAllData');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }
    },

    async deleteDatabaseEntry(type, id) {
        if (!confirm('Are you sure you want to delete this entry?')) {
            return;
        }

        try {
            switch (type) {
                case 'dopamine':
                    await db.dopamineEntries.delete(id);
                    break;
                case 'hygiene':
                    await db.hygieneHabits.delete(id);
                    // Also delete related completions
                    await db.hygieneCompletions.where('habitId').equals(id).delete();
                    break;
                case 'hygieneCompletion':
                    await db.hygieneCompletions.delete(id);
                    break;
                case 'workout':
                    await db.workoutHistory.delete(id);
                    break;
                case 'mood':
                    await db.moodEntries.delete(id);
                    break;
            }

            // Re-render the database page
            this.renderDatabasePage();
            
            // Also update other pages if needed
            this.renderDashboard();
            if (type === 'dopamine') this.renderDopaminePage();
            if (type === 'hygiene' || type === 'hygieneCompletion') this.renderHygienePage();
            if (type === 'workout') this.renderWorkoutPage();
            if (type === 'mood') this.renderMoodPage();

            alert('Entry deleted successfully!');
        } catch (error) {
            console.error('Error deleting entry:', error);
            alert('Error deleting entry. Please try again.');
        }
    },

    async editDatabaseEntry(type, id) {
        switch (type) {
            case 'dopamine':
                const dopamineEntry = await db.dopamineEntries.get(id);
                if (dopamineEntry) {
                    this.showDopamineModal(dopamineEntry);
                }
                break;
            case 'mood':
                const moodEntry = await db.moodEntries.get(id);
                if (moodEntry) {
                    this.showMoodModal(moodEntry);
                }
                break;
            default:
                alert('Editing not supported for this entry type');
        }
    },

    async clearAllData() {
        if (!confirm('⚠️ DANGER: This will delete ALL your data permanently! Are you absolutely sure?')) {
            return;
        }

        if (!confirm('❌ This action cannot be undone! All your habits, progress, and history will be lost. Confirm deletion?')) {
            return;
        }

        try {
            // Clear all database tables
            await Promise.all([
                db.dopamineEntries.clear(),
                db.hygieneHabits.clear(),
                db.hygieneCompletions.clear(),
                db.workoutTemplates.clear(),
                db.workoutExercises.clear(),
                db.workoutHistory.clear(),
                db.moodEntries.clear(),
                db.dailyCompletion.clear(),
                db.focusSessions.clear()
            ]);

            // Clear localStorage
            localStorage.clear();

            // Re-initialize default data
            await this.initializeDefaultData();

            // Re-render all pages
            this.renderAllPages();

            alert('All data cleared successfully! The app has been reset to default settings.');
        } catch (error) {
            console.error('Error clearing data:', error);
            alert('Error clearing data. Please try again.');
        }
    },

    // Email Automation with Your Credentials
    async setupEmailAutomation() {
        // Check if we need to send today's report
        const lastReportDate = localStorage.getItem('lastEmailReportDate');
        const today = this.formatDate(new Date());
        
        if (lastReportDate !== today) {
            const now = new Date();
            if (now.getHours() >= 20) {
                await this.sendDailyEmailReport();
                localStorage.setItem('lastEmailReportDate', today);
            }
        }
    },

    showEmailReportModal() {
        const today = this.formatDate(new Date());
        const reportDateEl = document.getElementById('emailReportDate');
        const recipientInput = document.getElementById('emailRecipient');

        if (reportDateEl && recipientInput) {
            reportDateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            recipientInput.value = 'rihazrizvi@gmail.com';
            
            this.generateEmailPreview();
            this.showModal('emailReportModal');
        }
    },

    async generateEmailPreview() {
        const today = this.formatDate(new Date());
        const stats = await this.getDailyStats(today);
        const previewEl = document.getElementById('emailPreview');
        
        if (previewEl) {
            previewEl.innerHTML = `
                <table class="report-table">
                    <tr><th>Metric</th><th>Value</th></tr>
                    <tr><td>Date</td><td>${stats.date}</td></tr>
                    <tr><td>Overall Completion</td><td>${stats.overallCompletion}%</td></tr>
                    <tr><td>Dopamine Control</td><td>${stats.dopamine ? stats.dopamine.status : 'Not logged'}</td></tr>
                    <tr><td>Workout</td><td>${stats.workout ? stats.workout.type : 'Not logged'}</td></tr>
                    <tr><td>Hygiene Completion</td><td>${stats.hygiene.completion}%</td></tr>
                    ${stats.mood ? `
                    <tr><td>Mood</td><td>${stats.mood.mood}/5</td></tr>
                    <tr><td>Energy</td><td>${stats.mood.energy}/5</td></tr>
                    <tr><td>Stress</td><td>${stats.mood.stress}/5</td></tr>
                    <tr><td>OCD</td><td>${stats.mood.ocd}/5</td></tr>
                    ` : ''}
                </table>
            `;
        }
    },

    async sendEmailReport() {
        const recipientInput = document.getElementById('emailRecipient');
        if (!recipientInput) return;

        const recipient = recipientInput.value;
        const today = this.formatDate(new Date());
        const stats = await this.getDailyStats(today);
        
        // Show loading state
        const sendBtn = document.getElementById('sendEmailReport');
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        sendBtn.disabled = true;
        
        try {
            await this.sendEmail(stats, recipient);
            this.hideModal('emailReportModal');
            alert('✅ Daily report sent successfully!');
        } catch (error) {
            console.error('Failed to send email:', error);
            
            // Offer fallback options
            if (confirm(`❌ ${error.message}\n\nWould you like to copy the report to clipboard instead?`)) {
                await this.copyReportToClipboard(stats);
            }
        } finally {
            // Reset button state
            sendBtn.innerHTML = originalText;
            sendBtn.disabled = false;
        }
    },

    async sendDailyEmailReport() {
        const today = this.formatDate(new Date());
        const stats = await this.getDailyStats(today);
        
        try {
            await this.sendEmail(stats, 'rihazrizvi@gmail.com');
            console.log('Daily email report sent successfully');
        } catch (error) {
            console.error('Failed to send daily email report:', error);
        }
    },

    // Fixed Email Sending with Your Template ID
    async sendEmail(stats, recipient) {
        // Prepare template parameters
        const templateParams = {
            to_email: recipient,
            date: stats.date,
            overall_completion: stats.overallCompletion,
            overall_completion_class: stats.overallCompletion >= 80 ? 'good' : 'bad',
            dopamine_status: stats.dopamine ? stats.dopamine.status : 'Not logged',
            workout_status: stats.workout ? stats.workout.type : 'Not logged',
            hygiene_completion: stats.hygiene.completion,
            mood_section: stats.mood ? `
                <tr><td>Mood</td><td>${stats.mood.mood}/5</td></tr>
                <tr><td>Energy</td><td>${stats.mood.energy}/5</td></tr>
                <tr><td>Stress</td><td>${stats.mood.stress}/5</td></tr>
                <tr><td>OCD</td><td>${stats.mood.ocd}/5</td></tr>
            ` : ''
        };

        try {
            // Using your actual EmailJS credentials
            const response = await emailjs.send(
                'service_c3ur38h', 
                'template_jgtfg7q', // Your template ID
                templateParams
            );
            
            console.log('Email sent successfully:', response);
            return response;
        } catch (error) {
            console.error('Email sending failed:', error);
            
            // Provide more specific error messages
            if (error.text && error.text.includes('Template not found')) {
                throw new Error('Email template not found. Please check your template ID.');
            } else if (error.text && error.text.includes('Service not found')) {
                throw new Error('Email service not found. Please check your service ID.');
            } else {
                throw new Error('Failed to send email. Please check your internet connection and try again.');
            }
        }
    },

    // Fallback: Copy report to clipboard
    async copyReportToClipboard(stats) {
        const reportText = this.formatStatsForTable(stats);
        
        try {
            await navigator.clipboard.writeText(reportText);
            alert('📋 Report copied to clipboard! You can now paste it into Google Sheets or any other application.');
        } catch (clipboardError) {
            console.error('Clipboard failed:', clipboardError);
            
            // Final fallback: show in alert
            alert('📋 Report Text:\n\n' + reportText + '\n\nYou can manually copy this text.');
        }
    },

    formatStatsForTable(stats) {
        let table = "Metric|Value\n";
        table += "-----|-----\n";
        table += `Date|${stats.date}\n`;
        table += `Overall Completion|${stats.overallCompletion}%\n`;
        table += `Dopamine Control|${stats.dopamine ? stats.dopamine.status : 'Not logged'}\n`;
        table += `Workout|${stats.workout ? stats.workout.type : 'Not logged'}\n`;
        table += `Hygiene Completion|${stats.hygiene.completion}%\n`;
        
        if (stats.mood) {
            table += `Mood|${stats.mood.mood}/5\n`;
            table += `Energy|${stats.mood.energy}/5\n`;
            table += `Stress|${stats.mood.stress}/5\n`;
            table += `OCD|${stats.mood.ocd}/5\n`;
        }
        
        return table;
    },

    async getDailyStats(date) {
        const dopamineEntry = await db.dopamineEntries.where('date').equals(date).first();
        const workoutEntry = await db.workoutHistory.where('date').equals(date).first();
        const hygieneCompletion = await this.calculateHygieneCompletion(date);
        const moodEntry = await db.moodEntries.where('date').equals(date).first();

        // Format status for better display
        const formatDopamineStatus = (entry) => {
            if (!entry) return 'Not logged';
            return entry.status === 'passed' ? '✅ Successful' : '❌ Challenging';
        };

        const formatWorkoutStatus = (entry) => {
            if (!entry) return 'Not logged';
            switch (entry.type) {
                case 'completed': return '💪 Completed';
                case 'rest': return '😴 Rest Day';
                case 'missed': return '❌ Missed';
                default: return entry.type;
            }
        };

        return {
            date,
            dopamine: dopamineEntry ? {
                status: formatDopamineStatus(dopamineEntry),
                notes: dopamineEntry.notes
            } : null,
            workout: workoutEntry ? {
                type: formatWorkoutStatus(workoutEntry),
                duration: workoutEntry.duration
            } : null,
            hygiene: {
                completion: hygieneCompletion,
                totalHabits: (await db.hygieneHabits.toArray()).length
            },
            mood: moodEntry ? {
                mood: moodEntry.mood,
                energy: moodEntry.energy,
                stress: moodEntry.stress,
                ocd: moodEntry.ocd,
                notes: moodEntry.notes
            } : null,
            overallCompletion: await this.calculateTodayCompletion(date)
        };
    },

    // Fixed Calculation methods
    async calculateCurrentStreak() {
        const entries = await db.dopamineEntries.orderBy('date').reverse().toArray();
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Start from today and go backwards
        let checkDate = new Date(today);
        
        while (true) {
            const dateKey = this.formatDate(checkDate);
            const entry = entries.find(e => e.date === dateKey);
            
            if (entry && entry.status === 'passed') {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return currentStreak;
    },

    async calculateLongestStreak() {
        const entries = await db.dopamineEntries.orderBy('date').toArray();
        let longestStreak = 0;
        let currentStreak = 0;
        
        // Sort by date ascending
        entries.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        for (const entry of entries) {
            if (entry.status === 'passed') {
                currentStreak++;
                longestStreak = Math.max(longestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }
        
        return longestStreak;
    },

    // FIXED: Correct total progress calculation
    async calculateTodayCompletion(date) {
        let totalScore = 0;
        let maxScore = 0;
        
        // Dopamine: 40% weight - only count if passed
        const dopamineEntry = await db.dopamineEntries.where('date').equals(date).first();
        if (dopamineEntry && dopamineEntry.status === 'passed') {
            totalScore += 40;
        }
        maxScore += 40;
        
        // Workout: 30% weight - count if completed or rest day
        const workoutEntry = await db.workoutHistory.where('date').equals(date).first();
        if (workoutEntry && (workoutEntry.type === 'completed' || workoutEntry.type === 'rest')) {
            totalScore += 30;
        }
        maxScore += 30;
        
        // Hygiene: 30% weight - proportional to completion rate
        const hygieneCompletion = await this.calculateHygieneCompletion(date);
        totalScore += (hygieneCompletion / 100) * 30;
        maxScore += 30;
        
        return Math.round((totalScore / maxScore) * 100);
    },

    async updateDailyCompletion() {
        const today = this.formatDate(new Date());
        const dopamineCompleted = await this.isDopamineCompletedToday();
        const workoutCompleted = await this.isWorkoutCompletedToday();
        const hygieneCompleted = await this.calculateHygieneCompletion(today) >= 50;
        const totalCompletion = await this.calculateTodayCompletion(today);
        
        const existing = await db.dailyCompletion.where('date').equals(today).first();
        
        if (existing) {
            await db.dailyCompletion.update(existing.id, {
                dopamineCompleted,
                workoutCompleted,
                hygieneCompleted,
                totalCompletion,
                createdAt: new Date()
            });
        } else {
            await db.dailyCompletion.add({
                date: today,
                dopamineCompleted,
                workoutCompleted,
                hygieneCompleted,
                totalCompletion,
                createdAt: new Date()
            });
        }
    },

    async isDopamineCompletedToday() {
        const today = this.formatDate(new Date());
        const entry = await db.dopamineEntries.where('date').equals(today).first();
        return entry && entry.status === 'passed';
    },

    async isWorkoutCompletedToday() {
        const today = this.formatDate(new Date());
        const entry = await db.workoutHistory.where('date').equals(today).first();
        return entry && (entry.type === 'completed' || entry.type === 'rest');
    },

    // Initialize all pages
    renderAllPages() {
        this.renderDashboard();
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    LifeTrackerApp.init();
});

// Add CSS for new elements
const additionalStyles = `
    .status-warning {
        background: #FF9800;
        color: black;
    }
    
    .status-missing {
        background: #666;
        color: white;
    }
    
    .day-section {
        margin-bottom: 20px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
    }
    
    .status-badge {
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        display: inline-block;
    }
    
    .mini-calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        font-size: 10px;
    }
    
    .mini-calendar-header {
        text-align: center;
        font-weight: bold;
        color: #888;
        padding: 2px;
    }
    
    .mini-calendar-day {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.1);
        cursor: pointer;
        font-size: 9px;
    }
    
    .mini-calendar-day.today {
        border: 1px solid #0095F6;
    }
    
    .mini-calendar-day.completed {
        background: #4CAF50;
        color: white;
    }
    
    .mini-calendar-day.missed {
        background: #F44336;
        color: white;
    }
    
    .mini-calendar-day.empty {
        background: transparent;
        cursor: default;
    }
    
    .habit-calendar {
        margin-bottom: 15px;
    }
    
    .add-set-btn {
        padding: 8px 12px;
        font-size: 12px;
    }
    
    .delete-template {
        opacity: 0.7;
        transition: opacity 0.3s;
    }
    
    .delete-template:hover {
        opacity: 1;
    }
    
    .day-completion {
        font-size: 8px;
        color: rgba(255, 255, 255, 0.7);
    }
    
    .exercise-weight, .exercise-reps {
        width: 80px;
        padding: 5px;
        border: 1px solid #333;
        border-radius: 4px;
        background: #1a1a1a;
        color: white;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
