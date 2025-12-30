// ===================================
// WORDUP GAME ENGINE - CORE
// Version: 2.0 (Refactored)
// Safari 11.1+ Compatible
// ===================================

// ===================================
// DEFAULT CONFIGURATION
// ===================================

var DEFAULT_CONFIG = {
    theme: {
        name: 'blue',
        colors: {
            gradientStart: '#1e3a8a',
            gradientEnd: '#3b82f6',
            primary: '#3b82f6',
            pieceBackground: 'white'
        }
    },
    gameSettings: {
        snapDistance: 150,
        snapTolerance: 5,
        completionDelay: 350,
        cellSize: {
            desktop: 50,
            tablet: 40,
            mobile: 35
        }
    }
};

// ===================================
// GAME STATE
// ===================================

var puzzleConfig = null;
var gameSettings = null;
var CELL_SIZE = 50;
var SNAP_DISTANCE = 150;
var SNAP_TOLERANCE = 5;
var COMPLETION_DELAY = 350;
var GRID_SIZE = 10; // Snap to 10px grid for organized alignment

var pieces = [];
var completedWords = new Set();
var audioUnlocked = false;

// DOM Elements (initialized on load)
var gameArea = null;
var puzzleDescription = null;
var victoryModal = null;
var factsList = null;
var successSound = null;

// ===================================
// UTILITY FUNCTIONS
// ===================================

function snapToGrid(value) {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function getPieceData(pieceElement) {
    var index = parseInt(pieceElement.dataset.pieceIndex, 10);
    return pieces[index];
}

function setPiecePosition(pieceData, x, y) {
    pieceData.x = x;
    pieceData.y = y;
    pieceData.element.style.left = x + 'px';
    pieceData.element.style.top = y + 'px';
}

function getPieceRect(pieceData) {
    var left = pieceData.x;
    var top = pieceData.y;
    var width = pieceData.width;
    var height = pieceData.height;

    if (left === undefined || left === null) {
        left = pieceData.element.offsetLeft;
    }

    if (top === undefined || top === null) {
        top = pieceData.element.offsetTop;
    }

    if (!width) {
        width = pieceData.element.offsetWidth;
    }

    if (!height) {
        height = pieceData.element.offsetHeight;
    }

    return {
        left: left,
        top: top,
        right: left + width,
        bottom: top + height,
        width: width,
        height: height
    };
}

function getCellSizeForViewport() {
    var width = window.innerWidth;
    if (width <= 480) return gameSettings.cellSize.mobile;
    if (width <= 768) return gameSettings.cellSize.tablet;
    return gameSettings.cellSize.desktop;
}

// Unlock audio for mobile Safari (requires user gesture)
function unlockAudio() {
    if (audioUnlocked || !successSound) return;

    // Play and immediately pause to unlock audio context
    successSound.play().then(function() {
        successSound.pause();
        successSound.currentTime = 0;
        audioUnlocked = true;
        console.log('🔊 Audio unlocked for mobile Safari');
    }).catch(function(err) {
        console.log('Audio unlock attempt (will retry on next interaction):', err);
    });
}

// Safari 11.1 compatible deep merge (no spread operator)
function mergeConfig(defaults, overrides) {
    var result = Object.assign({}, defaults);

    if (!overrides) return result;

    // Merge top-level properties
    Object.keys(overrides).forEach(function(key) {
        if (overrides[key] && typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
            // Deep merge for nested objects
            result[key] = Object.assign({}, defaults[key] || {}, overrides[key]);

            // Handle nested levels (e.g., theme.colors, gameSettings.cellSize)
            Object.keys(overrides[key]).forEach(function(nestedKey) {
                if (overrides[key][nestedKey] && typeof overrides[key][nestedKey] === 'object' && !Array.isArray(overrides[key][nestedKey])) {
                    result[key][nestedKey] = Object.assign({}, (defaults[key] && defaults[key][nestedKey]) || {}, overrides[key][nestedKey]);
                }
            });
        } else {
            result[key] = overrides[key];
        }
    });

    return result;
}

// ===================================
// INITIALIZATION
// ===================================

async function init() {
    console.log('🎮 Initializing WordUp Game Engine v2.0...');

    // Cache DOM elements
    gameArea = document.getElementById('game-area');
    puzzleDescription = document.getElementById('puzzle-description');
    victoryModal = document.getElementById('victory-modal');
    factsList = document.getElementById('facts-list');
    successSound = document.getElementById('success-sound');

    // Force browser to complete layout
    void gameArea.offsetHeight;

    try {
        await loadConfig();

        // Apply theme colors
        applyTheme();

        // Set cell size based on viewport
        CELL_SIZE = getCellSizeForViewport();
        SNAP_DISTANCE = gameSettings.snapDistance;
        SNAP_TOLERANCE = gameSettings.snapTolerance;
        COMPLETION_DELAY = gameSettings.completionDelay;

        console.log('📏 Cell size: ' + CELL_SIZE + 'px | Viewport: ' + window.innerWidth + 'x' + window.innerHeight + 'px');
        console.log('⚙️ Snap distance: ' + SNAP_DISTANCE + 'px | Tolerance: ' + SNAP_TOLERANCE + 'px');
        console.log('📐 Game area: ' + gameArea.offsetWidth + 'x' + gameArea.offsetHeight + 'px');

        // Small delay to ensure layout is stable
        await new Promise(function(resolve) { setTimeout(resolve, 50); });

        createPieces();
        setupEventListeners();

        console.log('✅ Game initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing game:', error);
        gameArea.innerHTML = '<div class="loading">Error loading puzzle. Please refresh the page.</div>';
    }
}

// ===================================
// CONFIG LOADING
// ===================================

async function loadConfig() {
    console.log('📥 Loading puzzle configuration...');

    try {
        // Load puzzle.json (required - contains word data)
        var puzzleResponse = await fetch('puzzle.json');
        if (!puzzleResponse.ok) {
            throw new Error('HTTP error loading puzzle.json! status: ' + puzzleResponse.status);
        }
        var puzzleData = await puzzleResponse.json();

        // Try to load config.json (optional - contains theme and settings overrides)
        var configOverrides = {};
        try {
            var configResponse = await fetch('config.json');
            if (configResponse.ok) {
                configOverrides = await configResponse.json();
                console.log('⚙️ Config overrides loaded from config.json');
            }
        } catch (configError) {
            console.log('ℹ️ No config.json found, using defaults');
        }

        // Merge: DEFAULT_CONFIG + config.json + puzzle.json
        var mergedConfig = mergeConfig(DEFAULT_CONFIG, configOverrides);
        puzzleConfig = Object.assign({}, mergedConfig, {
            title: puzzleData.title,
            description: puzzleData.description,
            words: puzzleData.words
        });
        gameSettings = puzzleConfig.gameSettings;

        console.log('📊 Puzzle loaded: ' + puzzleConfig.title);
        console.log('📝 Words in puzzle: ' + puzzleConfig.words.length);
        console.log('🎨 Theme: ' + puzzleConfig.theme.name);

        // Update UI with puzzle info
        puzzleDescription.textContent = puzzleConfig.description;

        return puzzleConfig;
    } catch (error) {
        console.error('❌ Failed to load configuration:', error);
        throw error;
    }
}

// ===================================
// THEME APPLICATION
// ===================================

function applyTheme() {
    var colors = puzzleConfig.theme.colors;

    // Extract RGB values from completed border color for semi-transparent divider
    // This ensures the cell divider matches the theme
    var completedBorderRgb = colors.completedBorder || colors.primary;

    var style = document.createElement('style');
    style.textContent =
        ':root {' +
        '  --primary-color: ' + colors.primary + ';' +
        '  --primary-dark: ' + (colors.primaryDark || colors.primary) + ';' +
        '  --primary-hover: ' + (colors.primaryHover || colors.primary) + ';' +
        '  --gradient-start: ' + colors.gradientStart + ';' +
        '  --gradient-end: ' + colors.gradientEnd + ';' +
        '  --piece-bg: ' + colors.pieceBackground + ';' +
        '  --completed-bg: ' + (colors.completedBg || '#e0e7ff') + ';' +
        '  --completed-border: ' + (colors.completedBorder || colors.primary) + ';' +
        '  --text-dark: ' + (colors.textDark || '#1e40af') + ';' +
        '}';
    document.head.appendChild(style);

    console.log('🎨 Theme applied: ' + puzzleConfig.theme.name);
}

// ===================================
// PIECE CREATION
// ===================================

function createPieces() {
    console.log('🎨 Creating puzzle pieces...');

    pieces = [];
    gameArea.innerHTML = ''; // Clear existing pieces

    var gameAreaRect = gameArea.getBoundingClientRect();
    var placedPieces = []; // Track placed pieces to avoid overlap

    puzzleConfig.words.forEach(function(wordData, wordIndex) {
        console.log('📦 Creating pieces for word: ' + wordData.word);

        var orientation = wordData.orientation || 'horizontal';

        wordData.fragments.forEach(function(fragment, fragmentIndex) {
            var piece = createPieceElement(fragment, wordData.word, wordIndex, fragmentIndex, orientation);

            // Calculate piece dimensions based on orientation
            var pieceWidth, pieceHeight;
            if (orientation === 'vertical') {
                pieceWidth = CELL_SIZE;
                pieceHeight = fragment.length * CELL_SIZE;
            } else {
                pieceWidth = fragment.length * CELL_SIZE;
                pieceHeight = CELL_SIZE;
            }

            // Calculate safe bounds with proper margins
            var margin = 30;
            var minX = margin;
            var maxX = gameAreaRect.width - pieceWidth - margin;
            var minY = margin;
            var maxY = gameAreaRect.height - pieceHeight - margin;

            // Ensure maxX and maxY are valid
            if (maxX < minX || maxY < minY) {
                console.warn('⚠️ Piece "' + fragment + '" (' + pieceWidth + 'x' + pieceHeight + 'px) is too large for game area');
            }

            // Try to find a non-overlapping position
            var randomX, randomY, attempts = 0;
            var overlapping = true;

            while (overlapping && attempts < 50) {
                randomX = Math.max(minX, Math.min(maxX, minX + Math.random() * (maxX - minX)));
                randomY = Math.max(minY, Math.min(maxY, minY + Math.random() * (maxY - minY)));

                // Snap to grid for perfect alignment
                randomX = snapToGrid(randomX);
                randomY = snapToGrid(randomY);

                // Check if this position overlaps with any placed pieces
                overlapping = placedPieces.some(function(placed) {
                    var horizontalOverlap = randomX < placed.right && (randomX + pieceWidth) > placed.left;
                    var verticalOverlap = randomY < placed.bottom && (randomY + pieceHeight) > placed.top;
                    return horizontalOverlap && verticalOverlap;
                });

                attempts++;
            }

            // If still overlapping after 50 attempts, just place it (rare case)
            if (overlapping) {
                console.log('  ⚠️ Could not find non-overlapping spot for "' + fragment + '" after 50 attempts');
            }

            var pieceData = {
                element: piece,
                fragment: fragment,
                word: wordData.word,
                wordIndex: wordIndex,
                orientation: orientation,
                completed: false,
                width: pieceWidth,
                height: pieceHeight,
                x: randomX,
                y: randomY
            };

            piece.dataset.pieceIndex = pieces.length;
            setPiecePosition(pieceData, randomX, randomY);

            // Track this piece's position
            placedPieces.push({
                left: randomX,
                top: randomY,
                right: randomX + pieceWidth,
                bottom: randomY + pieceHeight
            });

            console.log('  ✓ Piece "' + fragment + '" (' + pieceWidth + 'x' + pieceHeight + 'px ' + orientation + ') at (' + randomX.toFixed(0) + ', ' + randomY.toFixed(0) + ')');

            pieces.push(pieceData);

            gameArea.appendChild(piece);
        });
    });

    console.log('✅ Created ' + pieces.length + ' total pieces');
}

function createPieceElement(fragment, word, wordIndex, fragmentIndex, orientation) {
    var piece = document.createElement('div');
    piece.className = 'piece';
    piece.draggable = true;

    // Store data attributes
    piece.dataset.fragment = fragment;
    piece.dataset.word = word;
    piece.dataset.wordIndex = wordIndex;
    piece.dataset.fragmentIndex = fragmentIndex;
    piece.dataset.orientation = orientation || 'horizontal';

    if (orientation === 'vertical') {
        // Vertical pieces - letters stacked top to bottom
        piece.style.width = CELL_SIZE + 'px';
        piece.style.height = (fragment.length * CELL_SIZE) + 'px';
        piece.style.flexDirection = 'column';

        // Add each letter as a separate div
        for (var i = 0; i < fragment.length; i++) {
            var letterDiv = document.createElement('div');
            letterDiv.textContent = fragment[i];
            letterDiv.style.width = CELL_SIZE + 'px';
            letterDiv.style.height = CELL_SIZE + 'px';
            letterDiv.style.display = 'flex';
            letterDiv.style.alignItems = 'center';
            letterDiv.style.justifyContent = 'center';

            piece.appendChild(letterDiv);
        }
    } else {
        // Horizontal pieces - letters left to right
        piece.style.width = (fragment.length * CELL_SIZE) + 'px';
        piece.style.height = CELL_SIZE + 'px';
        piece.style.flexDirection = 'row';

        // Add each letter as a separate div for grid effect
        for (var i = 0; i < fragment.length; i++) {
            var letterDiv = document.createElement('div');
            letterDiv.textContent = fragment[i];
            letterDiv.style.width = CELL_SIZE + 'px';
            letterDiv.style.height = CELL_SIZE + 'px';
            letterDiv.style.display = 'flex';
            letterDiv.style.alignItems = 'center';
            letterDiv.style.justifyContent = 'center';
            piece.appendChild(letterDiv);
        }
    }

    return piece;
}

// ===================================
// EVENT LISTENERS
// ===================================

function setupEventListeners() {
    console.log('🎧 Setting up event listeners...');

    // Drag and drop events for all pieces (desktop)
    gameArea.addEventListener('dragstart', handleDragStart);
    gameArea.addEventListener('dragend', handleDragEnd);
    gameArea.addEventListener('dragover', handleDragOver);

    // Touch events for mobile
    gameArea.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameArea.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameArea.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Help button and instructions panel
    var helpBtn = document.getElementById('help-btn');
    var instructionsPanel = document.getElementById('instructions-panel');
    var closeInstructionsBtn = document.getElementById('close-instructions');

    if (helpBtn && instructionsPanel && closeInstructionsBtn) {
        helpBtn.addEventListener('click', function() {
            instructionsPanel.classList.add('show');
            helpBtn.style.display = 'none';

            // Track help button click in Google Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'help_clicked', {
                    'puzzle_name': document.title
                });
            }
        });

        closeInstructionsBtn.addEventListener('click', function() {
            instructionsPanel.classList.remove('show');
            helpBtn.style.display = 'flex';
        });
    }

    // Close victory modal button
    var closeVictoryBtn = document.getElementById('close-victory');
    if (closeVictoryBtn) {
        closeVictoryBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('🚪 Closing victory modal');
            victoryModal.classList.remove('show');

            // Track victory modal close in Google Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'victory_modal_closed', {
                    'puzzle_name': document.title,
                    'close_method': 'button'
                });
            }
        });
    }

    // Close modal when clicking on backdrop
    victoryModal.addEventListener('click', function(e) {
        if (e.target === victoryModal) {
            console.log('🚪 Closing victory modal (backdrop click)');
            victoryModal.classList.remove('show');

            // Track victory modal close in Google Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'victory_modal_closed', {
                    'puzzle_name': document.title,
                    'close_method': 'backdrop'
                });
            }
        }
    });

    console.log('✅ Event listeners ready');
}

// ===================================
// DRAG AND DROP HANDLERS
// ===================================

var draggedPiece = null;
var dragOffsetX = 0;
var dragOffsetY = 0;

function handleDragStart(e) {
    if (!e.target.classList.contains('piece')) return;
    if (e.target.classList.contains('locked')) {
        e.preventDefault();
        return;
    }

    // Unlock audio on first interaction (required for mobile Safari)
    unlockAudio();

    draggedPiece = e.target;
    draggedPiece.classList.add('dragging');

    var rect = draggedPiece.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    console.log('🎯 Drag started: "' + draggedPiece.dataset.fragment + '"');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDragEnd(e) {
    if (!draggedPiece) return;

    var gameAreaRect = gameArea.getBoundingClientRect();
    var pieceData = getPieceData(draggedPiece);

    // Calculate new position relative to game area
    var newX = e.clientX - gameAreaRect.left - dragOffsetX;
    var newY = e.clientY - gameAreaRect.top - dragOffsetY;

    // Keep piece within game area bounds
    newX = Math.max(0, Math.min(newX, gameAreaRect.width - draggedPiece.offsetWidth));
    newY = Math.max(0, Math.min(newY, gameAreaRect.height - draggedPiece.offsetHeight));

    // Snap to grid for perfect alignment
    newX = snapToGrid(newX);
    newY = snapToGrid(newY);

    console.log('📍 Piece dropped at (' + newX.toFixed(0) + ', ' + newY.toFixed(0) + ')');

    // Remove dragging class first to enable smooth transition
    draggedPiece.classList.remove('dragging');

    // Try to snap to nearby pieces (will also apply grid snapping)
    var snapped = trySnapToPieces(pieceData, newX, newY);

    if (!snapped) {
        // No snap, just position where dropped (already grid-snapped)
        setPiecePosition(pieceData, newX, newY);
        console.log('  → No snap detected, placed freely');
    }

    draggedPiece = null;

    // Check if any words are now complete
    setTimeout(function() { checkWordCompletion(); }, COMPLETION_DELAY);
}

// ===================================
// TOUCH EVENT HANDLERS (MOBILE)
// ===================================

var touchedPiece = null;
var touchStartX = 0;
var touchStartY = 0;

function handleTouchStart(e) {
    var target = e.target.closest('.piece');
    if (!target) return;
    if (target.classList.contains('locked')) {
        e.preventDefault();
        return;
    }

    e.preventDefault();

    // Unlock audio on first interaction (required for mobile Safari)
    unlockAudio();

    touchedPiece = target;
    touchedPiece.classList.add('dragging');
    touchedPiece.style.zIndex = 1000;

    var touch = e.touches[0];
    var rect = touchedPiece.getBoundingClientRect();

    touchStartX = touch.clientX - rect.left;
    touchStartY = touch.clientY - rect.top;

    console.log('📱 Touch started: "' + touchedPiece.dataset.fragment + '"');
}

function handleTouchMove(e) {
    if (!touchedPiece) return;

    e.preventDefault();

    var touch = e.touches[0];
    var gameAreaRect = gameArea.getBoundingClientRect();

    var newX = touch.clientX - gameAreaRect.left - touchStartX;
    var newY = touch.clientY - gameAreaRect.top - touchStartY;

    // Keep within bounds
    newX = Math.max(0, Math.min(newX, gameAreaRect.width - touchedPiece.offsetWidth));
    newY = Math.max(0, Math.min(newY, gameAreaRect.height - touchedPiece.offsetHeight));

    touchedPiece.style.transition = 'none';
    touchedPiece.style.left = newX + 'px';
    touchedPiece.style.top = newY + 'px';
}

function handleTouchEnd(e) {
    if (!touchedPiece) return;

    e.preventDefault();

    var currentX = parseFloat(touchedPiece.style.left);
    var currentY = parseFloat(touchedPiece.style.top);
    var pieceData = getPieceData(touchedPiece);

    // Snap to grid for perfect alignment
    currentX = snapToGrid(currentX);
    currentY = snapToGrid(currentY);

    // Update state position on grid before snapping check
    setPiecePosition(pieceData, currentX, currentY);

    console.log('📍 Touch ended at (' + currentX.toFixed(0) + ', ' + currentY.toFixed(0) + ')');

    touchedPiece.classList.remove('dragging');
    touchedPiece.style.transition = '';
    touchedPiece.style.zIndex = '';

    // Try to snap to nearby pieces (will also apply grid snapping)
    var snapped = trySnapToPieces(pieceData, currentX, currentY);

    if (!snapped) {
        // No snap, just position where dropped (already grid-snapped)
        console.log('  → No snap detected, placed freely');
    }

    // Check word completion
    setTimeout(function() {
        checkWordCompletion();
    }, COMPLETION_DELAY);

    touchedPiece = null;
}

// ===================================
// SNAPPING LOGIC
// ===================================

function trySnapToPieces(pieceData, x, y) {
    var pieceWord = pieceData.word;
    var pieceOrientation = pieceData.orientation || 'horizontal';
    var pieceRect = {
        left: x,
        top: y,
        right: x + pieceData.width,
        bottom: y + pieceData.height,
        width: pieceData.width,
        height: pieceData.height
    };

    console.log('🔍 Checking snap for "' + pieceData.fragment + '" (' + pieceOrientation + ')...');

    // Find all pieces from the same word
    var sameWordPieces = pieces.filter(function(p) {
        return p.word === pieceWord && p !== pieceData;
    });

    var bestSnap = null;
    var bestDistance = SNAP_DISTANCE;
    var attractedPiece = null;

    for (var i = 0; i < sameWordPieces.length; i++) {
        var otherPiece = sameWordPieces[i];
        var otherOrientation = otherPiece.orientation || 'horizontal';
        var otherRect = getPieceRect(otherPiece);

        // Both pieces must have same orientation to snap
        if (pieceOrientation !== otherOrientation) continue;

        if (pieceOrientation === 'horizontal') {
            // HORIZONTAL SNAPPING

            // Check snapping to right of other piece
            var rightDistance = Math.abs(pieceRect.left - otherRect.right);
            var verticalAlign = Math.abs(pieceRect.top - otherRect.top);

            if (rightDistance < bestDistance && verticalAlign < SNAP_DISTANCE) {
                var totalDist = rightDistance + verticalAlign;
                if (!bestSnap || totalDist < bestSnap.distance) {
                    bestSnap = {
                        x: otherRect.right,
                        y: otherRect.top,
                        side: 'right',
                        other: otherPiece.fragment,
                        distance: totalDist
                    };
                }
            }

            // Check snapping to left of other piece
            var leftDistance = Math.abs(pieceRect.right - otherRect.left);
            var verticalAlignLeft = Math.abs(pieceRect.top - otherRect.top);

            if (leftDistance < bestDistance && verticalAlignLeft < SNAP_DISTANCE) {
                var totalDist = leftDistance + verticalAlignLeft;
                if (!bestSnap || totalDist < bestSnap.distance) {
                    bestSnap = {
                        x: otherRect.left - pieceRect.width,
                        y: otherRect.top,
                        side: 'left',
                        other: otherPiece.fragment,
                        distance: totalDist
                    };
                }
            }
        } else {
            // VERTICAL SNAPPING

            // Check snapping to bottom of other piece
            var bottomDistance = Math.abs(pieceRect.top - otherRect.bottom);
            var horizontalAlign = Math.abs(pieceRect.left - otherRect.left);

            if (bottomDistance < bestDistance && horizontalAlign < SNAP_DISTANCE) {
                var totalDist = bottomDistance + horizontalAlign;
                if (!bestSnap || totalDist < bestSnap.distance) {
                    bestSnap = {
                        x: otherRect.left,
                        y: otherRect.bottom,
                        side: 'bottom',
                        other: otherPiece.fragment,
                        distance: totalDist
                    };
                }
            }

            // Check snapping to top of other piece
            var topDistance = Math.abs(pieceRect.bottom - otherRect.top);
            var horizontalAlignTop = Math.abs(pieceRect.left - otherRect.left);

            if (topDistance < bestDistance && horizontalAlignTop < SNAP_DISTANCE) {
                var totalDist = topDistance + horizontalAlignTop;
                if (!bestSnap || totalDist < bestSnap.distance) {
                    bestSnap = {
                        x: otherRect.left,
                        y: otherRect.top - pieceRect.height,
                        side: 'top',
                        other: otherPiece.fragment,
                        distance: totalDist
                    };
                }
            }
        }
    }

    if (bestSnap) {
        // Apply grid snapping for pixel-perfect alignment
        var snappedX = snapToGrid(bestSnap.x);
        var snappedY = snapToGrid(bestSnap.y);

        setPiecePosition(pieceData, snappedX, snappedY);

        // Add snap animation class temporarily
        pieceData.element.classList.add('snapping');
        setTimeout(function() {
            pieceData.element.classList.remove('snapping');
        }, 300);

        // Create ripple effect at snap point
        createRippleEffect(snappedX + pieceRect.width / 2, snappedY + pieceRect.height / 2);

        console.log('  ✓ Snapped to ' + bestSnap.side.toUpperCase() + ' of "' + bestSnap.other + '" (distance: ' + bestSnap.distance.toFixed(0) + 'px)');
        return true;
    }

    return false;
}

// ===================================
// WORD COMPLETION DETECTION
// ===================================

function checkWordCompletion() {
    console.log('🔍 Checking for completed words...');

    puzzleConfig.words.forEach(function(wordData, wordIndex) {
        // Skip if already completed
        if (completedWords.has(wordIndex)) return;

        // Get all pieces for this word
        var wordPieces = pieces.filter(function(p) { return p.wordIndex === wordIndex; });

        // Check if pieces are connected in correct order
        if (arePiecesConnected(wordPieces, wordData)) {
            console.log('✅ Word completed: ' + wordData.word);
            markWordAsComplete(wordIndex, wordPieces);
            completedWords.add(wordIndex);
        }
    });

    // Check if all words are complete
    if (completedWords.size === puzzleConfig.words.length) {
        console.log('🎉 ALL WORDS COMPLETED! Victory!');
        showVictoryScreen();
    }
}

function arePiecesConnected(wordPieces, wordData) {
    var orientation = wordData.orientation || 'horizontal';

    // Sort pieces based on orientation
    var sortedPieces = wordPieces.slice().sort(function(a, b) {
        var aRect = getPieceRect(a);
        var bRect = getPieceRect(b);
        if (orientation === 'horizontal') {
            return aRect.left - bRect.left;
        } else {
            return aRect.top - bRect.top;
        }
    });

    // Check if pieces form the correct word
    var formedWord = sortedPieces.map(function(p) { return p.fragment; }).join('');

    if (formedWord !== wordData.word) {
        return false;
    }

    // Check if pieces are actually connected (touching) with reasonable tolerance
    for (var i = 0; i < sortedPieces.length - 1; i++) {
        var current = sortedPieces[i];
        var next = sortedPieces[i + 1];

        var currentRect = getPieceRect(current);
        var nextRect = getPieceRect(next);

        if (orientation === 'horizontal') {
            // For horizontal: pieces must be touching AND aligned vertically
            var gap = Math.abs(nextRect.left - currentRect.right);
            var verticalAlign = Math.abs(currentRect.top - nextRect.top);

            if (gap > SNAP_TOLERANCE || verticalAlign > SNAP_TOLERANCE) {
                console.log('  ✗ Horizontal alignment failed: gap=' + gap.toFixed(1) + 'px, vAlign=' + verticalAlign.toFixed(1) + 'px');
                return false;
            }
        } else {
            // For vertical: pieces must be touching AND aligned horizontally
            var gap = Math.abs(nextRect.top - currentRect.bottom);
            var horizontalAlign = Math.abs(currentRect.left - nextRect.left);

            if (gap > SNAP_TOLERANCE || horizontalAlign > SNAP_TOLERANCE) {
                console.log('  ✗ Vertical alignment failed: gap=' + gap.toFixed(1) + 'px, hAlign=' + horizontalAlign.toFixed(1) + 'px');
                return false;
            }
        }
    }

    console.log('  ✓ Pieces correctly connected: ' + formedWord + ' (' + orientation + ')');
    return true;
}

function markWordAsComplete(wordIndex, wordPieces) {
    var wordData = puzzleConfig.words[wordIndex];
    var orientation = wordData.orientation || 'horizontal';

    // Calculate the bounding box of the entire completed word
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    wordPieces.forEach(function(piece) {
        var rect = getPieceRect(piece);
        var left = rect.left;
        var top = rect.top;
        var right = rect.right;
        var bottom = rect.bottom;

        minX = Math.min(minX, left);
        minY = Math.min(minY, top);
        maxX = Math.max(maxX, right);
        maxY = Math.max(maxY, bottom);
    });

    var totalWidth = maxX - minX;
    var totalHeight = maxY - minY;

    // Apply unified gradient across all pieces
    wordPieces.forEach(function(piece) {
        // Add completed class first
        piece.element.classList.add('completed', 'locked');
        piece.completed = true;
    });

    // Force a reflow to ensure completed styles are applied
    void wordPieces[0].element.offsetHeight;

    // Now apply gradient positioning
    wordPieces.forEach(function(piece) {
        var rect = getPieceRect(piece);
        var left = rect.left;
        var top = rect.top;

        // Calculate offset within the word
        var offsetX = left - minX;
        var offsetY = top - minY;

        // Apply gradient with proper sizing and positioning
        piece.element.style.backgroundSize = totalWidth + 'px ' + totalHeight + 'px';
        piece.element.style.backgroundPosition = '-' + offsetX + 'px -' + offsetY + 'px';
    });

    console.log('🔒 Word locked: ' + puzzleConfig.words[wordIndex].word);

    // Use requestAnimationFrame to ensure celebration effects render in next frame
    // This prevents the delay where effects don't appear until another piece is moved
    requestAnimationFrame(function() {
        createWordCompletionEffect(wordPieces);
    });

    // Track word completion in Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'word_completed', {
            'word_name': puzzleConfig.words[wordIndex].word,
            'puzzle_name': document.title
        });
    }

    // Play success sound
    if (successSound) {
        // Reset and play (in case multiple words complete quickly)
        successSound.currentTime = 0;
        successSound.play().catch(function(err) {
            console.log('Audio play prevented:', err);
            // Browsers may block autoplay, but that's okay
        });
    }
}

// ===================================
// VISUAL EFFECTS
// ===================================

function createRippleEffect(x, y) {
    var ripple = document.createElement('div');
    ripple.className = 'ripple-effect';

    var gameAreaRect = gameArea.getBoundingClientRect();
    var size = 100;

    ripple.style.left = (x - size / 2) + 'px';
    ripple.style.top = (y - size / 2) + 'px';
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';

    gameArea.appendChild(ripple);

    setTimeout(function() {
        gameArea.removeChild(ripple);
    }, 800);
}

function createWordCompletionEffect(wordPieces) {
    if (wordPieces.length === 0) return;

    // Get the center of the completed word
    var totalX = 0;
    var totalY = 0;

    wordPieces.forEach(function(piece) {
        var rect = getPieceRect(piece);
        totalX += rect.left + rect.width / 2;
        totalY += rect.top + rect.height / 2;
    });

    var centerX = totalX / wordPieces.length;
    var centerY = totalY / wordPieces.length;

    // Create particle burst
    createParticleBurst(centerX, centerY, 12);

    // Create confetti
    createConfetti(centerX, centerY, 8);
}

function createParticleBurst(x, y, count) {
    var colors = ['#3b82f6', '#2563eb', '#1d4ed8', '#60a5fa', '#93c5fd'];

    for (var i = 0; i < count; i++) {
        var particle = document.createElement('div');
        particle.className = 'particle';

        var angle = (Math.PI * 2 * i) / count;
        var distance = 40 + Math.random() * 40;
        var tx = Math.cos(angle) * distance;
        var ty = Math.sin(angle) * distance;

        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');

        gameArea.appendChild(particle);

        setTimeout(function(p) {
            return function() {
                if (p.parentNode) {
                    gameArea.removeChild(p);
                }
            };
        }(particle), 800);
    }
}

function createConfetti(x, y, count) {
    var colors = ['#f43f5e', '#ec4899', '#a855f7', '#3b82f6', '#10b981', '#f59e0b'];
    var shapes = ['circle', 'square'];

    for (var i = 0; i < count; i++) {
        var confetti = document.createElement('div');
        confetti.className = 'confetti';

        var offsetX = (Math.random() - 0.5) * 100;
        var color = colors[Math.floor(Math.random() * colors.length)];
        var isCircle = Math.random() > 0.5;

        confetti.style.left = (x + offsetX) + 'px';
        confetti.style.top = y + 'px';
        confetti.style.backgroundColor = color;
        confetti.style.borderRadius = isCircle ? '50%' : '0';
        confetti.style.animationDelay = (Math.random() * 0.3) + 's';
        confetti.style.animationDuration = (1.5 + Math.random() * 0.5) + 's';

        gameArea.appendChild(confetti);

        setTimeout(function(c) {
            return function() {
                if (c.parentNode) {
                    gameArea.removeChild(c);
                }
            };
        }(confetti), 2500);
    }
}

// ===================================
// VICTORY SCREEN
// ===================================

function showVictoryScreen() {
    console.log('🎊 Showing victory screen...');

    // Track puzzle completion in Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'puzzle_completed', {
            'puzzle_name': document.title,
            'total_words': puzzleConfig.words.length
        });
    }

    // Populate facts list
    factsList.innerHTML = '';
    puzzleConfig.words.forEach(function(wordData) {
        var li = document.createElement('li');
        li.innerHTML = '<strong>' + wordData.word + ':</strong> ' + wordData.fact;
        factsList.appendChild(li);
    });

    // Show modal
    victoryModal.classList.add('show');
}

// ===================================
// START THE GAME
// ===================================

// Initialize when DOM and viewport are fully ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Increased delay to ensure viewport is stable
        setTimeout(init, 200);
    });
} else {
    // Document already loaded, still wait for stability
    setTimeout(init, 200);
}

// Also listen for window load as backup
window.addEventListener('load', function() {
    // Recalculate if not initialized yet
    if (pieces.length === 0) {
        console.log('🔄 Backup initialization triggered');
        init();
    }
});

console.log('🎮 WordUp Game Engine v2.0 - Script Loaded');
console.log('📏 Default CELL_SIZE: ' + CELL_SIZE + 'px (will recalculate on init)');
