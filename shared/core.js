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

var pieces = [];
var completedWords = new Set();

// DOM Elements (initialized on load)
var gameArea = null;
var puzzleDescription = null;
var victoryModal = null;
var factsList = null;
var successSound = null;

// ===================================
// UTILITY FUNCTIONS
// ===================================

function getCellSizeForViewport() {
    var width = window.innerWidth;
    if (width <= 480) return gameSettings.cellSize.mobile;
    if (width <= 768) return gameSettings.cellSize.tablet;
    return gameSettings.cellSize.desktop;
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
    var style = document.createElement('style');
    style.textContent =
        ':root {' +
        '  --primary-color: ' + colors.primary + ';' +
        '  --gradient-start: ' + colors.gradientStart + ';' +
        '  --gradient-end: ' + colors.gradientEnd + ';' +
        '  --piece-bg: ' + colors.pieceBackground + ';' +
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

            piece.style.left = randomX + 'px';
            piece.style.top = randomY + 'px';

            // Track this piece's position
            placedPieces.push({
                left: randomX,
                top: randomY,
                right: randomX + pieceWidth,
                bottom: randomY + pieceHeight
            });

            console.log('  ✓ Piece "' + fragment + '" (' + pieceWidth + 'x' + pieceHeight + 'px ' + orientation + ') at (' + randomX.toFixed(0) + ', ' + randomY.toFixed(0) + ')');

            pieces.push({
                element: piece,
                fragment: fragment,
                word: wordData.word,
                wordIndex: wordIndex,
                orientation: orientation,
                completed: false
            });

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

            // Add border between letters (except last)
            if (i < fragment.length - 1) {
                letterDiv.style.borderBottom = '2px solid var(--primary-color)';
            }

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

    // Calculate new position relative to game area
    var newX = e.clientX - gameAreaRect.left - dragOffsetX;
    var newY = e.clientY - gameAreaRect.top - dragOffsetY;

    // Keep piece within game area bounds
    newX = Math.max(0, Math.min(newX, gameAreaRect.width - draggedPiece.offsetWidth));
    newY = Math.max(0, Math.min(newY, gameAreaRect.height - draggedPiece.offsetHeight));

    console.log('📍 Piece dropped at (' + newX.toFixed(0) + ', ' + newY.toFixed(0) + ')');

    // Remove dragging class first to enable smooth transition
    draggedPiece.classList.remove('dragging');

    // Try to snap to nearby pieces
    var snapped = trySnapToPieces(draggedPiece, newX, newY);

    if (!snapped) {
        // No snap, just position where dropped
        draggedPiece.style.left = newX + 'px';
        draggedPiece.style.top = newY + 'px';
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

    console.log('📍 Touch ended at (' + currentX.toFixed(0) + ', ' + currentY.toFixed(0) + ')');

    touchedPiece.classList.remove('dragging');
    touchedPiece.style.transition = '';
    touchedPiece.style.zIndex = '';

    // Try to snap to nearby pieces
    var snapped = trySnapToPieces(touchedPiece, currentX, currentY);

    // Check word completion
    setTimeout(function() {
        checkWordCompletion();
    }, COMPLETION_DELAY);

    touchedPiece = null;
}

// ===================================
// SNAPPING LOGIC
// ===================================

function trySnapToPieces(piece, x, y) {
    var pieceWord = piece.dataset.word;
    var pieceOrientation = piece.dataset.orientation || 'horizontal';
    var pieceRect = {
        left: x,
        top: y,
        right: x + piece.offsetWidth,
        bottom: y + piece.offsetHeight,
        width: piece.offsetWidth,
        height: piece.offsetHeight
    };

    console.log('🔍 Checking snap for "' + piece.dataset.fragment + '" (' + pieceOrientation + ')...');

    // Find all pieces from the same word
    var sameWordPieces = pieces.filter(function(p) {
        return p.word === pieceWord && p.element !== piece;
    });

    var bestSnap = null;
    var bestDistance = SNAP_DISTANCE;

    for (var i = 0; i < sameWordPieces.length; i++) {
        var otherPiece = sameWordPieces[i];
        var otherRect = otherPiece.element.getBoundingClientRect();
        var gameAreaRect = gameArea.getBoundingClientRect();
        var otherOrientation = otherPiece.orientation || 'horizontal';

        var otherPos = {
            left: otherRect.left - gameAreaRect.left,
            top: otherRect.top - gameAreaRect.top,
            right: otherRect.right - gameAreaRect.left,
            bottom: otherRect.bottom - gameAreaRect.top,
            width: otherRect.width,
            height: otherRect.height
        };

        // Both pieces must have same orientation to snap
        if (pieceOrientation !== otherOrientation) continue;

        if (pieceOrientation === 'horizontal') {
            // HORIZONTAL SNAPPING

            // Check snapping to right of other piece
            var rightDistance = Math.abs(pieceRect.left - otherPos.right);
            var verticalAlign = Math.abs(pieceRect.top - otherPos.top);

            if (rightDistance < bestDistance && verticalAlign < SNAP_DISTANCE) {
                var totalDist = rightDistance + verticalAlign;
                if (!bestSnap || totalDist < bestSnap.distance) {
                    bestSnap = {
                        x: otherPos.right,
                        y: otherPos.top,
                        side: 'right',
                        other: otherPiece.fragment,
                        distance: totalDist
                    };
                }
            }

            // Check snapping to left of other piece
            var leftDistance = Math.abs(pieceRect.right - otherPos.left);
            var verticalAlignLeft = Math.abs(pieceRect.top - otherPos.top);

            if (leftDistance < bestDistance && verticalAlignLeft < SNAP_DISTANCE) {
                var totalDist = leftDistance + verticalAlignLeft;
                if (!bestSnap || totalDist < bestSnap.distance) {
                    bestSnap = {
                        x: otherPos.left - pieceRect.width,
                        y: otherPos.top,
                        side: 'left',
                        other: otherPiece.fragment,
                        distance: totalDist
                    };
                }
            }
        } else {
            // VERTICAL SNAPPING

            // Check snapping to bottom of other piece
            var bottomDistance = Math.abs(pieceRect.top - otherPos.bottom);
            var horizontalAlign = Math.abs(pieceRect.left - otherPos.left);

            if (bottomDistance < bestDistance && horizontalAlign < SNAP_DISTANCE) {
                var totalDist = bottomDistance + horizontalAlign;
                if (!bestSnap || totalDist < bestSnap.distance) {
                    bestSnap = {
                        x: otherPos.left,
                        y: otherPos.bottom,
                        side: 'bottom',
                        other: otherPiece.fragment,
                        distance: totalDist
                    };
                }
            }

            // Check snapping to top of other piece
            var topDistance = Math.abs(pieceRect.bottom - otherPos.top);
            var horizontalAlignTop = Math.abs(pieceRect.left - otherPos.left);

            if (topDistance < bestDistance && horizontalAlignTop < SNAP_DISTANCE) {
                var totalDist = topDistance + horizontalAlignTop;
                if (!bestSnap || totalDist < bestSnap.distance) {
                    bestSnap = {
                        x: otherPos.left,
                        y: otherPos.top - pieceRect.height,
                        side: 'top',
                        other: otherPiece.fragment,
                        distance: totalDist
                    };
                }
            }
        }
    }

    if (bestSnap) {
        piece.style.left = bestSnap.x + 'px';
        piece.style.top = bestSnap.y + 'px';
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
        if (orientation === 'horizontal') {
            var aLeft = parseFloat(a.element.style.left);
            var bLeft = parseFloat(b.element.style.left);
            return aLeft - bLeft;
        } else {
            var aTop = parseFloat(a.element.style.top);
            var bTop = parseFloat(b.element.style.top);
            return aTop - bTop;
        }
    });

    // Check if pieces form the correct word
    var formedWord = sortedPieces.map(function(p) { return p.fragment; }).join('');

    if (formedWord !== wordData.word) {
        return false;
    }

    // Check if pieces are actually connected (touching) with reasonable tolerance
    for (var i = 0; i < sortedPieces.length - 1; i++) {
        var current = sortedPieces[i].element;
        var next = sortedPieces[i + 1].element;

        var currentRect = current.getBoundingClientRect();
        var nextRect = next.getBoundingClientRect();

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
    // Mark all pieces as completed and locked
    wordPieces.forEach(function(piece) {
        piece.element.classList.add('completed', 'locked');
        piece.completed = true;
    });

    console.log('🔒 Word locked: ' + puzzleConfig.words[wordIndex].word);

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
