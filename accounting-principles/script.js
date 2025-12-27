// ===================================
// BONZA WORD PUZZLE - GAME LOGIC
// ===================================

// Game Configuration Constants - Responsive
function getCellSize() {
    const width = window.innerWidth;
    if (width <= 480) return 35;      // Small phones: 35px cells
    if (width <= 768) return 40;      // Tablets: 40px cells
    return 50;                         // Desktop: 50px cells
}

let CELL_SIZE = 50;  // Default, will be updated on init
const SNAP_DISTANCE = 150;   // Distance threshold for snapping pieces together

// Game State
let puzzleData = null;
let pieces = [];
let completedWords = new Set();

// DOM Elements
const gameArea = document.getElementById('game-area');
const puzzleDescription = document.getElementById('puzzle-description');
const victoryModal = document.getElementById('victory-modal');
const factsList = document.getElementById('facts-list');
const newPuzzleBtn = document.getElementById('new-puzzle-btn');

// ===================================
// INITIALIZATION
// ===================================

async function init() {
    console.log('🎮 Initializing Bonza Word Puzzle Game...');
    
    // Force browser to complete layout
    void gameArea.offsetHeight;
    
    // Set correct cell size based on current viewport
    CELL_SIZE = getCellSize();
    console.log(`📏 Cell size: ${CELL_SIZE}px | Viewport: ${window.innerWidth}x${window.innerHeight}px`);
    console.log(`📐 Game area: ${gameArea.offsetWidth}x${gameArea.offsetHeight}px`);
    
    try {
        await loadPuzzle();
        // Small delay to ensure layout is stable
        await new Promise(resolve => setTimeout(resolve, 50));
        createPieces();
        setupEventListeners();
        console.log('✅ Game initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing game:', error);
        gameArea.innerHTML = '<div class="loading">Error loading puzzle. Please refresh the page.</div>';
    }
}

// ===================================
// PUZZLE LOADING
// ===================================

async function loadPuzzle() {
    console.log('📥 Loading puzzle data...');
    
    try {
        const response = await fetch('puzzle.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        puzzleData = await response.json();
        console.log('📊 Puzzle loaded:', puzzleData.title);
        console.log('📝 Words in puzzle:', puzzleData.words.length);
        
        // Update UI with puzzle info
        puzzleDescription.textContent = puzzleData.description;
        
        return puzzleData;
    } catch (error) {
        console.error('❌ Failed to load puzzle:', error);
        throw error;
    }
}

// ===================================
// PIECE CREATION
// ===================================

function createPieces() {
    console.log('🎨 Creating puzzle pieces...');
    
    pieces = [];
    gameArea.innerHTML = ''; // Clear existing pieces
    
    const gameAreaRect = gameArea.getBoundingClientRect();
    const placedPieces = []; // Track placed pieces to avoid overlap
    
    puzzleData.words.forEach((wordData, wordIndex) => {
        console.log(`📦 Creating pieces for word: ${wordData.word}`);
        
        const orientation = wordData.orientation || 'horizontal';
        
        wordData.fragments.forEach((fragment, fragmentIndex) => {
            const piece = createPieceElement(fragment, wordData.word, wordIndex, fragmentIndex, orientation);
            
            // Calculate piece dimensions based on orientation
            let pieceWidth, pieceHeight;
            if (orientation === 'vertical') {
                pieceWidth = CELL_SIZE;
                pieceHeight = fragment.length * CELL_SIZE;
            } else {
                pieceWidth = fragment.length * CELL_SIZE;
                pieceHeight = CELL_SIZE;
            }
            
            // Calculate safe bounds with proper margins
            const margin = 30;
            const minX = margin;
            const maxX = gameAreaRect.width - pieceWidth - margin;
            const minY = margin;
            const maxY = gameAreaRect.height - pieceHeight - margin;
            
            // Ensure maxX and maxY are valid
            if (maxX < minX || maxY < minY) {
                console.warn(`⚠️ Piece "${fragment}" (${pieceWidth}x${pieceHeight}px) is too large for game area`);
            }
            
            // Try to find a non-overlapping position
            let randomX, randomY, attempts = 0;
            let overlapping = true;
            
            while (overlapping && attempts < 50) {
                randomX = Math.max(minX, Math.min(maxX, minX + Math.random() * (maxX - minX)));
                randomY = Math.max(minY, Math.min(maxY, minY + Math.random() * (maxY - minY)));
                
                // Check if this position overlaps with any placed pieces
                overlapping = placedPieces.some(placed => {
                    const horizontalOverlap = randomX < placed.right && (randomX + pieceWidth) > placed.left;
                    const verticalOverlap = randomY < placed.bottom && (randomY + pieceHeight) > placed.top;
                    return horizontalOverlap && verticalOverlap;
                });
                
                attempts++;
            }
            
            // If still overlapping after 50 attempts, just place it (rare case)
            if (overlapping) {
                console.log(`  ⚠️ Could not find non-overlapping spot for "${fragment}" after 50 attempts`);
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
            
            console.log(`  ✓ Piece "${fragment}" (${pieceWidth}x${pieceHeight}px ${orientation}) at (${randomX.toFixed(0)}, ${randomY.toFixed(0)})`);
            
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
    
    console.log(`✅ Created ${pieces.length} total pieces`);
}

function createPieceElement(fragment, word, wordIndex, fragmentIndex, orientation) {
    const piece = document.createElement('div');
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
        for (let i = 0; i < fragment.length; i++) {
            const letterDiv = document.createElement('div');
            letterDiv.textContent = fragment[i];
            letterDiv.style.width = CELL_SIZE + 'px';
            letterDiv.style.height = CELL_SIZE + 'px';
            letterDiv.style.display = 'flex';
            letterDiv.style.alignItems = 'center';
            letterDiv.style.justifyContent = 'center';
            
            // Add border between letters (except last)
            if (i < fragment.length - 1) {
                letterDiv.style.borderBottom = '2px solid rgb(196, 0, 3)';
            }
            
            piece.appendChild(letterDiv);
        }
    } else {
        // Horizontal pieces - letters left to right
        piece.style.width = (fragment.length * CELL_SIZE) + 'px';
        piece.style.height = CELL_SIZE + 'px';
        piece.style.flexDirection = 'row';
        
        // Add each letter as a separate div for grid effect
        for (let i = 0; i < fragment.length; i++) {
            const letterDiv = document.createElement('div');
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
    
    // New puzzle button - no action, just a message
    // Button now says "Hope you enjoyed! Visit tomorrow for a new puzzle"
    
    // Help button and instructions panel
    const helpBtn = document.getElementById('help-btn');
    const instructionsPanel = document.getElementById('instructions-panel');
    const closeInstructionsBtn = document.getElementById('close-instructions');
    
    if (helpBtn && instructionsPanel && closeInstructionsBtn) {
        helpBtn.addEventListener('click', () => {
            instructionsPanel.classList.add('show');
            helpBtn.style.display = 'none';
            
            // Track help button click in Google Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'help_clicked', {
                    'puzzle_name': document.title
                });
            }
        });
        
        closeInstructionsBtn.addEventListener('click', () => {
            instructionsPanel.classList.remove('show');
            helpBtn.style.display = 'flex';
        });
    }
    
    // Close victory modal button
    const closeVictoryBtn = document.getElementById('close-victory');
    if (closeVictoryBtn) {
        closeVictoryBtn.addEventListener('click', (e) => {
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
    victoryModal.addEventListener('click', (e) => {
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
            victoryModal.classList.remove('show');
        }
    });
    
    console.log('✅ Event listeners ready');
}

// ===================================
// DRAG AND DROP HANDLERS
// ===================================

let draggedPiece = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function handleDragStart(e) {
    if (!e.target.classList.contains('piece')) return;
    if (e.target.classList.contains('locked')) {
        e.preventDefault();
        return;
    }
    
    draggedPiece = e.target;
    draggedPiece.classList.add('dragging');
    
    const rect = draggedPiece.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    
    console.log(`🎯 Drag started: "${draggedPiece.dataset.fragment}"`);
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDragEnd(e) {
    if (!draggedPiece) return;
    
    const gameAreaRect = gameArea.getBoundingClientRect();
    
    // Calculate new position relative to game area
    let newX = e.clientX - gameAreaRect.left - dragOffsetX;
    let newY = e.clientY - gameAreaRect.top - dragOffsetY;
    
    // Keep piece within game area bounds
    newX = Math.max(0, Math.min(newX, gameAreaRect.width - draggedPiece.offsetWidth));
    newY = Math.max(0, Math.min(newY, gameAreaRect.height - draggedPiece.offsetHeight));
    
    console.log(`📍 Piece dropped at (${newX.toFixed(0)}, ${newY.toFixed(0)})`);
    
    // Remove dragging class first to enable smooth transition
    draggedPiece.classList.remove('dragging');
    
    // Try to snap to nearby pieces
    const snapped = trySnapToPieces(draggedPiece, newX, newY);
    
    if (!snapped) {
        // No snap, just position where dropped
        draggedPiece.style.left = newX + 'px';
        draggedPiece.style.top = newY + 'px';
        console.log('  → No snap detected, placed freely');
    }
    
    draggedPiece = null;
    
    // Check if any words are now complete (slight delay for smooth animation)
    setTimeout(() => checkWordCompletion(), 350);
}

// ===================================
// TOUCH EVENT HANDLERS (MOBILE)
// ===================================

let touchedPiece = null;
let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(e) {
    const target = e.target.closest('.piece');
    if (!target) return;
    if (target.classList.contains('locked')) {
        e.preventDefault();
        return;
    }
    
    e.preventDefault();
    
    touchedPiece = target;
    touchedPiece.classList.add('dragging');
    touchedPiece.style.zIndex = 1000;
    
    const touch = e.touches[0];
    const rect = touchedPiece.getBoundingClientRect();
    
    touchStartX = touch.clientX - rect.left;
    touchStartY = touch.clientY - rect.top;
    
    console.log(`📱 Touch started: "${touchedPiece.dataset.fragment}"`);
}

function handleTouchMove(e) {
    if (!touchedPiece) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const gameAreaRect = gameArea.getBoundingClientRect();
    
    let newX = touch.clientX - gameAreaRect.left - touchStartX;
    let newY = touch.clientY - gameAreaRect.top - touchStartY;
    
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
    
    const currentX = parseFloat(touchedPiece.style.left);
    const currentY = parseFloat(touchedPiece.style.top);
    
    console.log(`📍 Touch ended at (${currentX.toFixed(0)}, ${currentY.toFixed(0)})`);
    
    touchedPiece.classList.remove('dragging');
    touchedPiece.style.transition = '';
    touchedPiece.style.zIndex = '';
    
    // Try to snap to nearby pieces
    const snapped = trySnapToPieces(touchedPiece, currentX, currentY);
    
    // Check word completion
    setTimeout(() => {
        checkWordCompletion();
    }, 350);
    
    touchedPiece = null;
}

// ===================================
// SNAPPING LOGIC
// ===================================

function trySnapToPieces(piece, x, y) {
    const pieceWord = piece.dataset.word;
    const pieceOrientation = piece.dataset.orientation || 'horizontal';
    const pieceRect = {
        left: x,
        top: y,
        right: x + piece.offsetWidth,
        bottom: y + piece.offsetHeight,
        width: piece.offsetWidth,
        height: piece.offsetHeight
    };
    
    console.log(`🔍 Checking snap for "${piece.dataset.fragment}" (${pieceOrientation})...`);
    
    // Find all pieces from the same word
    const sameWordPieces = pieces.filter(p => 
        p.word === pieceWord && p.element !== piece
    );
    
    let bestSnap = null;
    let bestDistance = SNAP_DISTANCE;
    
    for (const otherPiece of sameWordPieces) {
        const otherRect = otherPiece.element.getBoundingClientRect();
        const gameAreaRect = gameArea.getBoundingClientRect();
        const otherOrientation = otherPiece.orientation || 'horizontal';
        
        const otherPos = {
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
            const rightDistance = Math.abs(pieceRect.left - otherPos.right);
            const verticalAlign = Math.abs(pieceRect.top - otherPos.top);
            
            if (rightDistance < bestDistance && verticalAlign < SNAP_DISTANCE) {
                const totalDist = rightDistance + verticalAlign;
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
            const leftDistance = Math.abs(pieceRect.right - otherPos.left);
            const verticalAlignLeft = Math.abs(pieceRect.top - otherPos.top);
            
            if (leftDistance < bestDistance && verticalAlignLeft < SNAP_DISTANCE) {
                const totalDist = leftDistance + verticalAlignLeft;
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
            const bottomDistance = Math.abs(pieceRect.top - otherPos.bottom);
            const horizontalAlign = Math.abs(pieceRect.left - otherPos.left);
            
            if (bottomDistance < bestDistance && horizontalAlign < SNAP_DISTANCE) {
                const totalDist = bottomDistance + horizontalAlign;
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
            const topDistance = Math.abs(pieceRect.bottom - otherPos.top);
            const horizontalAlignTop = Math.abs(pieceRect.left - otherPos.left);
            
            if (topDistance < bestDistance && horizontalAlignTop < SNAP_DISTANCE) {
                const totalDist = topDistance + horizontalAlignTop;
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
        console.log(`  ✓ Snapped to ${bestSnap.side.toUpperCase()} of "${bestSnap.other}" (distance: ${bestSnap.distance.toFixed(0)}px)`);
        return true;
    }
    
    return false;
}

// ===================================
// WORD COMPLETION DETECTION
// ===================================

function checkWordCompletion() {
    console.log('🔍 Checking for completed words...');
    
    puzzleData.words.forEach((wordData, wordIndex) => {
        // Skip if already completed
        if (completedWords.has(wordIndex)) return;
        
        // Get all pieces for this word
        const wordPieces = pieces.filter(p => p.wordIndex === wordIndex);
        
        // Check if pieces are connected in correct order
        if (arePiecesConnected(wordPieces, wordData)) {
            console.log(`✅ Word completed: ${wordData.word}`);
            markWordAsComplete(wordIndex, wordPieces);
            completedWords.add(wordIndex);
        }
    });
    
    // Check if all words are complete
    if (completedWords.size === puzzleData.words.length) {
        console.log('🎉 ALL WORDS COMPLETED! Victory!');
        showVictoryScreen();
    }
}

function arePiecesConnected(wordPieces, wordData) {
    const orientation = wordData.orientation || 'horizontal';
    
    // Sort pieces based on orientation
    const sortedPieces = [...wordPieces].sort((a, b) => {
        if (orientation === 'horizontal') {
            const aLeft = parseFloat(a.element.style.left);
            const bLeft = parseFloat(b.element.style.left);
            return aLeft - bLeft;
        } else {
            const aTop = parseFloat(a.element.style.top);
            const bTop = parseFloat(b.element.style.top);
            return aTop - bTop;
        }
    });
    
    // Check if pieces form the correct word
    const formedWord = sortedPieces.map(p => p.fragment).join('');
    
    if (formedWord !== wordData.word) {
        return false;
    }
    
    // Check if pieces are actually connected (touching) with reasonable tolerance
    for (let i = 0; i < sortedPieces.length - 1; i++) {
        const current = sortedPieces[i].element;
        const next = sortedPieces[i + 1].element;
        
        const currentRect = current.getBoundingClientRect();
        const nextRect = next.getBoundingClientRect();
        
        if (orientation === 'horizontal') {
            // For horizontal: pieces must be touching AND aligned vertically
            const gap = Math.abs(nextRect.left - currentRect.right);
            const verticalAlign = Math.abs(currentRect.top - nextRect.top);
            
            // Increased tolerance to 5px for better detection after snapping
            if (gap > 5 || verticalAlign > 5) {
                console.log(`  ✗ Horizontal alignment failed: gap=${gap.toFixed(1)}px, vAlign=${verticalAlign.toFixed(1)}px`);
                return false;
            }
        } else {
            // For vertical: pieces must be touching AND aligned horizontally
            const gap = Math.abs(nextRect.top - currentRect.bottom);
            const horizontalAlign = Math.abs(currentRect.left - nextRect.left);
            
            // Increased tolerance to 5px for better detection after snapping
            if (gap > 5 || horizontalAlign > 5) {
                console.log(`  ✗ Vertical alignment failed: gap=${gap.toFixed(1)}px, hAlign=${horizontalAlign.toFixed(1)}px`);
                return false;
            }
        }
    }
    
    console.log(`  ✓ Pieces correctly connected: ${formedWord} (${orientation})`);
    return true;
}

function markWordAsComplete(wordIndex, wordPieces) {
    // Mark all pieces as completed and locked
    wordPieces.forEach(piece => {
        piece.element.classList.add('completed', 'locked');
        piece.completed = true;
    });
    
    console.log(`🔒 Word locked: ${puzzleData.words[wordIndex].word}`);
    
    // Track word completion in Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'word_completed', {
            'word_name': puzzleData.words[wordIndex].word,
            'puzzle_name': document.title
        });
    }
    
    // Play success sound
    const successSound = document.getElementById('success-sound');
    if (successSound) {
        // Reset and play (in case multiple words complete quickly)
        successSound.currentTime = 0;
        successSound.play().catch(err => {
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
            'total_words': puzzleData.words.length
        });
    }
    
    // Populate facts list
    factsList.innerHTML = '';
    puzzleData.words.forEach(wordData => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${wordData.word}:</strong> ${wordData.fact}`;
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
    document.addEventListener('DOMContentLoaded', () => {
        // Increased delay to ensure viewport is stable
        setTimeout(init, 200);
    });
} else {
    // Document already loaded, still wait for stability
    setTimeout(init, 200);
}

// Also listen for window load as backup
window.addEventListener('load', () => {
    // Recalculate if not initialized yet
    if (pieces.length === 0) {
        console.log('🔄 Backup initialization triggered');
        init();
    }
});

console.log('🎮 Bonza Word Puzzle - Script Loaded');
console.log('📏 Initial CELL_SIZE:', CELL_SIZE + 'px (will recalculate on init)');
