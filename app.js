// app.js - Fixed and Enhanced Supercharged Life Tracker Pro
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

    // Enhanced Dashboard with Fixed Streak Calculation
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
                        <div class="stat-value" id="workoutStatus" style="color: #FF9800;">${await this.getTodayWorkoutStatus()}</div>
                        <div class="stat-label" style="color: #888;">Workout</div>
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
                    <div class="mood-btn" data-mood="5" data-energy="5" data-numb="1" data-stress="1" data-ocd="1">
                        <div class="mood-emoji">😊</div>
                        <div class="mood-label">Great</div>
                    </div>
                    <div class="mood-btn" data-mood="4" data-energy="4" data-numb="2" data-stress="2" data-ocd="2">
                        <div class="mood-emoji">😄</div>
                        <div class="mood-label">Good</div>
                    </div>
                    <div class="mood-btn" data-mood="3" data-energy="3" data-numb="3" data-stress="3" data-ocd="3">
                        <div class="mood-emoji">😐</div>
                        <div class="mood-label">Okay</div>
                    </div>
                    <div class="mood-btn" data-mood="2" data-energy="2" data-numb="4" data-stress="4" data-ocd="4">
                        <div class="mood-emoji">😔</div>
                        <div class="mood-label">Low</div>
                    </div>
                    <div class="mood-btn" data-mood="1" data-energy="1" data-numb="5" data-stress="5" data-ocd="5">
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
                const numb = parseInt(btn.getAttribute('data-numb'));
                const stress = parseInt(btn.getAttribute('data-stress'));
                const ocd = parseInt(btn.getAttribute('data-ocd'));
                this.quickLogMood(mood, energy, numb, stress, ocd);
            });
        });

        this.renderDashboardCalendar();
    },

    async getTodayWorkoutStatus() {
        const today = this.formatDate(new Date());
        const workoutEntry = await db.workoutHistory.where('date').equals(today).first();
        
        if (!workoutEntry) return 'Not Logged';
        if (workoutEntry.type === 'completed') return '✅ Done';
        if (workoutEntry.type === 'rest') return '😴 Rest';
        if (workoutEntry.type === 'missed') return '❌ Missed';
        return 'Not Logged';
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

    // FIXED: Current Streak Calculation
    async calculateCurrentStreak() {
        try {
            const entries = await db.dopamineEntries.orderBy('date').reverse().toArray();
            let currentStreak = 0;
            const today = new Date();
            
            // Start from today and go backwards
            for (let i = 0; i < 365; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() - i);
                const dateKey = this.formatDate(checkDate);
                
                const entry = entries.find(e => e.date === dateKey);
                
                if (entry && entry.status === 'passed') {
                    currentStreak++;
                } else if (entry && entry.status === 'failed') {
                    // If we find a failed day, streak breaks
                    break;
                } else {
                    // If no entry for the day, check if it's today
                    // For today, if no entry yet, don't break the streak
                    // For past days, if no entry, break the streak
                    if (i > 0) {
                        break;
                    }
                }
            }
            
            return currentStreak;
        } catch (error) {
            console.error('Error calculating current streak:', error);
            return 0;
        }
    },

    // FIXED: Longest Streak Calculation
    async calculateLongestStreak() {
        try {
            const entries = await db.dopamineEntries.orderBy('date').toArray();
            let longestStreak = 0;
            let currentStreak = 0;
            
            // Sort entries by date ascending
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
        } catch (error) {
            console.error('Error calculating longest streak:', error);
            return 0;
        }
    },

    // FIXED: Today's Progress Calculation
    async calculateTodayCompletion(date) {
        let totalScore = 0;
        let maxPossibleScore = 0;

        // 1. Dopamine Status (40% weight)
        const dopamineEntry = await db.dopamineEntries.where('date').equals(date).first();
        if (dopamineEntry && dopamineEntry.status === 'passed') {
            totalScore += 40; // Full points for passed day
        }
        // If failed or no entry, get 0 points
        maxPossibleScore += 40;

        // 2. Workout Status (30% weight)
        const workoutEntry = await db.workoutHistory.where('date').equals(date).first();
        if (workoutEntry) {
            if (workoutEntry.type === 'completed') {
                totalScore += 30; // Full points for completed workout
            } else if (workoutEntry.type === 'rest') {
                totalScore += 20; // Partial points for rest day
            }
            // If missed, get 0 points
        }
        maxPossibleScore += 30;

        // 3. Hygiene Habits (30% weight)
        const habits = await db.hygieneHabits.toArray();
        const completions = await db.hygieneCompletions.where('date').equals(date).toArray();
        
        if (habits.length > 0) {
            let completedHabits = 0;
            habits.forEach(habit => {
                const completion = completions.find(c => c.habitId === habit.id);
                if (completion && completion.completed) {
                    completedHabits++;
                }
            });
            
            const hygienePercentage = (completedHabits / habits.length) * 100;
            totalScore += (hygienePercentage / 100) * 30; // Scale to 30 points
        }
        maxPossibleScore += 30;

        return Math.round((totalScore / maxPossibleScore) * 100);
    },

    // Enhanced Workout Page with Weight/Reps Tracking
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

        // Get last workout data for pre-population
        const lastWorkout = await this.getLastWorkoutForTemplate(this.selectedWorkoutTemplate);

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
            // Get last sets for this exercise if available
            const lastExerciseData = lastWorkout ? 
                lastWorkout.exercises.find(ex => ex.name === exercise.name) : null;
            
            exercisesHTML += `
                <div class="exercise-card" data-exercise-id="${exercise.id}">
                    <div class="exercise-header">
                        <div class="exercise-name">${exercise.name}</div>
                        <div class="exercise-pr">${exercise.pr ? 'PR: ' + exercise.pr : 'No PR set'}</div>
                    </div>
                    <div class="sets-container" id="sets-${exercise.id}">
                        ${this.renderExerciseSets(exercise, lastExerciseData)}
                    </div>
                    <button class="btn btn-small add-set-btn" data-exercise-id="${exercise.id}" style="margin-top: 10px;">
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

    async getLastWorkoutForTemplate(templateId) {
        const workouts = await db.workoutHistory
            .where('templateId')
            .equals(templateId)
            .and(workout => workout.type === 'completed')
            .reverse()
            .sortBy('date');
        
        return workouts.length > 0 ? workouts[0] : null;
    },

    renderExerciseSets(exercise, lastExerciseData = null) {
        let setsHTML = '';
        const targetSets = exercise.targetSets || 3;
        
        for (let i = 1; i <= targetSets; i++) {
            const lastSet = lastExerciseData && lastExerciseData.sets[i-1] ? lastExerciseData.sets[i-1] : {};
            
            setsHTML += `
                <div class="set-row">
                    <div class="set-number">Set ${i}</div>
                    <div class="set-input">
                        <div class="input-group">
                            <label>Weight (lbs)</label>
                            <input type="number" class="weight-input" placeholder="e.g., 50" value="${lastSet.weight || ''}" min="0" step="0.5">
                        </div>
                        <div class="input-group">
                            <label>Reps</label>
                            <input type="number" class="reps-input" placeholder="e.g., 12" value="${lastSet.reps || ''}" min="0">
                        </div>
                    </div>
                </div>
            `;
        }
        
        return setsHTML;
    },

    setupWorkoutEventListeners() {
        const addTemplateBtn = document.getElementById('addWorkoutTemplate');
        const logRestDayBtn = document.getElementById('logRestDay');
        const logMissedBtn = document.getElementById('logMissedWorkout');
        const prevMonthBtn = document.getElementById('prevWorkoutMonth');
        const nextMonthBtn = document.getElementById('nextWorkoutMonth');
        const addExerciseBtn = document.getElementById('addExerciseBtn');
        const completeWorkoutBtn = document.getElementById('completeWorkout');

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

        if (addExerciseBtn) {
            addExerciseBtn.addEventListener('click', () => {
                this.showExerciseModal();
            });
        }

        if (completeWorkoutBtn) {
            completeWorkoutBtn.addEventListener('click', () => {
                this.completeWorkout();
            });
        }

        // Add set buttons
        document.querySelectorAll('.add-set-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exerciseId = parseInt(btn.getAttribute('data-exercise-id'));
                this.addSetToExercise(exerciseId);
            });
        });
    },

    addSetToExercise(exerciseId) {
        const setsContainer = document.getElementById(`sets-${exerciseId}`);
        if (!setsContainer) return;

        const setCount = setsContainer.querySelectorAll('.set-row').length + 1;
        
        const newSetHTML = `
            <div class="set-row">
                <div class="set-number">Set ${setCount}</div>
                <div class="set-input">
                    <div class="input-group">
                        <label>Weight (lbs)</label>
                        <input type="number" class="weight-input" placeholder="e.g., 50" min="0" step="0.5">
                    </div>
                    <div class="input-group">
                        <label>Reps</label>
                        <input type="number" class="reps-input" placeholder="e.g., 12" min="0">
                    </div>
                </div>
            </div>
        `;
        
        setsContainer.insertAdjacentHTML('beforeend', newSetHTML);
    },

    async completeWorkout() {
        const today = this.formatDate(new Date());
        
        try {
            // Collect all exercise data with sets
            const exerciseElements = document.querySelectorAll('.exercise-card');
            const exercisesData = [];
            
            for (const exerciseEl of exerciseElements) {
                const exerciseId = parseInt(exerciseEl.getAttribute('data-exercise-id'));
                const exerciseName = exerciseEl.querySelector('.exercise-name').textContent;
                const sets = [];
                
                const setRows = exerciseEl.querySelectorAll('.set-row');
                setRows.forEach((setRow, index) => {
                    const weightInput = setRow.querySelector('.weight-input');
                    const repsInput = setRow.querySelector('.reps-input');
                    
                    const weight = weightInput ? parseFloat(weightInput.value) : null;
                    const reps = repsInput ? parseInt(repsInput.value) : null;
                    
                    // Only include sets that have at least weight or reps filled
                    if (weight || reps) {
                        sets.push({
                            setNumber: index + 1,
                            weight: weight,
                            reps: reps
                        });
                    }
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
            alert('Workout completed successfully! All sets saved.');
        } catch (error) {
            console.error('Error completing workout:', error);
            alert('Error completing workout. Please try again.');
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
        hygieneEl.querySelectorAll('.mini-calendar-day').forEach(day => {
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
            const isPast = dayDate < new Date().setHours(0,0,0,0);
            
            let dayClass = 'mini-calendar-day';
            if (isToday) dayClass += ' today';
            if (isCompleted) {
                dayClass += ' completed';
            } else if (isPast) {
                dayClass += ' missed'; // Red for missed habits in past days
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

    // Enhanced Mood Tracking with Stress and OCD
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
                                    <div class="mood-metric">Numbness: <span>${todayMood.numb}/5</span></div>
                                    ${todayMood.stress ? `<div class="mood-metric">Stress: <span>${todayMood.stress}/5</span></div>` : ''}
                                    ${todayMood.ocd ? `<div class="mood-metric">OCD: <span>${todayMood.ocd}/5</span></div>` : ''}
                                </div>
                                ${todayMood.notes ? `<div class="mood-notes">${todayMood.notes}</div>` : ''}
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
                                    <div class="mood-metric">Numbness: <span>${entry.numb}/5</span></div>
                                    ${entry.stress ? `<div class="mood-metric">Stress: <span>${entry.stress}/5</span></div>` : ''}
                                    ${entry.ocd ? `<div class="mood-metric">OCD: <span>${entry.ocd}/5</span></div>` : ''}
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

    showMoodModal(entry = null) {
        const today = this.formatDate(new Date());
        const dateInput = document.getElementById('moodDate');
        const moodInput = document.getElementById('moodLevel');
        const energyInput = document.getElementById('energyLevel');
        const numbInput = document.getElementById('numbLevel');
        const stressInput = document.getElementById('stressLevel');
        const ocdInput = document.getElementById('ocdLevel');
        const notesInput = document.getElementById('moodNotes');

        if (dateInput && moodInput && energyInput && numbInput && notesInput) {
            dateInput.value = entry ? entry.date : today;
            moodInput.value = entry ? entry.mood : 3;
            energyInput.value = entry ? entry.energy : 3;
            numbInput.value = entry ? entry.numb : 3;
            stressInput.value = entry ? (entry.stress || 3) : 3;
            ocdInput.value = entry ? (entry.ocd || 3) : 3;
            notesInput.value = entry ? entry.notes : '';
            
            this.showModal('moodModal');
        }
    },

    async quickLogMood(mood, energy, numb, stress = 3, ocd = 3) {
        const today = this.formatDate(new Date());
        
        try {
            const existingEntry = await db.moodEntries.where('date').equals(today).first();
            
            if (existingEntry) {
                await db.moodEntries.update(existingEntry.id, {
                    mood,
                    energy,
                    numb,
                    stress,
                    ocd,
                    createdAt: new Date()
                });
            } else {
                await db.moodEntries.add({
                    date: today,
                    mood,
                    energy,
                    numb,
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
        const numbInput = document.getElementById('numbLevel');
        const stressInput = document.getElementById('stressLevel');
        const ocdInput = document.getElementById('ocdLevel');
        const notesInput = document.getElementById('moodNotes');

        if (!dateInput || !moodInput || !energyInput || !numbInput || !notesInput) return;

        const date = dateInput.value;
        const mood = parseInt(moodInput.value);
        const energy = parseInt(energyInput.value);
        const numb = parseInt(numbInput.value);
        const stress = stressInput ? parseInt(stressInput.value) : 3;
        const ocd = ocdInput ? parseInt(ocdInput.value) : 3;
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
                    numb,
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
                    numb,
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

    // Other methods remain the same but with updated database schema
    // ... (rest of the methods like updateDailyCompletion, getWorkoutStats, etc.)

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
    
    .set-row {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
    }
    
    .set-number {
        font-weight: bold;
        margin-right: 15px;
        min-width: 50px;
    }
    
    .set-input {
        display: flex;
        gap: 15px;
        flex: 1;
    }
    
    .input-group {
        flex: 1;
    }
    
    .input-group label {
        display: block;
        font-size: 12px;
        color: #888;
        margin-bottom: 5px;
    }
    
    .input-group input {
        width: 100%;
        padding: 8px;
        border: 1px solid #333;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
